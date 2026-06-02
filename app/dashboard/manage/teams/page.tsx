import { redirect } from 'next/navigation'
import { getAuthFromCookies } from '@/lib/auth'
import getDb from '@/db/database'
import TeamsManager from '@/components/TeamsManager'

export default async function TeamsPage() {
  const auth = await getAuthFromCookies()
  if (!auth) redirect('/login')
  if (auth.role !== 'manager') redirect('/dashboard')

  const db = getDb()
  const teams = db.prepare('SELECT * FROM teams ORDER BY name').all() as any[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Teams</h1>
      <TeamsManager teams={teams} />
    </div>
  )
}
