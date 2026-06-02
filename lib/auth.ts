import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = process.env.JWT_SECRET!

export interface TokenPayload {
  userId: number
  role: 'manager' | 'rep'
  teamId: number | null
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}

export async function getAuthFromCookies(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function getAuthFromRequest(req: NextRequest): TokenPayload | null {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): TokenPayload {
  const auth = getAuthFromRequest(req)
  if (!auth) throw new Error('Unauthorized')
  return auth
}

export function requireManager(req: NextRequest): TokenPayload {
  const auth = requireAuth(req)
  if (auth.role !== 'manager') throw new Error('Forbidden')
  return auth
}

export function authError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
