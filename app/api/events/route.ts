import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'
import { getPoints } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }
  const db = getDb()
  const url = new URL(req.url)
  const repId = url.searchParams.get('rep_id')
  const date = url.searchParams.get('date')

  let query = `
    SELECT e.*, u.name AS rep_name, m.name AS logged_by_name
    FROM events e
    JOIN users u ON u.id = e.rep_id
    JOIN users m ON m.id = e.logged_by
    WHERE 1=1
  `
  const args: (string | number)[] = []
  if (repId) { query += ' AND e.rep_id = ?'; args.push(repId) }
  if (date) { query += ' AND e.event_date = ?'; args.push(date) }
  query += ' ORDER BY e.created_at DESC'

  return Response.json(db.prepare(query).all(...args))
}

export async function POST(req: NextRequest) {
  let auth
  try { auth = requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }

  const body = await req.json()
  const { rep_id, event_type, event_date, notes, power_bill_image_path } = body

  if (!rep_id || !event_type || !event_date) {
    return Response.json({ error: 'rep_id, event_type, and event_date required' }, { status: 400 })
  }

  let points: number
  try { points = getPoints(event_type) } catch {
    return Response.json({ error: 'Invalid event type' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO events (rep_id, event_type, event_date, points, notes, power_bill_image_path, logged_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(rep_id, event_type, event_date, points, notes ?? null, power_bill_image_path ?? null, auth.userId)

  return Response.json({ id: result.lastInsertRowid, points }, { status: 201 })
}
