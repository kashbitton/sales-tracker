'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NavBar({ role }: { role: string }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-blue-600 text-lg">Sales Tracker</span>
          {role === 'manager' && (
            <>
              <Link href="/dashboard/manage" className="text-sm text-gray-600 hover:text-gray-900">Leaderboard</Link>
              <Link href="/dashboard/manage/log-event" className="text-sm text-gray-600 hover:text-gray-900">Log Event</Link>
              <Link href="/dashboard/manage/reps" className="text-sm text-gray-600 hover:text-gray-900">Reps</Link>
              <Link href="/dashboard/manage/teams" className="text-sm text-gray-600 hover:text-gray-900">Teams</Link>
            </>
          )}
          {role === 'rep' && (
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">My Dashboard</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{role}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
