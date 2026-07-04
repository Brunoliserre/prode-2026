"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Formation } from "@/lib/formations"
import { DreamTeamPitch, type PitchPlayer } from "./DreamTeamPitch"

export type OthersTeam = {
  userId: string
  name: string | null
  image: string | null
  formation: Formation
  picks: Record<string, PitchPlayer>
  complete: boolean
  score: number | null
  position: number | null
  points: number | null
}
export type OthersRound = { round: string; label: string; finalized: boolean; teams: OthersTeam[] }

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  if (image) return <Image src={image} alt={name ?? ""} width={28} height={28} className="shrink-0 rounded-full" />
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
      {name?.[0] ?? "?"}
    </div>
  )
}

function RoundCard({
  round,
  onView,
  defaultOpen,
}: {
  round: OthersRound
  onView: (t: OthersTeam, label: string) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">{round.label}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
            {round.teams.length}
          </span>
          {!round.finalized && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              en juego
            </span>
          )}
        </div>
        <ChevronUp className={cn("h-4 w-4 text-gray-300 transition-transform duration-200 dark:text-neutral-600", !open && "rotate-180")} />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left dark:border-white/5">
                <th className="px-4 py-2 font-semibold text-gray-400 dark:text-neutral-500">#</th>
                <th className="px-2 py-2 font-semibold text-gray-400 dark:text-neutral-500">Jugador</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-400 dark:text-neutral-500">Suma</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-400 dark:text-neutral-500">Pts fecha</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {round.teams.map((t) => (
                <tr key={t.userId} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400 dark:text-neutral-500">
                    {round.finalized && t.position != null ? `${t.position}º` : "—"}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={t.name} image={t.image} />
                      <span className="truncate text-gray-800 dark:text-neutral-100">{t.name ?? "Anónimo"}</span>
                      {!t.complete && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
                          incompleto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-gray-500 dark:text-neutral-400">
                    {t.score != null ? t.score.toFixed(1) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold tabular-nums text-gray-900 dark:text-white">
                    {round.finalized && t.points != null ? `+${t.points}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onView(t, round.label)}
                      className="whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      Ver dream team
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function OthersDreamTeams({ rounds }: { rounds: OthersRound[] }) {
  const [open, setOpen] = useState<{ team: OthersTeam; label: string } | null>(null)

  if (!rounds.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-neutral-500">
        Todavía no hay rondas para mostrar. Vas a poder ver los equipos de los demás cuando empiecen sus partidos.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {rounds.map((r, i) => (
          <RoundCard key={r.round} round={r} onView={(team, label) => setOpen({ team, label })} defaultOpen={i === 0} />
        ))}
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
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Avatar name={open.team.name} image={open.team.image} />
              {open.team.name ?? "Anónimo"}
              <span className="text-sm font-normal text-gray-400 dark:text-neutral-500">
                · {open.label} · {open.team.formation}
                {open.team.points != null && ` · ${open.team.position}º · +${open.team.points} pts`}
              </span>
            </h3>
            <DreamTeamPitch formation={open.team.formation} picks={open.team.picks} />
          </div>
        </div>
      )}
    </>
  )
}
