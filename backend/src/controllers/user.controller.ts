import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import { hashPassword, comparePassword } from '../utils/password'
import logger from '../utils/logger'

const mapUser = (row: any) => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  avatar: row.avatar,
  role: row.role,
  bio: row.bio,
  address: row.address,
  city: row.city,
  state: row.state,
  zipCode: row.zip_code,
  country: row.country,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { firstName, lastName, phone, bio, address, city, state, zipCode, country, avatar } = req.body

    const sets: string[] = []
    const params: any[] = []

    if (firstName !== undefined) { sets.push('first_name = ?'); params.push(firstName) }
    if (lastName  !== undefined) { sets.push('last_name = ?');  params.push(lastName) }
    if (phone     !== undefined) { sets.push('phone = ?');      params.push(phone) }
    if (bio       !== undefined) { sets.push('bio = ?');        params.push(bio) }
    if (address   !== undefined) { sets.push('address = ?');    params.push(address) }
    if (city      !== undefined) { sets.push('city = ?');       params.push(city) }
    if (state     !== undefined) { sets.push('state = ?');      params.push(state) }
    if (zipCode   !== undefined) { sets.push('zip_code = ?');   params.push(zipCode) }
    if (country   !== undefined) { sets.push('country = ?');    params.push(country) }
    if (avatar    !== undefined) { sets.push('avatar = ?');     params.push(avatar) }

    if (sets.length > 0) {
      params.push(req.user.id)
      await execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params)
    }

    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [req.user.id])
    logger.info(`User profile updated: ${req.user.email}`)
    sendSuccess(res, mapUser(user), 'Profile updated successfully')
  } catch (error) {
    logger.error('Update profile error:', error)
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update profile' })
    }
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const { currentPassword, newPassword } = req.body

    const user = await queryOne<any>('SELECT id, password FROM users WHERE id = ?', [req.user.id])
    if (!user) throw new NotFoundError('User')

    const isValid = await comparePassword(currentPassword, user.password)
    if (!isValid) throw new ValidationError('Current password is incorrect')

    const hashed = await hashPassword(newPassword)
    await execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id])

    logger.info(`User password changed: ${req.user.email}`)
    sendSuccess(res, {}, 'Password changed successfully')
  } catch (error) {
    logger.error('Change password error:', error)
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to change password' })
    }
  }
}

export const getSavedProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated')

    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip  = (page - 1) * limit

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT p.* FROM saved_properties sp
         JOIN properties p ON p.id = sp.property_id AND p.deleted_at IS NULL
         WHERE sp.user_id = ?
         ORDER BY sp.created_at DESC
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, skip]
      ),
      query<any>(
        'SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?',
        [req.user.id]
      ),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows, total, page, limit, 'Saved properties retrieved successfully')
  } catch (error) {
    logger.error('Get saved properties error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve saved properties' })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can access this endpoint')

    const page  = parseInt(req.query.page  as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const skip  = (page - 1) * limit

    const conditions: string[] = ['deleted_at IS NULL']
    const params: any[] = []

    if (search) {
      conditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }

    const where = `WHERE ${conditions.join(' AND ')}`

    const [rows, countRows] = await Promise.all([
      query<any>(
        `SELECT id, email, first_name, last_name, phone, avatar, role, is_active, created_at
         FROM users ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      ),
      query<any>(`SELECT COUNT(*) AS total FROM users ${where}`, params),
    ])

    const total = countRows[0]?.total ?? 0
    sendPaginated(res, rows.map(mapUser), total, page, limit, 'Users retrieved successfully')
  } catch (error) {
    logger.error('Get all users error:', error)
    if (error instanceof AuthorizationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve users' })
    }
  }
}

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const user = await queryOne<any>(
      'SELECT id, email, first_name, last_name, phone, avatar, role, bio, address, city, state, zip_code, country, is_active, created_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    )
    if (!user) throw new NotFoundError('User')

    sendSuccess(res, mapUser(user), 'User retrieved successfully')
  } catch (error) {
    logger.error('Get user by ID error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve user' })
    }
  }
}

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete users')

    const { id } = req.params
    if (id === req.user.id) throw new ValidationError('You cannot delete your own account')

    await execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id])
    logger.info(`User deleted by admin: ${id}`)
    sendSuccess(res, {}, 'User deleted successfully')
  } catch (error) {
    logger.error('Delete user error:', error)
    if (error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete user' })
    }
  }
}
