"use client"

import { useRef, useState, useTransition } from "react"
import { createFixture } from "@/lib/actions"

export function CreateFixtureForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [errMsg, setErrMsg] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setStatus("idle")
    startTransition(async () => {
      try {
        await createFixture(formData)
        setStatus("ok")
        formRef.current?.reset()
      } catch (err) {
        setStatus("error")
        setErrMsg(err instanceof Error ? err.message : "Error desconocido")
      }
    })
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1"

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Local</label>
          <input name="homeTeam" type="text" required className={inputClass} placeholder="Argentina" />
        </div>
        <div>
          <label className={labelClass}>Visitante</label>
          <input name="awayTeam" type="text" required className={inputClass} placeholder="Brasil" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Fecha y hora</label>
          <input name="matchDate" type="datetime-local" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Grupo</label>
          <input name="group" type="text" className={inputClass} placeholder="A" maxLength={2} />
        </div>
      </div>
      <div className="w-24">
        <label className={labelClass}>Fecha nº</label>
        <input name="matchday" type="number" min={1} max={3} className={inputClass} placeholder="1" />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-[#1a3a6b] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Creando…" : "Crear partido"}
        </button>
        {status === "ok" && <span className="text-sm text-green-600 font-medium">✓ Partido creado</span>}
        {status === "error" && <span className="text-sm text-red-500">{errMsg}</span>}
      </div>
    </form>
  )
}
