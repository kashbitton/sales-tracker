import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import getDb from '@/db/database'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return Response.json({ error: 'Username and password required' }, { status: 400 })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, role: user.role, teamId: user.team_id })

  const res = Response.json({ role: user.role, name: user.name })
  const headers = new Headers(res.headers)
  headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`
  )
  return new Response(res.body, { status: 200, headers })
}
