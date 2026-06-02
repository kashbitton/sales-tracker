import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import getDb from '@/db/database'
import RepsManager from '@/components/RepsManager'

export default async function RepsPage() {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')
  if (auth.role !== 'manager') redirect('/dashboard')

  const db = getDb()
  const reps = db.prepare(`
    SELECT u.id, u.name, u.username, u.team_id, t.name AS team_name
    FROM users u LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role = 'rep' ORDER BY u.name
  `).all() as any[]

  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all() as any[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Reps</h1>
      <RepsManager reps={reps} teams={teams} />
    </div>
  )
}
