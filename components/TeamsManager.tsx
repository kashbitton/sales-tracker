'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team { id: number; name: string }

export default function TeamsManager({ teams: initial }: { teams: Team[] }) {
  const router = useRouter()
  const [teams, setTeams] = useState(initial)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setTeams([...teams, { id: data.id, name: newName }])
    setNewName('')
    router.refresh()
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    if (res.ok) {
      setTeams(teams.map(t => t.id === id ? { ...t, name: editName } : t))
      setEditingId(null)
      router.refresh()
    }
  }

  async function deleteTeam(id: number, name: string) {
    if (!confirm(`Delete team "${name}"? Reps will be unassigned.`)) return
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTeams(teams.filter(t => t.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <form onSubmit={addTeam} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-800">Add Team</h2>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Team name"
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {teams.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {teams.map(t => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                {editingId === t.id ? (
                  <div className="flex gap-2 flex-1">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900" />
                    <button onClick={() => saveEdit(t.id)} className="text-sm text-green-600 hover:underline">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-gray-400 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-gray-900">{t.name}</span>
                    <div className="flex gap-3">
                      <button onClick={() => { setEditingId(t.id); setEditName(t.name) }}
                        className="text-xs text-blue-600 hover:underline">Rename</button>
                      <button onClick={() => deleteTeam(t.id, t.name)}
                        className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
