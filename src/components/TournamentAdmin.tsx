"use client"

import { useState, useTransition } from "react"
import { awardTournamentPoints } from "@/lib/actions"
import { PICK_POINTS } from "@/lib/utils"
import { esTeamName } from "@/lib/flags"

const CATEGORIES = [
  { key: "CHAMPION",   label: "Campeón del Mundo", icon: "🏆", type: "team",   allowNA: false },
  { key: "RUNNER_UP",  label: "Subcampeón",         icon: "🥈", type: "team",   allowNA: false },
  { key: "MVP",        label: "MVP del Mundial",    icon: "🌟", type: "player", allowNA: false },
  { key: "PICHICHI",   label: "Pichichi",           icon: "👟", type: "player", allowNA: false },
  { key: "REVELATION", label: "Equipo Revelación",  icon: "⭐", type: "team",   allowNA: false },
  { key: "FAIR_PLAY",  label: "Premio Fair Play",   icon: "🤝", type: "team",   allowNA: false },
  { key: "RUSTICO",    label: "Premio Rústico",     icon: "💥", type: "team",   allowNA: false },
  { key: "DESASTROSO", label: "Premio Desastroso",  icon: "🎯", type: "team",   allowNA: false },
  { key: "DECEPCION",  label: "Premio Decepción",   icon: "😞", type: "team",   allowNA: true  },
]

function CategoryRow({ category, teams }: { category: typeof CATEGORIES[number]; teams: string[] }) {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function award(override?: string) {
    const val = override ?? value.trim()
    if (!val) return
    startTransition(async () => {
      try {
        await awardTournamentPoints(category.key, val)
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  const pts = PICK_POINTS[category.key] ?? 0

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800/50">
      <span className="text-lg w-7 text-center shrink-0">{category.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-neutral-100">{category.label}</p>
        <p className="text-xs text-gray-400 dark:text-neutral-500">+{pts} pts al ganador</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {category.type === "team" ? (
          <select
            value={value}
            onChange={(e) => { setValue(e.target.value); setStatus("idle") }}
            className="rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="">Seleccionar...</option>
            {teams.map((t) => <option key={t} value={t}>{esTeamName(t)}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setStatus("idle") }}
            placeholder="Nombre del jugador"
            className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        )}
        <button
          onClick={() => award()}
          disabled={isPending || !value.trim()}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Otorgar"}
        </button>
        {category.allowNA && (
          <button
            onClick={() => award("N/A")}
            disabled={isPending}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            N/A — 0 pts
          </button>
        )}
        {status === "ok" && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓</span>}
        {status === "error" && <span className="text-xs text-red-500">Error</span>}
      </div>
    </div>
  )
}

export function TournamentAdmin({ teams }: { teams: string[] }) {
  return (
    <div className="space-y-3">
      {CATEGORIES.map((cat) => (
        <CategoryRow key={cat.key} category={cat} teams={teams} />
      ))}
    </div>
  )
}
