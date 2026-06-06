"use client"

import { useState, useTransition } from "react"
import { sendReminderEmail, sendAnnouncementEmail } from "@/lib/actions"

type Tab = "reminder" | "announcement"
type Status = { type: "ok"; sent: number; failed: number } | { type: "error"; message: string } | null

export function EmailAdmin({ userCount }: { userCount: number }) {
  const [tab, setTab] = useState<Tab>("reminder")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState<Status>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setStatus(null)
  }

  function handleSend() {
    setStatus(null)
    startTransition(async () => {
      try {
        const result =
          tab === "reminder"
            ? await sendReminderEmail()
            : await sendAnnouncementEmail(subject, body)
        setStatus({ type: "ok", sent: result.sent, failed: result.failed })
      } catch (e) {
        setStatus({ type: "error", message: e instanceof Error ? e.message : "Error inesperado" })
      }
    })
  }

  const canSend =
    !isPending &&
    (tab === "reminder" || (subject.trim().length > 0 && body.trim().length > 0))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["reminder", "announcement"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); reset() }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {t === "reminder" ? "Recordatorio de picks" : "Anuncio personalizado"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "reminder" ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-neutral-800/40">
          <p className="text-sm font-medium text-gray-800 dark:text-neutral-100">
            Recordatorio de predicciones
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            Asunto: <span className="italic">Completá tus predicciones — Mundial 2026</span>
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            Cuerpo: recordatorio con link directo a /predicciones, personalizado con el nombre del usuario.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Asunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); reset() }}
              placeholder="Ej: Arranca el Mundial 2026 🏆"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Mensaje
            </label>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); reset() }}
              rows={5}
              placeholder="Escribí el mensaje que van a recibir todos los usuarios..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-600"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isPending ? "Enviando…" : `Enviar a ${userCount} usuarios`}
        </button>

        {status?.type === "ok" && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ {status.sent} enviados{status.failed > 0 ? `, ${status.failed} fallidos` : ""}
          </span>
        )}
        {status?.type === "error" && (
          <span className="text-sm text-red-500">{status.message}</span>
        )}
      </div>
    </div>
  )
}
