import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { generateTokens, verifyRefreshToken } from '../utils/jwt'
import { hashPassword, comparePassword } from '../utils/password'
import { sendSuccess, sendError } from '../utils/response'
import { ValidationError, AuthenticationError, ConflictError, NotFoundError } from '../utils/errors'
import { query, queryOne, execute } from '../lib/db'
import logger from '../utils/logger'

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body

    const existing = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    if (existing) throw new ConflictError('Email already registered')

    const hashedPassword = await hashPassword(password)
    const id = uuidv4()

    await execute(
      `INSERT INTO users (id, email, password, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?, 'USER')`,
      [id, email, hashedPassword, firstName, lastName]
    )

    const { accessToken, refreshToken } = generateTokens({ id, email, role: 'USER' })

    logger.info(`User registered: ${email}`)
    sendSuccess(res, {
      user: { id, email, firstName, lastName, role: 'USER' },
      accessToken,
      refreshToken,
    }, 'User registered successfully', 201)
  } catch (error) {
    logger.error('Signup error:', error)
    if (error instanceof ConflictError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Registration failed' })
    }
  }
}

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    const user = await queryOne<any>(
      'SELECT id, email, password, first_name, last_name, role, is_active FROM users WHERE email = ?',
      [email]
    )
    if (!user) throw new AuthenticationError('Invalid email or password')

    const isValid = await comparePassword(password, user.password)
    if (!isValid) throw new AuthenticationError('Invalid email or password')

    if (!user.is_active) throw new AuthenticationError('Account is inactive')

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    logger.info(`User logged in: ${email}`)
    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }, 'Login successful')
  } catch (error) {
    logger.error('Login error:', error)
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Login failed' })
    }
  }
}

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info(`User logged out: ${req.user?.email}`)
    sendSuccess(res, {}, 'Logout successful')
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' })
  }
}

export const refreshAccessToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new ValidationError('Refresh token is required')

    const payload = verifyRefreshToken(refreshToken)

    const user = await queryOne<any>(
      'SELECT id, email, role, is_active FROM users WHERE id = ?',
      [payload.id]
    )
    if (!user || !user.is_active) throw new AuthenticationError('Invalid refresh token')

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed')
  } catch (error) {
    logger.error('Token refresh error:', error)
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Token refresh failed' })
    }
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AuthenticationError('User not authenticated')

    const user = await queryOne<any>(
      `SELECT id, email, first_name, last_name, phone, avatar, role,
              bio, address, city, state, zip_code, country, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    )
    if (!user) throw new NotFoundError('User')

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      country: user.country,
      isActive: user.is_active,
      createdAt: user.created_at,
    }, 'User retrieved successfully')
  } catch (error) {
    logger.error('Get current user error:', error)
    if (error instanceof NotFoundError || error instanceof AuthenticationError) {
      res.status(error.statusCode).json({ success: false, message: error.message })
    } else {
      res.status(500).json({ success: false, message: 'Failed to get user' })
    }
  }
}
