import { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response.js'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json(fail('无权限'))
    return
  }
  next()
}
