import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError, ConflictError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapAgent = (row: any) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  avatar: row.avatar,
  bio: row.bio,
  license: row.license,
  propertyCount: row.property_count ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const createAgent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can create agents')

    const { firstName, lastName, email, phone, avatar, bio, license } = req.body

    const existing = await queryOne('SELECT id FROM agents WHERE email = ?', [email])
    if (existing) throw new ConflictError('Agent with this email already exists')

    const id = uuidv4()
    await execute(
      'INSERT INTO agents (id, first_name, last_name, email, phone, avatar, bio, license) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, firstName, lastName, email, phone, avatar ?? null, bio ?? null, license ?? null]
    )

    const agent = await queryOne<any>('SELECT * FROM agents WHERE id = ?', [id])
    logger.info(`Agent created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapAgent(agent), 'Agent created successfully', 201)
  } catch (error) {
    logger.error('Create agent error:', error)
    if (error instanceof AuthorizationError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create agent' })
    }
  }
}

export const getAgents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = ['a.deleted_at IS NULL']
    const params: any[] = []

    if (search) {
      conditions.push('(a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT a.*, COUNT(p.id) AS property_count
         FROM agents a
         LEFT JOIN properties p ON p.agent_id = a.id AND p.deleted_at IS NULL
         ${where}
         GROUP BY a.id
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM agents a ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapAgent), total, page, limit, 'Agents retrieved successfully')
  } catch (error) {
    logger.error('Get agents error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve agents' })
  }
}

export const getAgentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const agent = await queryOne<any>(
      'SELECT * FROM agents WHERE id = ? AND deleted_at IS NULL', [id]
    )
    if (!agent) throw new NotFoundError('Agent')

    const properties = await query<any>(
      'SELECT id, title, price, thumbnail FROM properties WHERE agent_id = ? AND deleted_at IS NULL LIMIT 10',
      [id]
    )

    sendSuccess(res, { ...mapAgent(agent), properties }, 'Agent retrieved successfully')
  } catch (error) {
    logger.error('Get agent by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve agent' })
    }
  }
}

export const updateAgent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update agents')

    const { id } = req.params
    const agent = await queryOne<any>('SELECT * FROM agents WHERE id = ? AND deleted_at IS NULL', [id])
    if (!agent) throw new NotFoundError('Agent')

    const { firstName, lastName, email, phone, avatar, bio, license } = req.body

    if (email && email !== agent.email) {
      const dup = await queryOne('SELECT id FROM agents WHERE email = ?', [email])
      if (dup) throw new ConflictError('Agent with this email already exists')
    }

    const sets: string[] = []
    const params: any[] = []

    if (firstName !== undefined) { sets.push('first_name = ?'); params.push(firstName) }
    if (lastName  !== undefined) { sets.push('last_name = ?');  params.push(lastName) }
    if (email     !== undefined) { sets.push('email = ?');      params.push(email) }
    if (phone     !== undefined) { sets.push('phone = ?');      params.push(phone) }
    if (avatar    !== undefined) { sets.push('avatar = ?');     params.push(avatar) }
    if (bio       !== undefined) { sets.push('bio = ?');        params.push(bio) }
    if (license   !== undefined) { sets.push('license = ?');    params.push(license) }

    if (sets.length > 0) {
      params.push(id)
      await execute(`UPDATE agents SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const updated = await queryOne<any>('SELECT * FROM agents WHERE id = ?', [id])
    logger.info(`Agent updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapAgent(updated), 'Agent updated successfully')
  } catch (error) {
    logger.error('Update agent error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update agent' })
    }
  }
}

export const deleteAgent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete agents')

    const { id } = req.params
    const agent = await queryOne('SELECT id FROM agents WHERE id = ? AND deleted_at IS NULL', [id])
    if (!agent) throw new NotFoundError('Agent')

    await execute('UPDATE agents SET deleted_at = NOW() WHERE id = ?', [id])
    logger.info(`Agent deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Agent deleted successfully')
  } catch (error) {
    logger.error('Delete agent error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete agent' })
    }
  }
}
