import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  const { name } = await req.json()
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
  const db = getDb()
  db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, id)
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM teams WHERE id = ?').run(id)
  return Response.json({ ok: true })
}
