"use client"

import { useState } from "react"
import { Lock, User, X } from "lucide-react"
import { cn, ratingTextColor } from "@/lib/utils"
import { type Formation, type Pos, lineCounts, POS_LABEL } from "@/lib/formations"

export type PitchPlayer = {
  id: string
  name: string
  club: string
  position: Pos
  rating?: number | null
  photoUrl?: string | null
}

// Columnas de izquierda (arquero) a derecha (delanteros), estilo cancha horizontal.
const LINE_X: Record<Pos, number> = { GK: 9, DEF: 33, MED: 56, FWD: 80 }
const LINE_ORDER: Pos[] = ["GK", "DEF", "MED", "FWD"]

function Head({ p, onRemove, locked }: { p: PitchPlayer; onRemove?: () => void; locked?: boolean }) {
  const [err, setErr] = useState(false)
  return (
    <div className="group flex w-20 flex-col items-center gap-1">
      <div className="relative">
        <div className={cn(
          "h-12 w-12 overflow-hidden rounded-full border-2 bg-gray-200 shadow-md dark:bg-neutral-700",
          locked ? "border-amber-400" : "border-white",
        )}>
          {p.photoUrl && !err ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" onError={() => setErr(true)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-neutral-400">
              <User className="h-6 w-6" />
            </div>
          )}
        </div>
        {locked && p.rating == null ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white shadow" title="Bloqueado: el partido ya empezó">
            <Lock className="h-2.5 w-2.5" />
          </span>
        ) : !locked && onRemove ? (
          <button
            onClick={onRemove}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
            aria-label="Quitar"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </div>
      <div className="max-w-[5.5rem] rounded bg-black/55 px-1.5 py-0.5 text-center leading-tight backdrop-blur-sm">
        <p className="truncate text-[11px] font-semibold text-white">{p.name}</p>
        <p className="truncate text-[9px] text-white/70">{p.club}</p>
      </div>
      {p.rating != null && (
        <span className={cn("rounded bg-white px-1.5 py-0.5 text-[11px] font-bold tabular-nums shadow-sm", ratingTextColor(p.rating))}>
          {p.rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function EmptySlot({ pos, onClick }: { pos: Pos; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-20 flex-col items-center gap-1"
      type="button"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-white/80 backdrop-blur-sm">
        <span className="text-lg font-light">+</span>
      </div>
      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
        {POS_LABEL[pos]}
      </span>
    </button>
  )
}

interface Props {
  formation: Formation
  picks: Record<string, PitchPlayer>
  onSlotClick?: (slotKey: string, pos: Pos) => void
  onRemove?: (slotKey: string) => void
  onMove?: (fromKey: string, toKey: string) => void
  isLocked?: (p: PitchPlayer) => boolean
}

export function DreamTeamPitch({ formation, picks, onSlotClick, onRemove, onMove, isLocked }: Props) {
  const counts = lineCounts(formation)
  const [dragKey, setDragKey] = useState<string | null>(null)
  // La posición se infiere del slotKey (ej. "FWD0" → "FWD"); solo se puede soltar
  // sobre slots de la misma posición.
  const dragPos = dragKey ? dragKey.replace(/\d+$/, "") : null

  return (
    <div className="overflow-x-auto">
      <div
        className="relative mx-auto aspect-[16/10] min-w-[620px] overflow-hidden rounded-2xl shadow-inner"
        style={{
          // Turf oscuro con franjas de corte: da textura y hace contraste con los puntajes.
          background: "repeating-linear-gradient(90deg,#0f3d22 0 9%,#14532d 9% 18%)",
        }}
      >
        {/* Líneas de la cancha */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62" preserveAspectRatio="none">
          <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4">
            <rect x="1" y="1" width="98" height="60" />
            <line x1="50" y1="1" x2="50" y2="61" />
            <circle cx="50" cy="31" r="9" />
            <rect x="1" y="17" width="13" height="28" />
            <rect x="86" y="17" width="13" height="28" />
          </g>
        </svg>

        {/* Slots por línea */}
        {LINE_ORDER.map((pos) => {
          const n = counts[pos]
          return Array.from({ length: n }).map((_, i) => {
            const key = `${pos}${i}`
            const player = picks[key]
            const playerLocked = player ? !!isLocked?.(player) : false
            const validTarget =
              !!onMove && dragKey != null && dragPos === pos && dragKey !== key && !playerLocked
            return (
              <div
                key={key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${LINE_X[pos]}%`, top: `${((i + 1) / (n + 1)) * 100}%` }}
                onDragOver={(e) => { if (validTarget) e.preventDefault() }}
                onDrop={(e) => {
                  if (validTarget && onMove && dragKey) {
                    e.preventDefault()
                    onMove(dragKey, key)
                    setDragKey(null)
                  }
                }}
              >
                {player ? (
                  <div
                    draggable={!!onMove && !playerLocked}
                    onDragStart={() => setDragKey(key)}
                    onDragEnd={() => setDragKey(null)}
                    className={cn(
                      onMove && !playerLocked && "cursor-grab active:cursor-grabbing",
                      validTarget && "rounded-2xl ring-2 ring-white/90",
                    )}
                  >
                    <Head p={player} locked={playerLocked} onRemove={onRemove ? () => onRemove(key) : undefined} />
                  </div>
                ) : (
                  <div className={cn(validTarget && "rounded-2xl ring-2 ring-white/90")}>
                    <EmptySlot pos={pos} onClick={onSlotClick ? () => onSlotClick(key, pos) : undefined} />
                  </div>
                )}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}
