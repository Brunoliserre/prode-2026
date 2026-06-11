"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, Loader, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFixturePredictions } from "@/lib/actions"

type UserPrediction = {
  userId: string
  name: string | null
  image: string | null
  homeScore: number
  awayScore: number
}

interface Props {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  currentUserId?: string
}

export function MatchPredictionsModal({ fixtureId, homeTeam, awayTeam, currentUserId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [predictions, setPredictions] = useState<UserPrediction[] | null>(null)

  async function show() {
    setOpen(true)
    if (predictions) return
    setLoading(true)
    setError(false)
    try {
      setPredictions(await getFixturePredictions(fixtureId))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={show}
        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
      >
        <Eye className="h-3 w-3" />
        Ver predicciones
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/5">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {homeTeam} vs {awayTeam}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                  Predicciones de todos los participantes
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-white/5 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-5 w-5 animate-spin text-gray-400 dark:text-neutral-500" />
                </div>
              ) : error ? (
                <p className="px-4 py-8 text-center text-sm text-red-500">
                  No se pudieron cargar las predicciones.
                </p>
              ) : predictions && predictions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-neutral-500">
                  Nadie pronosticó este partido.
                </p>
              ) : (
                predictions?.map((p) => (
                  <div
                    key={p.userId}
                    className={cn(
                      "flex items-center justify-between border-b border-gray-100 px-4 py-2.5 last:border-0 dark:border-white/5",
                      p.userId === currentUserId && "bg-blue-50/50 dark:bg-blue-500/5",
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.name ?? ""} width={28} height={28} className="shrink-0 rounded-full" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
                          {p.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span className="truncate text-sm text-gray-800 dark:text-neutral-100">
                        {p.name ?? "Sin nombre"}
                        {p.userId === currentUserId && (
                          <span className="ml-1.5 text-[10px] text-blue-500 dark:text-blue-400">vos</span>
                        )}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                      {p.homeScore}–{p.awayScore}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
