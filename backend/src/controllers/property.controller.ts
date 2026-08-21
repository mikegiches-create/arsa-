import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

// Helper: parse images JSON column safely
const parseImages = (raw: any): string[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

// Helper: map a DB row to a property object
const mapProperty = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  price: row.price,
  type: row.type,
  status: row.status,
  address: row.address,
  city: row.city,
  state: row.state,
  zipCode: row.zip_code,
  country: row.country,
  latitude: row.latitude,
  longitude: row.longitude,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  squareFeet: row.square_feet,
  yearBuilt: row.year_built,
  images: parseImages(row.images),
  thumbnail: row.thumbnail,
  featured: !!row.featured,
  views: row.views,
  categoryId: row.category_id,
  locationId: row.location_id,
  agentId: row.agent_id,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  category: row.category_name ? { id: row.category_id, name: row.category_name, slug: row.category_slug } : undefined,
  location: row.location_name ? { id: row.location_id, name: row.location_name, slug: row.location_slug } : undefined,
  agent: row.agent_first_name ? {
    id: row.agent_id,
    firstName: row.agent_first_name,
    lastName: row.agent_last_name,
    email: row.agent_email,
    phone: row.agent_phone,
    avatar: row.agent_avatar,
  } : undefined,
  owner: row.owner_email ? {
    id: row.owner_id,
    email: row.owner_email,
    firstName: row.owner_first_name,
    lastName: row.owner_last_name,
  } : undefined,
})

const PROPERTY_JOIN = `
  FROM properties p
  LEFT JOIN categories c  ON p.category_id = c.id
  LEFT JOIN locations  lo ON p.location_id  = lo.id
  LEFT JOIN agents     a  ON p.agent_id     = a.id
  LEFT JOIN users      u  ON p.owner_id     = u.id
`

const PROPERTY_SELECT = `
  SELECT p.*,
    c.name  AS category_name,  c.slug AS category_slug,
    lo.name AS location_name, lo.slug AS location_slug,
    a.first_name AS agent_first_name, a.last_name AS agent_last_name,
    a.email AS agent_email, a.phone AS agent_phone, a.avatar AS agent_avatar,
    u.email AS owner_email, u.first_name AS owner_first_name, u.last_name AS owner_last_name
`

export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const {
      title, description, price, type, address, city, state, zipCode, country,
      bedrooms, bathrooms, squareFeet, yearBuilt, categoryId, locationId, agentId,
      images, thumbnail,
    } = req.body

    const id = uuidv4()

    await execute(
      `INSERT INTO properties
         (id, title, description, price, type, address, city, state, zip_code, country,
          bedrooms, bathrooms, square_feet, year_built, category_id, location_id, agent_id,
          owner_id, images, thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, parseFloat(price), type, address, city, state, zipCode, country,
        parseInt(bedrooms), parseInt(bathrooms), parseInt(squareFeet),
        yearBuilt ? parseInt(yearBuilt) : null,
        categoryId, locationId, agentId, req.user.id,
        JSON.stringify(images || []), thumbnail ?? null,
      ]
    )

    const row = await queryOne<any>(
      `${PROPERTY_SELECT} ${PROPERTY_JOIN} WHERE p.id = ?`,
      [id]
    )

    logger.info(`Property created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapProperty(row), 'Property created successfully', 201)
  } catch (error) {
    logger.error('Create property error:', error)
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create property' })
    }
  }
}

export const getProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page       = parseInt(req.query.page as string)     || 1
    const limit      = parseInt(req.query.limit as string)    || 12
    const search     = (req.query.search     as string) || ''
    const categoryId = (req.query.categoryId as string) || ''
    const locationId = (req.query.locationId as string) || ''
    const status     = (req.query.status     as string) || ''
    const minPrice   = (req.query.minPrice   as string) || ''
    const maxPrice   = (req.query.maxPrice   as string) || ''
    const type       = (req.query.type       as string) || ''
    const sortBy     = (req.query.sortBy     as string) || 'created_at'
    const sortOrder  = (req.query.sortOrder  as string) === 'asc' ? 'ASC' : 'DESC'
    const skip       = (page - 1) * limit

    const allowed = ['created_at', 'price', 'views', 'title']
    const orderCol = allowed.includes(sortBy) ? sortBy : 'created_at'

    const conditions: string[] = ['p.deleted_at IS NULL']
    const params: any[] = []

    if (search) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like, like)
    }
    if (categoryId) { conditions.push('p.category_id = ?'); params.push(categoryId) }
    if (locationId) { conditions.push('p.location_id = ?'); params.push(locationId) }
    if (status)     { conditions.push('p.status = ?');      params.push(status) }
    if (type)       { conditions.push('p.type = ?');        params.push(type) }
    if (minPrice)   { conditions.push('p.price >= ?');      params.push(parseFloat(minPrice)) }
    if (maxPrice)   { conditions.push('p.price <= ?');      params.push(parseFloat(maxPrice)) }

    const where = `WHERE ${conditions.join(' AND ')}`

    const [rows, countRows] = await Promise.all([
      query<any>(
        `${PROPERTY_SELECT} ${PROPERTY_JOIN} ${where}
         ORDER BY p.${orderCol} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM properties p ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapProperty), total, page, limit, 'Properties retrieved successfully')
  } catch (error) {
    logger.error('Get properties error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve properties' })
  }
}

export const getPropertyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const row = await queryOne<any>(
      `${PROPERTY_SELECT} ${PROPERTY_JOIN} WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    )
    if (!row) throw new NotFoundError('Property')

    await execute('UPDATE properties SET views = views + 1 WHERE id = ?', [id])

    sendSuccess(res, mapProperty(row), 'Property retrieved successfully')
  } catch (error) {
    logger.error('Get property by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve property' })
    }
  }
}

