"use client"

import { useState, useTransition } from "react"
import { awardTournamentPoints } from "@/lib/actions"
import { PICK_POINTS } from "@/lib/actions"

const CATEGORIES = [
  { key: "CHAMPION",   label: "Campeón del Mundo", icon: "🏆", points: 15, type: "team" },
  { key: "RUNNER_UP",  label: "Subcampeón",         icon: "🥈", points: 8,  type: "team" },
  { key: "MVP",        label: "MVP del Mundial",    icon: "🌟", points: 5,  type: "player" },
  { key: "PICHICHI",   label: "Pichichi",           icon: "👟", points: 5,  type: "player" },
  { key: "REVELATION", label: "Equipo Revelación",  icon: "⭐", points: 3,  type: "team" },
  { key: "FAIR_PLAY",  label: "Premio Fair Play",   icon: "🤝", points: 3,  type: "team" },
  { key: "RUSTICO",    label: "Premio Rústico",     icon: "💥", points: 3,  type: "team" },
  { key: "DESASTROZA", label: "Premio Desastroza",  icon: "🎯", points: 3,  type: "team" },
  { key: "DECEPCION",  label: "Premio Decepción",   icon: "😞", points: 3,  type: "team" },
]

function CategoryRow({ category, teams }: { category: typeof CATEGORIES[number]; teams: string[] }) {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function award() {
    if (!value.trim()) return
    startTransition(async () => {
      try {
        await awardTournamentPoints(category.key, value.trim())
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800/50">
      <span className="text-lg w-7 text-center shrink-0">{category.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-neutral-100">{category.label}</p>
        <p className="text-xs text-gray-400 dark:text-neutral-500">+{category.points} pts al ganador</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {category.type === "team" ? (
          <select
            value={value}
            onChange={(e) => { setValue(e.target.value); setStatus("idle") }}
            className="rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="">Seleccionar...</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
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
          onClick={award}
          disabled={isPending || !value.trim()}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Otorgar"}
        </button>
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
