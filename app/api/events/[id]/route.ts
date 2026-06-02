import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'
import { getPoints } from '@/lib/scoring'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  const { event_type, event_date, notes } = await req.json()
  const db = getDb()
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any
  if (!ev) return Response.json({ error: 'Not found' }, { status: 404 })

  const newType = event_type ?? ev.event_type
  const newDate = event_date ?? ev.event_date
  const newNotes = notes !== undefined ? notes : ev.notes
  const newPoints = getPoints(newType)

  db.prepare('UPDATE events SET event_type=?, event_date=?, notes=?, points=? WHERE id=?')
    .run(newType, newDate, newNotes, newPoints, id)
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const { id } = await params
  getDb().prepare('DELETE FROM events WHERE id = ?').run(id)
  return Response.json({ ok: true })
}
