import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/auth'
import config from '../config/index'

const router = Router()

// ── Storage config ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'uploads'))
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${uuidv4()}${ext}`
    cb(null, name)
  },
})

const allowedTypes = /jpeg|jpg|png|gif|webp|svg/

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const mime = allowedTypes.test(file.mimetype)
    const ext  = allowedTypes.test(path.extname(file.originalname).toLowerCase().replace('.', ''))
    if (mime && ext) return cb(null, true)
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp, svg)'))
  },
})

// ── POST /api/upload ──────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  upload.single('file'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' })
      return
    }

    const fileUrl = `${config.apiUrl}/uploads/${req.file.filename}`

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url:          fileUrl,
        filename:     req.file.filename,
        originalName: req.file.originalname,
        size:         req.file.size,
        mimetype:     req.file.mimetype,
      },
    })
  }
)

// Multer error handler
router.use((err: any, _req: Request, res: Response, _next: any) => {
  res.status(400).json({ success: false, message: err.message ?? 'Upload failed' })
})

export default router
