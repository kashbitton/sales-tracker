import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  const { name, team_id, password } = await req.json()
  const db = getDb()
  if (name !== undefined) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id)
  if (team_id !== undefined) db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(team_id, id)
  if (password) {
    const hash = await bcrypt.hash(password, 12)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id)
  }
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return Response.json({ ok: true })
}
