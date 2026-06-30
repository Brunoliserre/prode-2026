"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Formation } from "@/lib/formations"
import { DreamTeamPitch, type PitchPlayer } from "./DreamTeamPitch"

export type MyTeam = {
  round: string
  label: string
  formation: Formation
  picks: Record<string, PitchPlayer>
  complete: boolean
  finalized: boolean
  score: number | null
  avg: number | null
  position: number | null
  points: number | null
}

export function MyDreamTeams({ teams }: { teams: MyTeam[] }) {
  const [open, setOpen] = useState<MyTeam | null>(null)

  if (!teams.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-neutral-500">
        Todavía no armaste ningún dream team.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100/50 text-left dark:border-white/5 dark:bg-neutral-800/50">
              <th className="px-4 py-3 font-semibold text-gray-500 dark:text-neutral-400">Fecha</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Prom.</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Puesto</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-neutral-400">Pts</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.round} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-neutral-100">
                  {t.label}
                  {!t.finalized && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      en juego
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-600 dark:text-neutral-300">
                  {t.avg != null ? t.avg.toFixed(1) : "—"}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-600 dark:text-neutral-300">
                  {t.finalized && t.position != null ? `${t.position}º` : "—"}
                </td>
                <td className="px-3 py-3 text-center font-bold tabular-nums text-gray-900 dark:text-white">
                  {t.finalized && t.points != null ? `+${t.points}` : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => setOpen(t)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                  >
                    Ver jugadores
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-neutral-200"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              {open.label} · {open.formation}
              {open.points != null && (
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-neutral-500">
                  {open.position}º · +{open.points} pts
                </span>
              )}
            </h3>
            <DreamTeamPitch formation={open.formation} picks={open.picks} />
          </div>
        </div>
      )}
    </>
  )
}
