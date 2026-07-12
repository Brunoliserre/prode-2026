// Tabla de resultados del torneo (premios): quién ganó cada categoría y cuántos
// puntos otorga. El ganador se deriva de los picks acertados; si nadie lo tiene,
// se muestra "Aún sin ganador".

export const TOURNAMENT_CATEGORIES: { key: string; label: string; icon: string; type: "team" | "player" }[] = [
  { key: "CHAMPION", label: "Campeón del Mundo", icon: "🏆", type: "team" },
  { key: "RUNNER_UP", label: "Subcampeón", icon: "🥈", type: "team" },
  { key: "MVP", label: "MVP del Mundial", icon: "🌟", type: "player" },
  { key: "PICHICHI", label: "Pichichi", icon: "👟", type: "player" },
  { key: "REVELATION", label: "Equipo Revelación", icon: "⭐", type: "team" },
  { key: "FAIR_PLAY", label: "Premio Fair Play", icon: "🤝", type: "team" },
  { key: "RUSTICO", label: "Premio Rústico", icon: "💥", type: "team" },
  { key: "DESASTROSO", label: "Premio Desastroso", icon: "🎯", type: "team" },
  { key: "DECEPCION", label: "Premio Decepción", icon: "😞", type: "team" },
]

export type TournamentResultRow = {
  key: string
  label: string
  icon: string
  winner: string | null // ya formateado (nombre en español para equipos)
  scorers: string[] // participantes del prode que la acertaron
  points: number
}

export function TournamentResultsTable({ rows }: { rows: TournamentResultRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
            <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Categoría</th>
            <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Ganó</th>
            <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Lo acertó</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-gray-100 last:border-0 dark:border-white/5">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-neutral-100">
                  <span className="w-5 shrink-0 text-center">{r.icon}</span>
                  {r.label}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.winner ? (
                  <span className="font-medium text-gray-900 dark:text-white">{r.winner}</span>
                ) : (
                  <span className="italic text-gray-400 dark:text-neutral-500">Aún sin ganador</span>
                )}
              </td>
              <td className="px-4 py-3">
                {r.scorers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {r.scorers.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-300 dark:text-neutral-600">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center font-bold tabular-nums text-gray-600 dark:text-neutral-300">
                +{r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
