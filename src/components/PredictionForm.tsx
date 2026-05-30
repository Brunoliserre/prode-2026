"use client"

import { useState, useTransition } from "react"
import { submitPrediction } from "@/lib/actions"

interface Props {
  fixtureId: string
  initialHome?: number | null
  initialAway?: number | null
}

export function PredictionForm({ fixtureId, initialHome, initialAway }: Props) {
  const [home, setHome] = useState(initialHome != null ? String(initialHome) : "")
  const [away, setAway] = useState(initialAway != null ? String(initialAway) : "")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (home === "" || away === "") return
    setStatus("idle")
    startTransition(async () => {
      try {
        await submitPrediction(fixtureId, Number(home), Number(away))
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  const inputClass =
    "w-14 rounded border border-gray-300 p-1.5 text-center text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={30}
        value={home}
        onChange={(e) => { setHome(e.target.value); setStatus("idle") }}
        className={inputClass}
        placeholder="–"
        required
      />
      <span className="font-mono text-gray-400">–</span>
      <input
        type="number"
        min={0}
        max={30}
        value={away}
        onChange={(e) => { setAway(e.target.value); setStatus("idle") }}
        className={inputClass}
        placeholder="–"
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-[#1a3a6b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
      >
        {isPending ? "…" : initialHome != null ? "Actualizar" : "Guardar"}
      </button>
      {status === "ok" && <span className="text-xs text-green-600 font-medium">✓ Guardado</span>}
      {status === "error" && <span className="text-xs text-red-500">Error</span>}
    </form>
  )
}
