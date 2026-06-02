interface Row {
  id: number
  name: string
  team_name: string | null
  total_points: number
  closes: number
  sits: number
  bagels: number
  qualified_appts: number
  early_birds: number
  night_owls: number
}

export default function Leaderboard({ rows, showTeam = true }: { rows: Row[]; showTeam?: boolean }) {
  if (rows.length === 0) {
    return <p className="text-gray-500 text-sm">No reps yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 w-8">#</th>
            <th className="px-4 py-3">Name</th>
            {showTeam && <th className="px-4 py-3">Team</th>}
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">Closes</th>
            <th className="px-4 py-3 text-right">Sits</th>
            <th className="px-4 py-3 text-right">Q.Appts</th>
            <th className="px-4 py-3 text-right">🌅 E.Bird</th>
            <th className="px-4 py-3 text-right">🦉 N.Owl</th>
            <th className="px-4 py-3 text-right">Bagels</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
              {showTeam && <td className="px-4 py-3 text-gray-500">{row.team_name ?? '—'}</td>}
              <td className="px-4 py-3 text-right">
                <span className={`font-bold text-base ${row.total_points < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {row.total_points > 0 ? '+' : ''}{row.total_points}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{row.closes}</td>
              <td className="px-4 py-3 text-right text-gray-700">{row.sits}</td>
              <td className="px-4 py-3 text-right text-gray-700">{row.qualified_appts}</td>
              <td className="px-4 py-3 text-right text-gray-700">{row.early_birds}</td>
              <td className="px-4 py-3 text-right text-gray-700">{row.night_owls}</td>
              <td className="px-4 py-3 text-right text-gray-700">{row.bagels}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
