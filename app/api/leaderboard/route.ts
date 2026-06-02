import { NextRequest } from 'next/server'
import getDb from '@/db/database'
import { requireAuth, authError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  let auth
  try { auth = requireAuth(req) } catch (e: any) { return authError(e.message, 401) }

  const url = new URL(req.url)
  let teamId: string | null = url.searchParams.get('team_id')

  // Reps can only see their own team
  if (auth.role === 'rep') {
    teamId = auth.teamId ? String(auth.teamId) : null
  }

  const db = getDb()
  const rows = db.prepare(`
    SELECT
      u.id,
      u.name,
      t.name AS team_name,
      t.id AS team_id,
      COALESCE(SUM(e.points), 0) AS total_points,
      COUNT(CASE WHEN e.event_type = 'close' THEN 1 END) AS closes,
      COUNT(CASE WHEN e.event_type = 'sit' THEN 1 END) AS sits,
      COUNT(CASE WHEN e.event_type = 'bagel' THEN 1 END) AS bagels,
      COUNT(CASE WHEN e.event_type = 'qualified_appt' THEN 1 END) AS qualified_appts,
      COUNT(CASE WHEN e.event_type = 'early_bird' THEN 1 END) AS early_birds,
      COUNT(CASE WHEN e.event_type = 'night_owl' THEN 1 END) AS night_owls
    FROM users u
    LEFT JOIN events e ON e.rep_id = u.id
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role = 'rep'
      AND (? IS NULL OR t.id = ?)
    GROUP BY u.id
    ORDER BY total_points DESC
  `).all(teamId, teamId)

  return Response.json(rows)
}
