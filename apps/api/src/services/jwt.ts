import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const TOKEN_TTL = '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: TOKEN_TTL },
  )
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
