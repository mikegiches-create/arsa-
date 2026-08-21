import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapMessage = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  subject: row.subject,
  body: row.body,
  userId: row.user_id,
  propertyId: row.property_id,
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
  } : null,
})

export const createMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, body, propertyId } = req.body

    const id = uuidv4()
    await execute(
      'INSERT INTO messages (id, name, email, phone, subject, body, user_id, property_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone ?? null, subject, body, req.user?.id ?? null, propertyId ?? null]
    )

    const message = await queryOne<any>('SELECT * FROM messages WHERE id = ?', [id])
    logger.info(`Message created: ${id} from ${email}`)
    sendSuccess(res, mapMessage(message), 'Message sent successfully', 201)
  } catch (error) {
    logger.error('Create message error:', error)
    res.status(500).json({ success: false, message: 'Failed to send message' })
  }
}

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can view all messages')

    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const status = (req.query.status as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []
    if (status) { conditions.push('m.status = ?'); params.push(status) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT m.*,
           u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
           p.title AS property_title
         FROM messages m
         LEFT JOIN users u ON u.id = m.user_id
         LEFT JOIN properties p ON p.id = m.property_id
         ${where}
         ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM messages m ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapMessage), total, page, limit, 'Messages retrieved successfully')
  } catch (error) {
    logger.error('Get messages error:', error)
    if (error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve messages' })
    }
  }
}

export const getMessageById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can view messages')

    const { id } = req.params

    const row = await queryOne<any>(
      `SELECT m.*,
         u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
         p.title AS property_title
       FROM messages m
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN properties p ON p.id = m.property_id
       WHERE m.id = ?`,
      [id]
    )
    if (!row) throw new NotFoundError('Message')

    await execute("UPDATE messages SET status = 'READ' WHERE id = ? AND status = 'UNREAD'", [id])

    sendSuccess(res, mapMessage(row), 'Message retrieved successfully')
  } catch (error) {
    logger.error('Get message by ID error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve message' })
    }
  }
}

export const updateMessageStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update message status')

    const { id } = req.params
    const { status } = req.body

    const valid = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED']
    if (!valid.includes(status)) throw new ValidationError('Invalid status')

    const existing = await queryOne('SELECT id FROM messages WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Message')

    await execute('UPDATE messages SET status = ? WHERE id = ?', [status, id])

    const updated = await queryOne<any>('SELECT * FROM messages WHERE id = ?', [id])
    logger.info(`Message status updated: ${id} to ${status}`)
    sendSuccess(res, mapMessage(updated), 'Message status updated successfully')
  } catch (error) {
    logger.error('Update message status error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update message status' })
    }
  }
}

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete messages')

    const { id } = req.params
    const existing = await queryOne('SELECT id FROM messages WHERE id = ?', [id])
    if (!existing) throw new NotFoundError('Message')

    await execute('DELETE FROM messages WHERE id = ?', [id])
    logger.info(`Message deleted: ${id} by ${req.user.email}`)
    sendSuccess(res, {}, 'Message deleted successfully')
  } catch (error) {
    logger.error('Delete message error:', error)
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete message' })
    }
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can view unread count')

    const rows = await query<any>("SELECT COUNT(*) AS total FROM messages WHERE status = 'UNREAD'")
    sendSuccess(res, { count: rows[0]?.total ?? 0 }, 'Unread count retrieved successfully')
  } catch (error) {
    logger.error('Get unread count error:', error)
    if (error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to get unread count' })
    }
  }
}
