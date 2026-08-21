import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess } from '../utils/response'
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

const mapSetting = (row: any) => ({
  id: row.id,
  key: row.key,
  value: row.value,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<any>('SELECT * FROM settings ORDER BY `key` ASC')
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    sendSuccess(res, map, 'Settings retrieved successfully')
  } catch (error) {
    logger.error('Get settings error:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve settings' })
  }
}

export const getSettingByKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params
    const row = await queryOne<any>('SELECT * FROM settings WHERE `key` = ?', [key])
    if (!row) throw new NotFoundError('Setting')
    sendSuccess(res, mapSetting(row), 'Setting retrieved successfully')
  } catch (error) {
    logger.error('Get setting by key error:', error)
    if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to retrieve setting' })
    }
  }
}

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update settings')

    const { key } = req.params
    const { value, description } = req.body

    if (!value) throw new ValidationError('Value is required')

    const existing = await queryOne('SELECT id FROM settings WHERE `key` = ?', [key])

    if (existing) {
      await execute(
        'UPDATE settings SET value = ?, description = COALESCE(?, description) WHERE `key` = ?',
        [value, description ?? null, key]
      )
    } else {
      await execute(
        'INSERT INTO settings (id, `key`, value, description) VALUES (?, ?, ?, ?)',
        [uuidv4(), key, value, description ?? null]
      )
    }

    const row = await queryOne<any>('SELECT * FROM settings WHERE `key` = ?', [key])
    logger.info(`Setting updated: ${key} by ${req.user.email}`)
    sendSuccess(res, mapSetting(row), 'Setting updated successfully')
  } catch (error) {
    logger.error('Update setting error:', error)
    if (error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update setting' })
    }
  }
}

export const updateMultipleSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can update settings')

    const settings = req.body
    if (!settings || typeof settings !== 'object') throw new ValidationError('Settings must be an object')

    const updated: Record<string, string> = {}

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') throw new ValidationError(`Value for ${key} must be a string`)

      const existing = await queryOne('SELECT id FROM settings WHERE `key` = ?', [key])
      if (existing) {
        await execute('UPDATE settings SET value = ? WHERE `key` = ?', [value, key])
      } else {
        await execute(
          'INSERT INTO settings (id, `key`, value) VALUES (?, ?, ?)',
          [uuidv4(), key, value]
        )
      }
      updated[key] = value
    }

    logger.info(`Multiple settings updated by ${req.user.email}`)
    sendSuccess(res, updated, 'Settings updated successfully')
  } catch (error) {
    logger.error('Update multiple settings error:', error)
    if (error instanceof AuthorizationError || error instanceof ValidationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to update settings' })
    }
  }
}

export const deleteSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') throw new AuthorizationError('Only admins can delete settings')

    const { key } = req.params
    const existing = await queryOne('SELECT id FROM settings WHERE `key` = ?', [key])
    if (!existing) throw new NotFoundError('Setting')

    await execute('DELETE FROM settings WHERE `key` = ?', [key])
    logger.info(`Setting deleted: ${key} by ${req.user.email}`)
    sendSuccess(res, {}, 'Setting deleted successfully')
  } catch (error) {
    logger.error('Delete setting error:', error)
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete setting' })
    }
  }
}
