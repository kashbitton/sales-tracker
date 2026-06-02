'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENT_LABELS, POINT_VALUES } from '@/lib/scoring'

interface Rep { id: number; name: string; team_name: string | null }

export default function EventLogForm({ reps }: { reps: Rep[] }) {
  const router = useRouter()
  const [repId, setRepId] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const needsImage = eventType === 'qualified_appt'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let imagePath: string | null = null

      if (needsImage && file) {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!upRes.ok) {
          const d = await upRes.json()
          throw new Error(d.error || 'Upload failed')
        }
        imagePath = (await upRes.json()).path
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rep_id: Number(repId),
          event_type: eventType,
          event_date: eventDate,
          notes: notes || null,
          power_bill_image_path: imagePath,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log event')

      const pts = data.points
      setSuccess(`Event logged! ${pts > 0 ? '+' : ''}${pts} points`)
      setRepId('')
      setEventType('')
      setNotes('')
      setFile(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rep</label>
        <select
          value={repId}
          onChange={e => setRepId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a rep...</option>
          {reps.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}{r.team_name ? ` (${r.team_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
        <select
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select event...</option>
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label} ({POINT_VALUES[key] > 0 ? '+' : ''}{POINT_VALUES[key]} pts)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {needsImage && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Power Bill Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            required={needsImage}
            className="w-full text-sm text-gray-600"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Logging...' : 'Log Event'}
      </button>
    </form>
  )
}