export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, owner_id FROM properties WHERE id = ? AND deleted_at IS NULL', [id])
    if (!existing) throw new NotFoundError('Property')

    if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only update your own properties')
    }

    const {
      title, description, price, type, status, address, city, state, zipCode, country,
      bedrooms, bathrooms, squareFeet, yearBuilt, categoryId, locationId, agentId,
      images, thumbnail, featured,
    } = req.body

    const sets: string[] = []
    const params: any[] = []

    if (title       !== undefined) { sets.push('title = ?');        params.push(title) }
    if (description !== undefined) { sets.push('description = ?');  params.push(description) }
    if (price       !== undefined) { sets.push('price = ?');         params.push(parseFloat(price)) }
    if (type        !== undefined) { sets.push('type = ?');          params.push(type) }
    if (status      !== undefined) { sets.push('status = ?');        params.push(status) }
    if (address     !== undefined) { sets.push('address = ?');       params.push(address) }
    if (city        !== undefined) { sets.push('city = ?');          params.push(city) }
    if (state       !== undefined) { sets.push('state = ?');         params.push(state) }
    if (zipCode     !== undefined) { sets.push('zip_code = ?');      params.push(zipCode) }
    if (country     !== undefined) { sets.push('country = ?');       params.push(country) }
    if (bedrooms    !== undefined) { sets.push('bedrooms = ?');      params.push(parseInt(bedrooms)) }
    if (bathrooms   !== undefined) { sets.push('bathrooms = ?');     params.push(parseInt(bathrooms)) }
    if (squareFeet  !== undefined) { sets.push('square_feet = ?');   params.push(parseInt(squareFeet)) }
    if (yearBuilt   !== undefined) { sets.push('year_built = ?');    params.push(parseInt(yearBuilt)) }
    if (categoryId  !== undefined) { sets.push('category_id = ?');  params.push(categoryId) }
    if (locationId  !== undefined) { sets.push('location_id = ?');  params.push(locationId) }
    if (agentId     !== undefined) { sets.push('agent_id = ?');      params.push(agentId) }
    if (images      !== undefined) { sets.push('images = ?');        params.push(JSON.stringify(images)) }
    if (thumbnail   !== undefined) { sets.push('thumbnail = ?');     params.push(thumbnail) }
    if (featured    !== undefined) { sets.push('featured = ?');      params.push(featured ? 1 : 0) }

    if (sets.length === 0) throw new ValidationError('No fields to update')

    params.push(id)
    await execute(`UPDATE properties SET ${sets.join(', ')} WHERE id = ?`, params)

    const row = await queryOne<any>(
      `${PROPERTY_SELECT} ${PROPERTY_JOIN} WHERE p.id = ?`,
      [id]
    )

    logger.info(`Property updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapProperty(row), 'Property updated successfully')
  } catch (error) {
    logger.error('Update property error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update property' })
    }
  }
}

export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, owner_id FROM properties WHERE id = ? AND deleted_at IS NULL', [id])
    if (!existing) throw new NotFoundError('Property')

    if (existing.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own properties')
    }

    await execute('UPDATE properties SET deleted_at = NOW() WHERE id = ?', [id])

    logger.info(`Property deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Property deleted successfully')
  } catch (error) {
    logger.error('Delete property error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete property' })
    }
  }
}

export const saveProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { propertyId } = req.body

    const property = await queryOne('SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL', [propertyId])
    if (!property) throw new NotFoundError('Property')

    const existing = await queryOne(
      'SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?',
      [req.user.id, propertyId]
    )

    if (existing) {
      await execute('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?', [req.user.id, propertyId])
      sendSuccess(res, {}, 'Property removed from saved')
    } else {
      await execute(
        'INSERT INTO saved_properties (id, user_id, property_id) VALUES (?, ?, ?)',
        [uuidv4(), req.user.id, propertyId]
      )
      sendSuccess(res, {}, 'Property saved successfully', 201)
    }
  } catch (error) {
    logger.error('Save property error:', error)
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to save property' })
    }
  }
}

export const getFeaturedProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 6

    const rows = await query<any>(
      `${PROPERTY_SELECT} ${PROPERTY_JOIN}
       WHERE p.featured = 1 AND p.status = 'AVAILABLE' AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    )

    sendSuccess(res, rows.map(mapProperty), 'Featured properties retrieved successfully')
  } catch (error) {
    logger.error('Get featured properties error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve featured properties' })
  }
}
