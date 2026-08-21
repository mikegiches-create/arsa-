import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError, ConflictError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapCategory = (row: any) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  icon: row.icon,
  propertyCount: row.property_count ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can create categories')

    const { name, slug, description, icon } = req.body

    const existing = await queryOne('SELECT id FROM categories WHERE slug = ?', [slug])
    if (existing) throw new ConflictError('Category with this slug already exists')

    const id = uuidv4()
    await execute(
      'INSERT INTO categories (id, name, slug, description, icon) VALUES (?, ?, ?, ?, ?)',
      [id, name, slug, description ?? null, icon ?? null]
    )

    const category = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id])
    logger.info(`Category created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapCategory(category), 'Category created successfully', 201)
  } catch (error) {
    logger.error('Create category error:', error)
    if (error instanceof AuthorizationError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create category' })
    }
  }
}

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)')
      const like = `%${search}%`
      params.push(like, like)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT c.*, COUNT(p.id) AS property_count
         FROM categories c
         LEFT JOIN properties p ON p.category_id = c.id AND p.deleted_at IS NULL
         ${where}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM categories c ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapCategory), total, page, limit, 'Categories retrieved successfully')
  } catch (error) {
    logger.error('Get categories error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve categories' })
  }
}

export const getCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const category = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id])
    if (!category) throw new NotFoundError('Category')

    const properties = await query<any>(
      'SELECT id, title, price, thumbnail FROM properties WHERE category_id = ? AND deleted_at IS NULL LIMIT 10',
      [id]
    )

    sendSuccess(res, { ...mapCategory(category), properties }, 'Category retrieved successfully')
  } catch (error) {
    logger.error('Get category by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve category' })
    }
  }
}

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update categories')

    const { id } = req.params
    const category = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id])
    if (!category) throw new NotFoundError('Category')

    const { name, slug, description, icon } = req.body

    if (slug && slug !== category.slug) {
      const dup = await queryOne('SELECT id FROM categories WHERE slug = ?', [slug])
      if (dup) throw new ConflictError('Category with this slug already exists')
    }

    const sets: string[] = []
    const params: any[] = []

    if (name        !== undefined) { sets.push('name = ?');        params.push(name) }
    if (slug        !== undefined) { sets.push('slug = ?');        params.push(slug) }
    if (description !== undefined) { sets.push('description = ?'); params.push(description) }
    if (icon        !== undefined) { sets.push('icon = ?');        params.push(icon) }

    if (sets.length > 0) {
      params.push(id)
      await execute(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const updated = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id])
    logger.info(`Category updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapCategory(updated), 'Category updated successfully')
  } catch (error) {
    logger.error('Update category error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update category' })
    }
  }
}

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete categories')

    const { id } = req.params
    const category = await queryOne<any>(
      'SELECT c.id, COUNT(p.id) AS property_count FROM categories c LEFT JOIN properties p ON p.category_id = c.id AND p.deleted_at IS NULL WHERE c.id = ? GROUP BY c.id',
      [id]
    )
    if (!category) throw new NotFoundError('Category')
    if (category.property_count > 0) throw new ValidationError('Cannot delete category with existing properties')

    await execute('DELETE FROM categories WHERE id = ?', [id])
    logger.info(`Category deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Category deleted successfully')
  } catch (error) {
    logger.error('Delete category error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete category' })
    }
  }
}
