import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import getDb from '@/db/database'
import DailyEntry from '@/components/DailyEntry'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Day</h1>
        <p className="text-sm text-gray-500 mt-1">Tap a rep, tap their results, save. Repeat for the next rep.</p>
      </div>
      <DailyEntry reps={reps} />
    </div>
  )
}
