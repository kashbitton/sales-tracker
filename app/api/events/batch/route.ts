import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireManager, authError } from '@/lib/auth'
import { getPoints } from '@/lib/scoring'

// POST /api/events/batch
// Body: { rep_id, event_date, events: { bagel, early_bird, night_owl, qualified_appt, sit, close }[], power_bill_image_path? }
// Clears existing events for that rep+date, then inserts fresh ones
export async function POST(req: NextRequest) {
  let auth
  try { auth = requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }

  const body = await req.json()
  const { rep_id, event_date, events, power_bill_image_path } = body as {
    rep_id: number
    event_date: string
    events: { type: string; count: number }[]
    power_bill_image_path?: string
  }

  if (!rep_id || !event_date || !events) {
    return Response.json({ error: 'rep_id, event_date, and events required' }, { status: 400 })
  }

  const db = getDb()

  // Delete existing entries for this rep on this date (replace mode)
  db.prepare('DELETE FROM events WHERE rep_id = ? AND event_date = ?').run(rep_id, event_date)

  // Insert each event type the specified number of times
  const insert = db.prepare(`
    INSERT INTO events (rep_id, event_type, event_date, points, power_bill_image_path, logged_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertMany = db.transaction(() => {
    for (const ev of events) {
      if (!ev.count || ev.count < 1) continue
      const pts = getPoints(ev.type)
      for (let i = 0; i < ev.count; i++) {
        insert.run(rep_id, ev.type, event_date, pts, null, auth.userId)
      }
    }
  })

  insertMany()

  return Response.json({ ok: true })
}
