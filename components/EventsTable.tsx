'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENT_LABELS, POINT_VALUES } from '@/lib/scoring'
import Image from 'next/image'

interface Event {
  id: number
  rep_name: string
  event_type: string
  event_date: string
  points: number
  notes: string | null
  power_bill_image_path: string | null
  logged_by_name: string
  created_at: string
}

export default function EventsTable({ events: initial }: { events: Event[] }) {
  const router = useRouter()
  const [events, setEvents] = useState(initial)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editType, setEditType] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function startEdit(ev: Event) {
    setEditingId(ev.id)
    setEditType(ev.event_type)
    setEditDate(ev.event_date)
    setEditNotes(ev.notes ?? '')
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: editType, event_date: editDate, notes: editNotes }),
    })
    if (res.ok) {
      setEditingId(null)
      router.refresh()
    }
  }

  async function deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents(events.filter(e => e.id !== id))
      router.refresh()
    }
  }

  if (events.length === 0) return <p className="text-gray-500 text-sm">No events logged yet.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
            <th className="px-4 py-3">Rep</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Pts</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Bill</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {editingId === ev.id ? (
                <>
                  <td className="px-4 py-2 text-gray-700">{ev.rep_name}</td>
                  <td className="px-4 py-2">
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900"
                    >
                      {Object.entries(EVENT_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900" />
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-gray-700">
                    {POINT_VALUES[editType] > 0 ? '+' : ''}{POINT_VALUES[editType]}
                  </td>
                  <td className="px-4 py-2">
                    <input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 w-32" />
                  </td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => saveEdit(ev.id)} className="text-xs text-green-600 hover:underline">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.rep_name}</td>
                  <td className="px-4 py-3 text-gray-700">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.event_date}</td>
                  <td className={`px-4 py-3 text-right font-bold ${ev.points < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {ev.points > 0 ? '+' : ''}{ev.points}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{ev.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    {ev.power_bill_image_path ? (
                      <a href={ev.power_bill_image_path} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs">View</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button onClick={() => startEdit(ev)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteEvent(ev.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
