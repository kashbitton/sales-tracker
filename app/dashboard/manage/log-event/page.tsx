import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import getDb from '@/db/database'
import DailyEntry from '@/components/DailyEntry'
import EventsTable from '@/components/EventsTable'

export default async function LogEventPage() {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')
  if (auth.role !== 'manager') redirect('/dashboard')

  const db = getDb()
  const reps = db.prepare(`
    SELECT u.id, u.name, t.name AS team_name
    FROM users u LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role = 'rep' ORDER BY t.name, u.name
  `).all() as any[]

  const events = db.prepare(`
    SELECT e.*, u.name AS rep_name, m.name AS logged_by_name
    FROM events e
    JOIN users u ON u.id = e.rep_id
    JOIN users m ON m.id = e.logged_by
    ORDER BY e.event_date DESC, e.created_at DESC
    LIMIT 100
  `).all() as any[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Day</h1>
        <p className="text-sm text-gray-500 mt-1">Tap a rep, tap their results, save.</p>
      </div>

      <DailyEntry reps={reps} />

      {/* Edit / Delete past events */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Edit Past Events</h2>
        <p className="text-sm text-gray-500 mb-3">Made a mistake? Edit or delete any entry below.</p>
        <EventsTable events={events} />
      </div>
    </div>
  )
}
