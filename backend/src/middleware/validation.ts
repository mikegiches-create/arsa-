import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError as VError } from 'express-validator'

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map((e: VError) => ({
        field: 'path' in e ? e.path : ('param' in e ? (e as any).param : 'unknown'),
        message: e.msg,
      })),
    })
    return
  }

  next()
}
