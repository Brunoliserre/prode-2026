"use client"

import { useState } from "react"
import { Download } from "lucide-react"

type Status = "idle" | "loading" | "done" | "error"

export function SyncFixturesButton() {
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function handleSync() {
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/sync-fixtures")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error desconocido")
      setMessage(
        data.created > 0
          ? `${data.created} partido(s) creado(s)`
          : `Sin novedades (${data.checked} partidos revisados)`,
      )
      setStatus("done")
      if (data.created > 0) window.location.reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al sincronizar")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        <Download className={`h-4 w-4 ${status === "loading" ? "animate-bounce" : ""}`} />
        {status === "loading" ? "Importando..." : "Importar partidos desde API"}
      </button>
      {message && (
        <span className={`text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </span>
      )}
    </div>
  )
}
