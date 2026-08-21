import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapTestimonial = (row: any) => ({
  id: row.id,
  content: row.content,
  rating: row.rating,
  authorId: row.author_id,
  featured: !!row.featured,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: row.author_email ? {
    id: row.author_id,
    email: row.author_email,
    firstName: row.author_first_name,
    lastName: row.author_last_name,
    avatar: row.author_avatar,
  } : null,
})

const TESTI_SELECT = `
  SELECT t.*,
    u.email AS author_email, u.first_name AS author_first_name,
    u.last_name AS author_last_name, u.avatar AS author_avatar
  FROM testimonials t
  LEFT JOIN users u ON u.id = t.author_id
`

export const createTestimonial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { content, rating } = req.body
    const clampedRating = Math.min(Math.max(parseInt(rating) || 5, 1), 5)

    const id = uuidv4()
    await execute(
      'INSERT INTO testimonials (id, content, rating, author_id) VALUES (?, ?, ?, ?)',
      [id, content, clampedRating, req.user.id]
    )

    const row = await queryOne<any>(`${TESTI_SELECT} WHERE t.id = ?`, [id])
    logger.info(`Testimonial created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapTestimonial(row), 'Testimonial created successfully', 201)
  } catch (error) {
    logger.error('Create testimonial error:', error)
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create testimonial' })
    }
  }
}

export const getTestimonials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page     = parseInt(req.query.page  as string) || 1
    const limit    = parseInt(req.query.limit as string) || 10
    const featured = req.query.featured === 'true'
    const skip     = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []
    if (featured) { conditions.push('t.featured = 1') }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows, countRows] = await Promise.all([
      query<any>(
        `${TESTI_SELECT} ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM testimonials t ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapTestimonial), total, page, limit, 'Testimonials retrieved successfully')
  } catch (error) {
    logger.error('Get testimonials error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve testimonials' })
  }
}

export const getTestimonialById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const row = await queryOne<any>(`${TESTI_SELECT} WHERE t.id = ?`, [id])
    if (!row) throw new NotFoundError('Testimonial')

    sendSuccess(res, mapTestimonial(row), 'Testimonial retrieved successfully')
  } catch (error) {
    logger.error('Get testimonial by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve testimonial' })
    }
  }
}

export const updateTestimonial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, author_id FROM testimonials WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Testimonial')

    if (existing.author_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only update your own testimonials')
    }

    const { content, rating } = req.body
    const sets: string[] = []
    const params: any[] = []

    if (content !== undefined) { sets.push('content = ?'); params.push(content) }
    if (rating  !== undefined) { sets.push('rating = ?');  params.push(Math.min(Math.max(parseInt(rating), 1), 5)) }

    if (sets.length > 0) {
      params.push(id)
      await execute(`UPDATE testimonials SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const row = await queryOne<any>(`${TESTI_SELECT} WHERE t.id = ?`, [id])
    logger.info(`Testimonial updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapTestimonial(row), 'Testimonial updated successfully')
  } catch (error) {
    logger.error('Update testimonial error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update testimonial' })
    }
  }
}

export const deleteTestimonial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, author_id FROM testimonials WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Testimonial')

    if (existing.author_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own testimonials')
    }

    await execute('DELETE FROM testimonials WHERE id = ?', [id])
    logger.info(`Testimonial deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Testimonial deleted successfully')
  } catch (error) {
    logger.error('Delete testimonial error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete testimonial' })
    }
  }
}

export const toggleFeatured = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can feature testimonials')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, featured FROM testimonials WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Testimonial')

    const newFeatured = existing.featured ? 0 : 1
    await execute('UPDATE testimonials SET featured = ? WHERE id = ?', [newFeatured, id])

    const row = await queryOne<any>(`${TESTI_SELECT} WHERE t.id = ?`, [id])
    logger.info(`Testimonial featured toggled: ${id} by ${req.user.email}`)
    sendSuccess(res, mapTestimonial(row), 'Testimonial featured status updated')
  } catch (error) {
    logger.error('Toggle featured error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to toggle featured status' })
    }
  }
}
