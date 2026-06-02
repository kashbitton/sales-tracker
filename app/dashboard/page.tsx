import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import getDb from '@/db/database'
import Leaderboard from '@/components/Leaderboard'
import LeaderboardControls from '@/components/LeaderboardControls'

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diffToMon = day === 0 ? 1 : -(day - 1)
  const mon = new Date(d)
  mon.setDate(d.getDate() + diffToMon)
  const sat = new Date(mon)
  sat.setDate(mon.getDate() + 5)
  return {
    start: mon.toISOString().slice(0, 10),
    end: sat.toISOString().slice(0, 10),
  }
}

const TEAM_PALETTE = [
  { solid: '#2563EB', light: '#EFF6FF' },
  { solid: '#DC2626', light: '#FEF2F2' },
  { solid: '#059669', light: '#ECFDF5' },
  { solid: '#7C3AED', light: '#F5F3FF' },
  { solid: '#D97706', light: '#FFFBEB' },
]

export default async function RepDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')
  if (auth.role === 'manager') redirect('/dashboard/manage')

  const params = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const view = params.view === 'daily' ? 'daily' : 'weekly'
  const date = params.date ?? today
  const { start: weekStart, end: weekEnd } = getWeekRange(today)

  const dateFilter =
    view === 'daily'
      ? `AND e.event_date = '${date}'`
      : `AND e.event_date >= '${weekStart}' AND e.event_date <= '${weekEnd}'`

  const db = getDb()

  // Full leaderboard — no team filter, reps see everything
  const rows = db.prepare(`
    SELECT
      u.id, u.name,
      t.name AS team_name, t.id AS team_id,
      COALESCE(SUM(e.points), 0) AS total_points,
      COUNT(CASE WHEN e.event_type = 'close' THEN 1 END) AS closes,
      COUNT(CASE WHEN e.event_type = 'sit' THEN 1 END) AS sits,
      COUNT(CASE WHEN e.event_type = 'bagel' THEN 1 END) AS bagels,
      COUNT(CASE WHEN e.event_type = 'qualified_appt' THEN 1 END) AS qualified_appts,
      COUNT(CASE WHEN e.event_type = 'early_bird' THEN 1 END) AS early_birds,
      COUNT(CASE WHEN e.event_type = 'night_owl' THEN 1 END) AS night_owls
    FROM users u
    LEFT JOIN events e ON e.rep_id = u.id ${dateFilter}
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role = 'rep'
    GROUP BY u.id
    ORDER BY total_points DESC
  `).all() as any[]

  const myRow = rows.find(r => r.id === auth.userId)

  // Group by team, sorted by team total desc, reps within each team sorted desc
  const teamMap = new Map<string, { team_name: string; rows: any[]; total: number }>()
  for (const row of rows) {
    const key = row.team_name ?? 'No Team'
    if (!teamMap.has(key)) teamMap.set(key, { team_name: key, rows: [], total: 0 })
    const team = teamMap.get(key)!
    team.rows.push(row)
    team.total += row.total_points
  }
  // Sort reps within each team highest → lowest
  for (const team of teamMap.values()) {
    team.rows.sort((a, b) => b.total_points - a.total_points)
  }
  const teams = Array.from(teamMap.values()).sort((a, b) => b.total - a.total)
  const maxTotal = Math.max(...teams.map(t => t.total), 1)

  const viewLabel =
    view === 'daily'
      ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : `Week of ${new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="space-y-6">
      {/* My score card */}
      {myRow && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-6">
          <div className="text-center min-w-[100px]">
            <div className={`text-5xl font-black ${myRow.total_points < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {myRow.total_points > 0 ? '+' : ''}{myRow.total_points}
            </div>
            <div className="text-sm text-gray-500 mt-1">Your Points</div>
          </div>
          <div className="h-16 w-px bg-gray-200" />
          <div className="grid grid-cols-3 gap-6 flex-1">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{myRow.closes}</div>
              <div className="text-xs text-gray-500">Closes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{myRow.sits}</div>
              <div className="text-xs text-gray-500">Sits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{myRow.qualified_appts}</div>
              <div className="text-xs text-gray-500">Q.Appts</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <LeaderboardControls view={view} date={date} />
        <span className="text-sm text-gray-500">{viewLabel}</span>
      </div>

      {/* Team score cards */}
      {teams.length > 0 && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(teams.length, 3)}, minmax(0, 1fr))` }}
        >
          {teams.map((team, i) => {
            const palette = TEAM_PALETTE[i % TEAM_PALETTE.length]
            const isLeading = i === 0 && teams.length > 1
            const barPct = Math.max(4, Math.round((team.total / maxTotal) * 100))
            return (
              <div key={team.team_name} style={{
                borderRadius: '1rem', overflow: 'hidden',
                border: isLeading ? `2px solid ${palette.solid}` : '2px solid #E5E7EB',
                boxShadow: isLeading ? `0 0 0 4px ${palette.solid}33` : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ background: palette.solid, padding: '14px 20px' }}>
                  {isLeading && (
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🏆 Leading
                    </div>
                  )}
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>{team.team_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>{team.rows.length} rep{team.rows.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ background: palette.light, padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1, color: palette.solid }}>
                      {team.total > 0 ? '+' : ''}{team.total}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: palette.solid, paddingBottom: '8px', opacity: 0.7 }}>pts</span>
                  </div>
                  <div style={{ marginTop: '12px', height: '6px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: palette.solid, borderRadius: '9999px' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Per-team rep breakdowns — sorted highest to lowest */}
      <div className="space-y-6">
        {teams.map((team, i) => {
          const palette = TEAM_PALETTE[i % TEAM_PALETTE.length]
          return (
            <div key={team.team_name}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: palette.solid, flexShrink: 0 }} />
                <h2 className="text-base font-semibold text-gray-800">{team.team_name}</h2>
              </div>
              <Leaderboard rows={team.rows} showTeam={false} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
