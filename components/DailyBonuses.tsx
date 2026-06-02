'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Rep { id: number; name: string }

interface Props {
  earlyBird: { name: string; id: number } | null
  nightOwl: { name: string; id: number } | null
  reps: Rep[]
  today: string
}

function BonusSlot({
  type,
  label,
  emoji,
  description,
  winner,
  reps,
  today,
  color,
}: {
  type: 'early_bird' | 'night_owl'
  label: string
  emoji: string
  description: string
  winner: { name: string; id: number } | null
  reps: Rep[]
  today: string
  color: { bg: string; border: string; text: string; badge: string; btn: string }
}) {
  const router = useRouter()
  const [selecting, setSelecting] = useState(false)
  const [saving, setSaving] = useState(false)

  async function assign(repId: number) {
    setSaving(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rep_id: repId, event_type: type, event_date: today }),
    })
    setSaving(false)
    setSelecting(false)
    router.refresh()
  }

  return (
    <div className={`rounded-2xl border ${color.border} ${color.bg} p-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div>
          <div className={`font-bold text-sm ${color.text}`}>{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
        <span className={`ml-auto text-xs font-bold ${color.text}`}>+1 pt</span>
      </div>

      {winner ? (
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${color.badge}`}>
            🏅 {winner.name}
          </span>
          <button
            onClick={() => setSelecting(true)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div>
          {!selecting ? (
            <button
              onClick={() => setSelecting(true)}
              className={`w-full text-sm font-semibold py-2 rounded-xl border-2 border-dashed ${color.border} ${color.text} hover:opacity-80 transition-opacity`}
            >
              + Assign {label}
            </button>
          ) : null}
        </div>
      )}

      {selecting && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 mb-1">Select a rep:</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {reps.map(r => (
              <button
                key={r.id}
                onClick={() => assign(r.id)}
                disabled={saving}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 disabled:opacity-50 transition-colors"
              >
                {r.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelecting(false)}
            className="text-xs text-gray-400 hover:underline mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default function DailyBonuses({ earlyBird, nightOwl, reps, today }: Props) {
  if (reps.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Today's Bonuses</p>
      <div className="grid grid-cols-2 gap-3">
        <BonusSlot
          type="early_bird"
          label="Early Bird"
          emoji="🌅"
          description="First appt of the day"
          winner={earlyBird}
          reps={reps}
          today={today}
          color={{
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-700',
            badge: 'bg-orange-100 text-orange-800',
            btn: 'text-orange-600',
          }}
        />
        <BonusSlot
          type="night_owl"
          label="Night Owl"
          emoji="🦉"
          description="Last appt of the day"
          winner={nightOwl}
          reps={reps}
          today={today}
          color={{
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-700',
            badge: 'bg-purple-100 text-purple-800',
            btn: 'text-purple-600',
          }}
        />
      </div>
    </div>
  )
}
