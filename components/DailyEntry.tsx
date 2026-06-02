'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { POINT_VALUES } from '@/lib/scoring'

interface Rep { id: number; name: string; team_name: string | null }

type EventCounts = {
  bagel: number
  early_bird: number
  night_owl: number
  qualified_appt: number
  sit: number
  close: number
}

const EMPTY_COUNTS: EventCounts = {
  bagel: 0, early_bird: 0, night_owl: 0,
  qualified_appt: 0, sit: 0, close: 0,
}

const BUTTONS: { type: keyof EventCounts; label: string; emoji: string; color: string }[] = [
  { type: 'close',         label: 'Close',      emoji: '🏆', color: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 active:bg-green-300' },
  { type: 'sit',           label: 'Sit',        emoji: '🪑', color: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 active:bg-blue-300' },
  { type: 'qualified_appt',label: 'Q.Appt',     emoji: '⚡', color: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200 active:bg-yellow-300' },
  { type: 'early_bird',    label: 'Early Bird', emoji: '🌅', color: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200 active:bg-orange-300' },
  { type: 'night_owl',     label: 'Night Owl',  emoji: '🦉', color: 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200 active:bg-purple-300' },
  { type: 'bagel',         label: 'Bagel',      emoji: '🥯', color: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200 active:bg-red-300' },
]

function calcPoints(counts: EventCounts) {
  return Object.entries(counts).reduce((sum, [k, v]) => sum + POINT_VALUES[k] * v, 0)
}

function RepCard({ rep, date }: { rep: Rep; date: string }) {
  const router = useRouter()
  const [counts, setCounts] = useState<EventCounts>({ ...EMPTY_COUNTS })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [billPath, setBillPath] = useState<string | null>(null)
  const [billFile, setBillFile] = useState<string>('')

  const points = calcPoints(counts)
  const hasAny = Object.values(counts).some(v => v > 0)

  function inc(type: keyof EventCounts) {
    setCounts(c => ({ ...c, [type]: c[type] + 1 }))
    setSaved(false)
  }

  function dec(type: keyof EventCounts) {
    setCounts(c => ({ ...c, [type]: Math.max(0, c[type] - 1) }))
    setSaved(false)
  }

  async function handleBillUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) setBillPath(data.path)
    setBillFile(e.target.value)
  }

  async function save() {
    setSaving(true)
    const events = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([type, count]) => ({ type, count }))

    await fetch('/api/events/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rep_id: rep.id, event_date: date, events, power_bill_image_path: billPath }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  function reset() {
    setCounts({ ...EMPTY_COUNTS })
    setBillPath(null)
    setBillFile('')
    setSaved(false)
  }

  const needsBill = counts.qualified_appt > 0

  return (
    <div className={`bg-white rounded-2xl border transition-all ${open ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <div className="font-semibold text-gray-900">{rep.name}</div>
          {rep.team_name && <div className="text-xs text-gray-400 mt-0.5">{rep.team_name}</div>}
        </div>
        <div className="flex items-center gap-3">
          {hasAny && (
            <span className={`text-sm font-bold ${points < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {points > 0 ? '+' : ''}{points} pts
            </span>
          )}
          {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
          <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Expanded entry panel */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Event buttons grid */}
          <div className="grid grid-cols-3 gap-2">
            {BUTTONS.map(btn => (
              <div key={btn.type} className="flex flex-col items-center gap-1">
                <div className={`w-full flex items-center justify-between border rounded-xl px-3 py-2 ${btn.color} transition-colors`}>
                  <button type="button" onClick={() => dec(btn.type)}
                    className="text-lg font-bold w-6 text-center leading-none opacity-60 hover:opacity-100">−</button>
                  <button type="button" onClick={() => inc(btn.type)}
                    className="flex flex-col items-center flex-1">
                    <span className="text-lg">{btn.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{btn.label}</span>
                    <span className="text-xs opacity-60">{POINT_VALUES[btn.type] > 0 ? '+' : ''}{POINT_VALUES[btn.type]}</span>
                  </button>
                  <button type="button" onClick={() => inc(btn.type)}
                    className="text-lg font-bold w-6 text-center leading-none opacity-60 hover:opacity-100">+</button>
                </div>
                {counts[btn.type] > 0 && (
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                    ×{counts[btn.type]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Power bill upload — only when Q.Appt > 0 */}
          {needsBill && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs font-medium text-yellow-800 mb-2">⚡ Power bill required for Qualified Appt</p>
              <input
                type="file"
                accept="image/*"
                value={billFile}
                onChange={handleBillUpload}
                className="text-xs text-gray-700 w-full"
              />
              {uploading && <p className="text-xs text-yellow-700 mt-1">Uploading...</p>}
              {billPath && <p className="text-xs text-green-700 mt-1">✓ Bill uploaded</p>}
            </div>
          )}

          {/* Points summary */}
          {hasAny && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {BUTTONS.filter(b => counts[b.type] > 0).map(b => (
                <span key={b.type} className="bg-gray-100 rounded-full px-2 py-1">
                  {b.emoji} {b.label} ×{counts[b.type]}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !hasAny || (needsBill && !billPath)}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Day'}
            </button>
            {hasAny && (
              <button onClick={reset}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DailyEntry({ reps }: { reps: Rep[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)

  if (reps.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        No reps yet. Add reps first before logging events.
      </div>
    )
  }

  // Group by team
  const teams = new Map<string, Rep[]>()
  for (const rep of reps) {
    const key = rep.team_name ?? 'No Team'
    if (!teams.has(key)) teams.set(key, [])
    teams.get(key)!.push(rep)
  }

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {date === today && <span className="text-xs text-gray-400">Today</span>}
      </div>

      {/* Rep cards grouped by team */}
      {Array.from(teams.entries()).map(([teamName, teamReps]) => (
        <div key={teamName}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{teamName}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamReps.map(rep => (
              <RepCard key={`${rep.id}-${date}`} rep={rep} date={date} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
