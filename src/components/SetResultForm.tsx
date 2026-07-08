"use client"

import { useState, useTransition } from "react"
import { setFixtureResult } from "@/lib/actions"

interface Props {
  fixtureId: string
  currentHome?: number | null
  currentAway?: number | null
  currentHomePens?: number | null
  currentAwayPens?: number | null
  knockout?: boolean // si es mata-mata, se pueden cargar penales
}

export function SetResultForm({ fixtureId, currentHome, currentAway, currentHomePens, currentAwayPens, knockout }: Props) {
  const [home, setHome] = useState(currentHome != null ? String(currentHome) : "")
  const [away, setAway] = useState(currentAway != null ? String(currentAway) : "")
  const [homePens, setHomePens] = useState(currentHomePens != null ? String(currentHomePens) : "")
  const [awayPens, setAwayPens] = useState(currentAwayPens != null ? String(currentAwayPens) : "")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  // Penales solo tienen sentido si el partido terminó empatado en tiempo regular.
  const showPens = knockout && home !== "" && away !== "" && home === away

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("fixtureId", fixtureId)
    formData.set("homeScore", home)
    formData.set("awayScore", away)
    formData.set("homePens", showPens ? homePens : "")
    formData.set("awayPens", showPens ? awayPens : "")
    setStatus("idle")
    startTransition(async () => {
      try {
        await setFixtureResult(formData)
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  const inputClass =
    "w-12 rounded border border-gray-300 bg-white p-1 text-center text-sm font-mono text-gray-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-1.5">
      <input
        type="number" min={0} max={30} value={home}
        onChange={(e) => { setHome(e.target.value); setStatus("idle") }}
        className={inputClass} placeholder="–" required
      />
      <span className="font-mono text-xs text-gray-400 dark:text-neutral-500">–</span>
      <input
        type="number" min={0} max={30} value={away}
        onChange={(e) => { setAway(e.target.value); setStatus("idle") }}
        className={inputClass} placeholder="–" required
      />
      {showPens && (
        <span className="flex items-center gap-1.5" title="Definición por penales">
          <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">pen</span>
          <input
            type="number" min={0} max={30} value={homePens}
            onChange={(e) => { setHomePens(e.target.value); setStatus("idle") }}
            className={inputClass} placeholder="–"
          />
          <span className="font-mono text-xs text-gray-400 dark:text-neutral-500">–</span>
          <input
            type="number" min={0} max={30} value={awayPens}
            onChange={(e) => { setAwayPens(e.target.value); setStatus("idle") }}
            className={inputClass} placeholder="–"
          />
        </span>
      )}
      <button
        type="submit" disabled={isPending}
        className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
      >
        {isPending ? "…" : "Guardar"}
      </button>
      {status === "ok" && <span className="text-xs text-green-600">✓</span>}
      {status === "error" && <span className="text-xs text-red-500">Error</span>}
    </form>
  )
}
