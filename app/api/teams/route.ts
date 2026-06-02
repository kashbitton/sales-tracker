import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    requireManager(req)
  } catch (e: any) {
    return authError(e.message, e.message === 'Unauthorized' ? 401 : 403)
  }
  const db = getDb()
  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all()
  return Response.json(teams)
}

export async function POST(req: NextRequest) {
  try {
    requireManager(req)
  } catch (e: any) {
    return authError(e.message, e.message === 'Unauthorized' ? 401 : 403)
  }
  const { name } = await req.json()
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
  const db = getDb()
  try {
    const result = db.prepare('INSERT INTO teams (name) VALUES (?)').run(name)
    return Response.json({ id: result.lastInsertRowid, name }, { status: 201 })
  } catch {
    return Response.json({ error: 'Team name already exists' }, { status: 409 })
  }
}
