import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import config from './config/index'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { morganMiddleware, requestLogger } from './middleware/logging'

// Routes
import authRoutes        from './routes/auth.routes'
import userRoutes        from './routes/user.routes'
import propertyRoutes    from './routes/property.routes'
import categoryRoutes    from './routes/category.routes'
import locationRoutes    from './routes/location.routes'
import agentRoutes       from './routes/agent.routes'
import testimonialRoutes from './routes/testimonial.routes'
import messageRoutes     from './routes/message.routes'
import appointmentRoutes from './routes/appointment.routes'
import settingsRoutes    from './routes/settings.routes'
import uploadRoutes      from './routes/upload.routes'
import newsletterRoutes  from './routes/newsletter.routes'

const app: Application = express()

// ── Trust Render's proxy (needed for correct IP in rate limiter) ──────────────
app.set('trust proxy', 1)

// ── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8443',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, cb) => {
      // No origin = server-to-server (curl, Postman) — always allow
      if (!origin) return cb(null, true)
      // Allow any onrender.com subdomain (covers preview deploys too)
      if (origin.endsWith('.onrender.com')) return cb(null, true)
      // Allow whitelisted local origins
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ── Static uploads ────────────────────────────────────────────────────────────
// In production on Render the filesystem is ephemeral — uploaded files won't
// survive a redeploy. Wire Cloudinary in upload.routes.ts for persistent media.
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads'))
)

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morganMiddleware)
app.use(requestLogger)

// ── Rate limiting — disabled in development ───────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDevelopment,
})
app.use('/api/', limiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  })
})

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/users',        userRoutes)
app.use('/api/properties',   propertyRoutes)
app.use('/api/categories',   categoryRoutes)
app.use('/api/locations',    locationRoutes)
app.use('/api/agents',       agentRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/messages',     messageRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/settings',     settingsRoutes)
app.use('/api/upload',       uploadRoutes)
app.use('/api/newsletter',   newsletterRoutes)

// ── Error handlers (must be last) ─────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
