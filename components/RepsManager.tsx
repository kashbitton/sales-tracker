'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Rep { id: number; name: string; username: string; team_id: number | null; team_name: string | null }
interface Team { id: number; name: string }

function generateUsername(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName.toLowerCase()
  const first = parts[0][0].toLowerCase()
  const last = parts[parts.length - 1].toLowerCase()
  return `${first}${last}`
}

export default function RepsManager({ reps: initial, teams }: { reps: Rep[]; teams: Team[] }) {
  const router = useRouter()
  const [reps, setReps] = useState(initial)

  // Add rep form
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const autoUsername = generateUsername(name)

  async function addRep(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    const res = await fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username: autoUsername,
        password: 'Kinproducer',
        team_id: teamId ? Number(teamId) : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error); return }
    setAddSuccess(`Added ${name} — login: ${autoUsername} / Kinproducer`)
    setName(''); setTeamId('')
    router.refresh()
  }

  async function deleteRep(id: number, repName: string) {
    if (!confirm(`Remove ${repName}? This will delete all their events.`)) return
    const res = await fetch(`/api/reps/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReps(reps.filter(r => r.id !== id))
      router.refresh()
    }
  }

  async function updateTeam(id: number, newTeamId: string) {
    await fetch(`/api/reps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: newTeamId ? Number(newTeamId) : null }),
    })
    router.refresh()
  }

  function startEditName(rep: Rep) {
    setEditingId(rep.id)
    setEditName(rep.name)
  }

  async function saveEditName(id: number) {
    if (!editName.trim()) return
    await fetch(`/api/reps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Add Rep Form */}
      <form onSubmit={addRep} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-lg">
        <h2 className="font-semibold text-gray-800">Add New Rep</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First Last"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Team</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            {name.trim().includes(' ') && (
              <p className="text-xs text-gray-500 mb-2">
                Login: <span className="font-mono font-medium text-gray-700">{autoUsername}</span> / Kinproducer
              </p>
            )}
          </div>
        </div>
        {addError && <p className="text-red-600 text-sm">{addError}</p>}
        {addSuccess && <p className="text-green-600 text-sm">{addSuccess}</p>}
        <button type="submit"
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Rep
        </button>
      </form>

      {/* Reps Table */}
      {reps.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username <span className="normal-case font-normal text-gray-400">(login, unchanged)</span></th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reps.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  {/* Name — inline editable */}
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditName(r.id); if (e.key === 'Escape') setEditingId(null) }}
                          autoFocus
                          className="border border-blue-400 rounded px-2 py-1 text-sm text-gray-900 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => saveEditName(r.id)} className="text-xs text-green-600 font-semibold hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-medium text-gray-900">{r.name}</span>
                        <button
                          onClick={() => startEditName(r)}
                          className="text-xs text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Username — never changes with name edit */}
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.username}</td>

                  {/* Team */}
                  <td className="px-4 py-3">
                    <select
                      defaultValue={r.team_id ?? ''}
                      onChange={e => updateTeam(r.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900"
                    >
                      <option value="">No team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRep(r.id, r.name)}
                      className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
