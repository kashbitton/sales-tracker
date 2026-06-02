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
      AND (? IS NULL OR t.id = ?)
    GROUP BY u.id
    ORDER BY total_points DESC
  `).all(auth.teamId, auth.teamId) as any[]

  const myRow = rows.find(r => r.id === auth.userId)

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

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {myRow?.team_name ? `Team: ${myRow.team_name}` : 'Team Leaderboard'}
        </h2>
        <Leaderboard rows={rows} showTeam={false} />
      </div>
    </div>
  )
}
