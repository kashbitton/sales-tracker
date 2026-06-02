'use client'

import { useRouter } from 'next/navigation'

export default function LeaderboardControls({ view, date }: { view: string; date: string }) {
  const router = useRouter()

  function setView(v: string) {
    const params = new URLSearchParams()
    params.set('view', v)
    if (v === 'daily') params.set('date', date)
    router.push(`/dashboard/manage?${params.toString()}`)
  }

  function setDate(d: string) {
    router.push(`/dashboard/manage?view=daily&date=${d}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* View toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
        {(['weekly', 'daily'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {v === 'weekly' ? '📅 Weekly' : '📆 Daily'}
          </button>
        ))}
      </div>

      {/* Date picker — only in daily mode */}
      {view === 'daily' && (
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )
}
