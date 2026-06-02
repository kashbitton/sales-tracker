import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const db = getDb()
  const reps = db.prepare(`
    SELECT u.id, u.name, u.username, u.role, u.team_id, t.name AS team_name
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role = 'rep'
    ORDER BY u.name
  `).all()
  return Response.json(reps)
}

export async function POST(req: NextRequest) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { name, username, password, team_id } = await req.json()
  if (!name || !username || !password) {
    return Response.json({ error: 'name, username, and password required' }, { status: 400 })
  }
  const db = getDb()
  const hash = await bcrypt.hash(password, 12)
  try {
    const result = db.prepare(
      'INSERT INTO users (name, username, password_hash, role, team_id) VALUES (?, ?, ?, ?, ?)'
    ).run(name, username, hash, 'rep', team_id ?? null)
    return Response.json({ id: result.lastInsertRowid, name, username }, { status: 201 })
  } catch {
    return Response.json({ error: 'Username already exists' }, { status: 409 })
  }
}
