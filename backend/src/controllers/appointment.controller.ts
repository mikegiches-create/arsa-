import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapAppointment = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  userId: row.user_id,
  propertyId: row.property_id,
  scheduledAt: row.scheduled_at,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: row.user_email ? {
    id: row.user_id,
    email: row.user_email,
    firstName: row.user_first_name,
    lastName: row.user_last_name,
  } : null,
  property: row.property_title ? {
    id: row.property_id,
    title: row.property_title,
    address: row.property_address,
  } : null,
})

const APPT_SELECT = `
  SELECT a.*,
    u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
    p.title AS property_title, p.address AS property_address
  FROM appointments a
  LEFT JOIN users u ON u.id = a.user_id
  LEFT JOIN properties p ON p.id = a.property_id
`

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { title, description, propertyId, scheduledAt } = req.body

    const property = await queryOne('SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL', [propertyId])
    if (!property) throw new NotFoundError('Property')

    const id = uuidv4()
    await execute(
      'INSERT INTO appointments (id, title, description, user_id, property_id, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, description ?? null, req.user.id, propertyId, new Date(scheduledAt)]
    )

    const row = await queryOne<any>(`${APPT_SELECT} WHERE a.id = ?`, [id])
    logger.info(`Appointment created: ${id} by ${req.user.email}`)
    sendSuccess(res, mapAppointment(row), 'Appointment created successfully', 201)
  } catch (error) {
    logger.error('Create appointment error:', error)
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to create appointment' })
    }
  }
}

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const status = (req.query.status as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    if (req.user.role !== 'ADMIN') {
      conditions.push('a.user_id = ?')
      params.push(req.user.id)
    }
    if (status) { conditions.push('a.status = ?'); params.push(status) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows, countRows] = await Promise.all([
      query<any>(
        `${APPT_SELECT} ${where} ORDER BY a.scheduled_at ASC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM appointments a ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapAppointment), total, page, limit, 'Appointments retrieved successfully')
  } catch (error) {
    logger.error('Get appointments error:', error)
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve appointments' })
    }
  }
}

export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const row = await queryOne<any>(`${APPT_SELECT} WHERE a.id = ?`, [id])
    if (!row) throw new NotFoundError('Appointment')

    if (row.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only view your own appointments')
    }

    sendSuccess(res, mapAppointment(row), 'Appointment retrieved successfully')
  } catch (error) {
    logger.error('Get appointment by ID error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve appointment' })
    }
  }
}

export const updateAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, user_id FROM appointments WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Appointment')

    if (existing.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only update your own appointments')
    }

    const { title, description, scheduledAt, status } = req.body

    const sets: string[] = []
    const params: any[] = []

    if (title       !== undefined) { sets.push('title = ?');        params.push(title) }
    if (description !== undefined) { sets.push('description = ?');  params.push(description) }
    if (scheduledAt !== undefined) { sets.push('scheduled_at = ?'); params.push(new Date(scheduledAt)) }
    if (status      !== undefined) { sets.push('status = ?');       params.push(status) }

    if (sets.length > 0) {
      params.push(id)
      await execute(`UPDATE appointments SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const row = await queryOne<any>(`${APPT_SELECT} WHERE a.id = ?`, [id])
    logger.info(`Appointment updated: ${id} by ${req.user.email}`)
    sendSuccess(res, mapAppointment(row), 'Appointment updated successfully')
  } catch (error) {
    logger.error('Update appointment error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update appointment' })
    }
  }
}

export const deleteAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { id } = req.params
    const existing = await queryOne<any>('SELECT id, user_id FROM appointments WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Appointment')

    if (existing.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own appointments')
    }

    await execute('DELETE FROM appointments WHERE id = ?', [id])
    logger.info(`Appointment deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Appointment deleted successfully')
  } catch (error) {
    logger.error('Delete appointment error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete appointment' })
    }
  }
}
