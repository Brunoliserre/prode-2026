"use client"

import { useState } from "react"
import { getCountryCode } from "@/lib/flags"
import * as Flags from "country-flag-icons/react/3x2"

interface Props {
  teams: string[]
}

const CATEGORIES = [
  { key: "champion",   label: "Campeón del Mundo", icon: "🏆", points: 15 },
  { key: "runnerUp",   label: "Subcampeón",         icon: "🥈", points: 8  },
  { key: "revelation", label: "Equipo Revelación",  icon: "⭐", points: 5  },
  { key: "fairPlay",   label: "Premio Fair Play",   icon: "🤝", points: 5  },
  { key: "rustico",    label: "Premio Rústico",     icon: "💥", points: 5  },
] as const

type CategoryKey = (typeof CATEGORIES)[number]["key"]

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(team)
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return <Flag className="h-4 w-6 shrink-0 rounded-sm" />
}

function TeamSelect({
  value,
  onChange,
  teams,
  placeholder = "Seleccionar equipo...",
}: {
  value: string
  onChange: (v: string) => void
  teams: string[]
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-7 shrink-0 items-center">
        {value ? <TeamFlag team={value} /> : <span className="text-sm text-gray-300 dark:text-neutral-600">🏳</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <option value="">{placeholder}</option>
        {teams.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  )
}

export function TournamentPredictions({ teams }: Props) {
  const [picks, setPicks] = useState<Record<CategoryKey, string>>({
    champion: "", runnerUp: "", revelation: "", fairPlay: "", rustico: "",
  })

  const filledCount = Object.values(picks).filter(Boolean).length

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🎯</span>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Predicciones del Torneo</h2>
            <p className="text-xs text-gray-400 dark:text-neutral-500">Se cierran antes del inicio del Mundial</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 dark:text-neutral-500">{filledCount}/{CATEGORIES.length}</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-4 px-5 py-4">
            <span className="text-xl w-7 shrink-0 text-center">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-neutral-100">{cat.label}</span>
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  +{cat.points}
                </span>
              </div>
              <TeamSelect
                value={picks[cat.key]}
                onChange={(v) => setPicks((p) => ({ ...p, [cat.key]: v }))}
                teams={teams}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-3">
          <button
            disabled
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed"
          >
            Guardar predicciones
          </button>
          <span className="text-xs text-gray-400 dark:text-neutral-600">
            Próximamente disponible
          </span>
        </div>
      </div>
    </div>
  )
}
