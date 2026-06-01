"use client"

import { useState, useTransition } from "react"
import { getCountryCode } from "@/lib/flags"
import { saveTournamentPicks } from "@/lib/actions"
import * as Flags from "country-flag-icons/react/3x2"

interface Props {
  teams: string[]
  initialPicks: Record<string, string>
  locked: boolean
}

// FIFA TOP 10 — used for champion, runner-up and decepción picks
const TOP10 = [
  "France", "Spain", "Argentina", "England",
  "Portugal", "Brazil", "Netherlands", "Morocco",
  "Belgium", "Germany",
]

const CATEGORIES = [
  { key: "CHAMPION",   label: "Campeón del Mundo", icon: "🏆", points: 15, type: "team",   sublabel: undefined,  teams: "top10" },
  { key: "RUNNER_UP",  label: "Subcampeón",         icon: "🥈", points: 8,  type: "team",   sublabel: undefined,  teams: "top10" },
  { key: "MVP",        label: "MVP del Mundial",    icon: "🌟", points: 5,  type: "player", sublabel: "MVP del torneo elegido por la FIFA",                             teams: "all" },
  { key: "PICHICHI",   label: "Pichichi",           icon: "👟", points: 5,  type: "player", sublabel: "Máximo goleador del torneo",                                     teams: "all" },
  { key: "REVELATION", label: "Equipo Revelación",  icon: "⭐", points: 3,  type: "team",   sublabel: "Selección que nunca superó los Octavos y llega a Cuartos o más", teams: "all" },
  { key: "RUSTICO",    label: "Premio Rústico",     icon: "💥", points: 3,  type: "team",   sublabel: "Equipo con mayor puntaje de tarjetas (Amarilla = 1, Roja = 3)",   teams: "all" },
  { key: "FAIR_PLAY",  label: "Premio Fair Play",   icon: "🤝", points: 3,  type: "team",   sublabel: "Equipo con menor puntaje de tarjetas al finalizar el Mundial",    teams: "all" },
  { key: "DESASTROZO", label: "Premio Desastrozo",  icon: "🎯", points: 3,  type: "team",   sublabel: "Selección más goleada del torneo",                               teams: "all" },
  { key: "DECEPCION",  label: "Premio Decepción",   icon: "😞", points: 3,  type: "team",   sublabel: "Selección TOP 10 FIFA que no supera la Fase de Grupos",          teams: "top10" },
] as const

type CategoryKey = (typeof CATEGORIES)[number]["key"]

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(team)
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return <Flag className="h-4 w-6 shrink-0 rounded-sm" />
}

function TeamSelect({ value, onChange, teams }: { value: string; onChange: (v: string) => void; teams: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-7 shrink-0 items-center justify-center">
        {value ? <TeamFlag team={value} /> : <span className="text-xs text-gray-300 dark:text-neutral-600">🏳</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <option value="">Seleccionar equipo...</option>
        {teams.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}

function PlayerInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-600"
    />
  )
}

export function TournamentPredictions({ teams, initialPicks, locked }: Props) {
  const [picks, setPicks] = useState<Record<CategoryKey, string>>(() => ({
    CHAMPION:   initialPicks.CHAMPION   ?? "",
    RUNNER_UP:  initialPicks.RUNNER_UP  ?? "",
    MVP:        initialPicks.MVP        ?? "",
    PICHICHI:   initialPicks.PICHICHI   ?? "",
    REVELATION: initialPicks.REVELATION ?? "",
    RUSTICO:    initialPicks.RUSTICO    ?? "",
    FAIR_PLAY:  initialPicks.FAIR_PLAY  ?? "",
    DESASTROZO: initialPicks.DESASTROZO ?? "",
    DECEPCION:  initialPicks.DECEPCION  ?? "",
  }))

  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function set(key: CategoryKey, value: string) {
    setPicks((p) => ({ ...p, [key]: value }))
    setStatus("idle")
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveTournamentPicks(picks)
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  const filledCount = Object.values(picks).filter(Boolean).length

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🎯</span>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Predicciones del Torneo</h2>
            <p className="text-xs text-gray-400 dark:text-neutral-500">
              {locked ? "⏰ Cerradas — el torneo ya comenzó" : "Se cierran al inicio del Mundial"}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 dark:text-neutral-500">{filledCount}/{CATEGORIES.length}</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-4 px-5 py-4">
            <span className="w-7 shrink-0 text-center text-xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-neutral-100">{cat.label}</span>
                  {cat.sublabel && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">{cat.sublabel}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  +{cat.points}
                </span>
              </div>
              {locked ? (
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {picks[cat.key] || <span className="italic text-gray-300 dark:text-neutral-600">Sin selección</span>}
                </p>
              ) : cat.type === "team" ? (
                <TeamSelect value={picks[cat.key]} onChange={(v) => set(cat.key, v)} teams={cat.teams === "top10" ? TOP10 : teams} />
              ) : (
                <PlayerInput
                  value={picks[cat.key]}
                  onChange={(v) => set(cat.key, v)}
                  placeholder={cat.key === "MVP" ? "Ej: Mbappé" : "Ej: Haaland"}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {!locked && (
        <div className="border-t border-gray-100 px-5 py-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending || filledCount === 0}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isPending ? "Guardando…" : "Guardar predicciones"}
            </button>
            {status === "ok" && <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Guardado</span>}
            {status === "error" && <span className="text-sm text-red-500">Error al guardar</span>}
          </div>
        </div>
      )}
    </div>
  )
}
