import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  subscribe,
  unsubscribe,
  listSubscribers,
  sendBlast,
  listBlasts,
  getStats,
  testEmailConfig,
} from '../controllers/newsletter.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// ── Public ────────────────────────────────────────────────────────────────────

router.post(
  '/subscribe',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validateRequest,
  subscribe
)

// Renders an HTML unsubscribe confirmation page (linked from email footer)
router.get(
  '/unsubscribe/:token',
  param('token').notEmpty(),
  validateRequest,
  unsubscribe
)

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get('/subscribers', authenticate, requireAdmin, listSubscribers)
router.get('/blasts',      authenticate, requireAdmin, listBlasts)
router.get('/stats',       authenticate, requireAdmin, getStats)

// Test SMTP — GET /api/newsletter/test-email?to=you@example.com
router.get('/test-email',  authenticate, requireAdmin, testEmailConfig)

router.post(
  '/blast',
  authenticate,
  requireAdmin,
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  validateRequest,
  sendBlast
)

export default router
