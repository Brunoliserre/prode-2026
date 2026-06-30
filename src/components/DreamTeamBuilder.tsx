"use client"

import { useMemo, useState, useTransition } from "react"
import { Check, Loader, Lock, Search, Trash2, X } from "lucide-react"
import { cn, ratingColor } from "@/lib/utils"
import { esTeamName } from "@/lib/flags"
import { FORMATIONS, type Formation, type Pos, lineCounts, POS_LABEL } from "@/lib/formations"
import { TEAMS, squadFor, PLAYER_BY_ID } from "@/lib/dreamteam-mock"
import { saveDreamTeam } from "@/lib/actions"
import { DreamTeamPitch, type PitchPlayer } from "./DreamTeamPitch"

const POS_ORDER: Pos[] = ["GK", "DEF", "MED", "FWD"]
const teamOf = (p: PitchPlayer) => p.id.slice(0, p.id.lastIndexOf("-"))

interface Props {
  round: string
  roundLabel: string
  initialFormation: Formation | null
  initialPicks: Record<string, string> // slot → playerId
  lockedTeams: string[]
  ratings?: Record<string, number> // playerId → rating de la ronda (si ya está cargado)
}

export function DreamTeamBuilder({ round, roundLabel, initialFormation, initialPicks, lockedTeams, ratings }: Props) {
  const locked = useMemo(() => new Set(lockedTeams), [lockedTeams])
  const isLocked = (p: PitchPlayer) => locked.has(teamOf(p))

  const [formation, setFormation] = useState<Formation>(initialFormation ?? "3-1-2")
  const [picks, setPicks] = useState<Record<string, PitchPlayer>>(() => {
    const init: Record<string, PitchPlayer> = {}
    for (const [slot, pid] of Object.entries(initialPicks)) {
      const p = PLAYER_BY_ID.get(pid)
      if (p) init[slot] = p
    }
    return init
  })
  const [team, setTeam] = useState<string>(TEAMS[0])
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState(true)
  const [isSaving, startSaving] = useTransition()

  const counts = lineCounts(formation)
  const squad = useMemo(() => squadFor(team), [team])

  // Buscador de jugadores en todos los equipos (por nombre o selección, sin acentos).
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  const allPlayers = useMemo(() => [...PLAYER_BY_ID.values()], [])
  const searching = query.trim().length >= 2
  const results = useMemo(() => {
    if (!searching) return []
    const q = norm(query.trim())
    return allPlayers.filter((p) => norm(p.name).includes(q) || norm(p.club).includes(q)).slice(0, 60)
  }, [query, searching, allPlayers])
  const pickedIds = new Set(Object.values(picks).map((p) => p.id))
  const filled = Object.keys(picks).length
  // Picks con el rating de la ronda (si ya está cargado) para mostrar en la cancha.
  const pitchPicks = useMemo(() => {
    if (!ratings) return picks
    const out: Record<string, PitchPlayer> = {}
    for (const [slot, p] of Object.entries(picks)) {
      const r = ratings[p.id]
      out[slot] = r != null ? { ...p, rating: r } : p
    }
    return out
  }, [picks, ratings])
  const total = Object.values(pitchPicks).reduce((s, p) => s + (p.rating ?? 0), 0)
  const dirty = () => setSaved(false)

  // Cantidad de jugadores bloqueados por posición (para validar formaciones).
  const lockedCount = useMemo(() => {
    const c: Record<Pos, number> = { GK: 0, DEF: 0, MED: 0, FWD: 0 }
    for (const [slot, p] of Object.entries(picks))
      if (isLocked(p)) c[slot.replace(/\d+$/, "") as Pos]++
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, locked])

  const formationFits = (f: Formation) => {
    const c = lineCounts(f)
    return POS_ORDER.every((pos) => lockedCount[pos] <= c[pos])
  }

  function changeFormation(f: Formation) {
    if (!formationFits(f)) return
    const c = lineCounts(f)
    setPicks((prev) => {
      const next: Record<string, PitchPlayer> = {}
      for (const pos of POS_ORDER) {
        const all: PitchPlayer[] = []
        for (let i = 0; i < 12; i++) if (prev[`${pos}${i}`]) all.push(prev[`${pos}${i}`])
        // Los bloqueados primero, para no descartarlos al achicar la línea.
        const ordered = [...all.filter(isLocked), ...all.filter((p) => !isLocked(p))]
        ordered.slice(0, c[pos]).forEach((p, i) => (next[`${pos}${i}`] = p))
      }
      return next
    })
    setFormation(f)
    dirty()
  }

  function assign(p: PitchPlayer) {
    if (pickedIds.has(p.id) || isLocked(p)) return
    for (let i = 0; i < counts[p.position]; i++) {
      const k = `${p.position}${i}`
      if (!picks[k]) {
        setPicks((prev) => ({ ...prev, [k]: p }))
        dirty()
        return
      }
    }
  }

  function removeSlot(k: string) {
    if (picks[k] && isLocked(picks[k])) return
    setPicks((prev) => {
      const n = { ...prev }
      delete n[k]
      return n
    })
    dirty()
  }

  function move(fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    if ((picks[fromKey] && isLocked(picks[fromKey])) || (picks[toKey] && isLocked(picks[toKey]))) return
    setPicks((prev) => {
      const n = { ...prev }
      const a = n[fromKey]
      const b = n[toKey]
      if (b) n[fromKey] = b
      else delete n[fromKey]
      if (a) n[toKey] = a
      else delete n[toKey]
      return n
    })
    dirty()
  }

  // Borra las selecciones (mantiene los bloqueados) y guarda ese estado, así el
  // equipo viejo deja de contar aunque quede incompleto.
  function clear() {
    const cleared: Record<string, PitchPlayer> = {}
    for (const [slot, p] of Object.entries(picks)) if (isLocked(p)) cleared[slot] = p
    setPicks(cleared)
    const data = Object.entries(cleared).map(([slot, p]) => ({ slot, playerId: p.id }))
    startSaving(async () => {
      try {
        await saveDreamTeam(round, formation, data)
        setSaved(true)
      } catch {
        setSaved(false)
      }
    })
  }
  const clearable = Object.values(picks).some((p) => !isLocked(p))

  function posFull(pos: Pos) {
    let c = 0
    for (let i = 0; i < counts[pos]; i++) if (picks[`${pos}${i}`]) c++
    return c >= counts[pos]
  }

  function save() {
    const data = Object.entries(picks).map(([slot, p]) => ({ slot, playerId: p.id }))
    startSaving(async () => {
      try {
        await saveDreamTeam(round, formation, data)
        setSaved(true)
      } catch {
        setSaved(false)
      }
    })
  }

  const complete = filled === 7
  const teamLocked = locked.has(team)

  return (
    <div className="space-y-5">
      {/* Header: formación + acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            Formación
          </span>
          {FORMATIONS.map((f) => {
            const fits = formationFits(f)
            return (
              <button
                key={f}
                onClick={() => changeFormation(f)}
                disabled={!fits}
                title={!fits ? "No entra con los jugadores ya bloqueados" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors disabled:opacity-30",
                  formation === f
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
                )}
              >
                {f}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {total > 0 && (
            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-bold tabular-nums text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              {total.toFixed(1)} pts
            </span>
          )}
          <span className="text-gray-500 dark:text-neutral-400">
            <span className="font-bold text-gray-900 dark:text-white">{filled}</span>/7
          </span>
          <button
            onClick={clear}
            disabled={!clearable || isSaving}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
          <button
            onClick={save}
            disabled={!complete || isSaving || saved}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
              saved
                ? "bg-emerald-100 text-emerald-600 disabled:opacity-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40",
            )}
          >
            {isSaving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
            {isSaving ? "Guardando" : saved ? "Guardado" : "Guardar equipo"}
          </button>
        </div>
      </div>

      {!complete && (
        <p className="-mt-2 text-xs text-gray-400 dark:text-neutral-500">
          Completá los 7 jugadores para guardar tu equipo de {roundLabel}.
        </p>
      )}

      {/* Cancha */}
      <DreamTeamPitch formation={formation} picks={pitchPicks} onRemove={removeSlot} onMove={move} isLocked={isLocked} />

      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jugador o selección…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-600"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching ? (
        /* Resultados de la búsqueda (todos los equipos) */
        <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-white/5 dark:bg-neutral-900">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-gray-400 dark:text-neutral-500">
              Sin resultados para “{query.trim()}”.
            </p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {results.map((p) => {
                const picked = pickedIds.has(p.id)
                const lockedP = locked.has(teamOf(p))
                const disabled = picked || posFull(p.position) || lockedP
                return (
                  <button
                    key={p.id}
                    onClick={() => assign(p)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      picked
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : disabled
                          ? "cursor-not-allowed text-gray-300 dark:text-neutral-600"
                          : "text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-white/5",
                    )}
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-gray-400 dark:text-neutral-500">
                      {lockedP && <Lock className="h-3 w-3 text-amber-500" />}
                      {p.club} · {POS_LABEL[p.position]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Selector de equipo */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
          Equipo
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {TEAMS.map((t) => (
            <button
              key={t}
              onClick={() => setTeam(t)}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                team === t
                  ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5",
              )}
            >
              {locked.has(t) && <Lock className="h-3 w-3 text-amber-500" />}
              {esTeamName(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Pool de jugadores del equipo */}
      {teamLocked && (
        <p className="-mb-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5" /> {esTeamName(team)} ya juega — sus jugadores están bloqueados.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POS_ORDER.map((pos) => (
          <div key={pos} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/5 dark:bg-neutral-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                {POS_LABEL[pos]}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-neutral-600">
                {Object.keys(picks).filter((k) => k.startsWith(pos)).length}/{counts[pos]}
              </span>
            </div>
            <div className="space-y-1">
              {squad
                .filter((p) => p.position === pos)
                .map((p) => {
                  const picked = pickedIds.has(p.id)
                  const disabled = picked || posFull(pos) || teamLocked
                  return (
                    <button
                      key={p.id}
                      onClick={() => assign(p)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        picked
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : disabled
                            ? "cursor-not-allowed text-gray-300 dark:text-neutral-600"
                            : "text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-white/5",
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.rating != null && (
                        <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums", ratingColor(p.rating))}>
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  )
}
