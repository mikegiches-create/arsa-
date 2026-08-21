import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError, ConflictError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapLocation = (row: any) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  image: row.image,
  propertyCount: row.property_count ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can create locations')

    const { name, slug, description, image } = req.body

    const existing = await queryOne('SELECT id FROM locations WHERE slug = ?', [slug])
    if (existing) throw new ConflictError('Location with this slug already exists')

    const id = uuidv4()
    await execute(
      'INSERT INTO locations (id, name, slug, description, image) VALUES (?, ?, ?, ?, ?)',
      [id, name, slug, description ?? null, image ?? null]
    )

    const location = await queryOne<any>('SELECT * FROM locations WHERE id = ?', [id])
    logger.info(`Location created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapLocation(location), 'Location created successfully', 201)
  } catch (error) {
    logger.error('Create location error:', error)
    if (error instanceof AuthorizationError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create location' })
    }
  }
}

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push('(lo.name LIKE ? OR lo.description LIKE ?)')
      const like = `%${search}%`
      params.push(like, like)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT lo.*, COUNT(p.id) AS property_count
         FROM locations lo
         LEFT JOIN properties p ON p.location_id = lo.id AND p.deleted_at IS NULL
         ${where}
         GROUP BY lo.id
         ORDER BY lo.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM locations lo ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapLocation), total, page, limit, 'Locations retrieved successfully')
  } catch (error) {
    logger.error('Get locations error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve locations' })
  }
}

export const getLocationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const location = await queryOne<any>('SELECT * FROM locations WHERE id = ?', [id])
    if (!location) throw new NotFoundError('Location')

    const properties = await query<any>(
      'SELECT id, title, price, thumbnail FROM properties WHERE location_id = ? AND deleted_at IS NULL LIMIT 10',
      [id]
    )

    sendSuccess(res, { ...mapLocation(location), properties }, 'Location retrieved successfully')
  } catch (error) {
    logger.error('Get location by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve location' })
    }
  }
}

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update locations')

    const { id } = req.params
    const location = await queryOne<any>('SELECT * FROM locations WHERE id = ?', [id])
    if (!location) throw new NotFoundError('Location')

    const { name, slug, description, image } = req.body

    if (slug && slug !== location.slug) {
      const dup = await queryOne('SELECT id FROM locations WHERE slug = ?', [slug])
      if (dup) throw new ConflictError('Location with this slug already exists')
    }

    const sets: string[] = []
    const params: any[] = []

    if (name        !== undefined) { sets.push('name = ?');        params.push(name) }
    if (slug        !== undefined) { sets.push('slug = ?');        params.push(slug) }
    if (description !== undefined) { sets.push('description = ?'); params.push(description) }
    if (image       !== undefined) { sets.push('image = ?');       params.push(image) }

    if (sets.length > 0) {
      params.push(id)
      await execute(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const updated = await queryOne<any>('SELECT * FROM locations WHERE id = ?', [id])
    logger.info(`Location updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapLocation(updated), 'Location updated successfully')
  } catch (error) {
    logger.error('Update location error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update location' })
    }
  }
}

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete locations')

    const { id } = req.params
    const location = await queryOne<any>(
      'SELECT lo.id, COUNT(p.id) AS property_count FROM locations lo LEFT JOIN properties p ON p.location_id = lo.id AND p.deleted_at IS NULL WHERE lo.id = ? GROUP BY lo.id',
      [id]
    )
    if (!location) throw new NotFoundError('Location')
    if (location.property_count > 0) throw new ValidationError('Cannot delete location with existing properties')

    await execute('DELETE FROM locations WHERE id = ?', [id])
    logger.info(`Location deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Location deleted successfully')
  } catch (error) {
    logger.error('Delete location error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete location' })
    }
  }
}
