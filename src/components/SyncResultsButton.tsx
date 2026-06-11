"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

type Status = "idle" | "loading" | "done" | "error"

export function SyncResultsButton() {
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function handleSync() {
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/sync-results")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error desconocido")
      let msg =
        data.updated > 0
          ? `${data.updated} partido(s) actualizado(s) de ${data.checked} finalizados`
          : `Sin novedades (${data.checked} partidos finalizados revisados)`
      if (data.unmatched?.length > 0) {
        msg += ` — sin match en la base: ${data.unmatched.join(", ")}`
      }
      setMessage(msg)
      setStatus("done")
      if (data.updated > 0) window.location.reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al sincronizar")
      setStatus("error")
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
        {status === "loading" ? "Sincronizando..." : "Sincronizar resultados"}
      </button>
      {message && (
        <span className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </span>
      )}
    </div>
  )
}
