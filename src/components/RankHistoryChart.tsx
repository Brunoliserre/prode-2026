"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type RankSeries = { id: string; name: string; positions: number[] }
type Dataset = { labels: string[]; series: RankSeries[] }

interface Props {
  byFecha: Dataset
  byPartido: Dataset
  players: number // cantidad total de jugadores (para la escala vertical)
}

// Paleta de colores distinguibles, funciona en claro y oscuro.
const COLORS = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6",
  "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#84cc16",
  "#06b6d4", "#e11d48", "#a855f7", "#0ea5e9", "#d946ef",
]

export function RankHistoryChart({ byFecha, byPartido, players }: Props) {
  const [mode, setMode] = useState<"fecha" | "partido">("fecha")
  const [active, setActive] = useState<string | null>(null)

  const { labels, series } = mode === "fecha" ? byFecha : byPartido

  const W = 760
  const H = Math.max(220, 60 + players * 26)
  const padL = 30, padR = 16, padT = 18, padB = 30
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const n = labels.length

  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (pos: number) => padT + (players <= 1 ? plotH / 2 : ((pos - 1) / (players - 1)) * plotH)
  const colorOf = (idx: number) => COLORS[idx % COLORS.length]

  const activeIdx = active != null ? series.findIndex((s) => s.id === active) : -1
  const activeSeries = activeIdx >= 0 ? series[activeIdx] : null

  // Con muchos puntos (modo "por partido") sólo etiquetamos algunos para no amontonar.
  const labelStep = Math.max(1, Math.ceil(n / 9))
  const showLabel = (i: number) => i === 0 || i === n - 1 || i % labelStep === 0

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-neutral-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📈</span>
          <h2 className="font-semibold text-gray-900 dark:text-white">Evolución de posiciones</h2>
          {activeSeries && (
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-neutral-100">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(activeIdx) }} />
              {activeSeries.name}
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
          {(["fecha", "partido"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === m
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200",
              )}
            >
              {m === "fecha" ? "Por fecha" : "Por partido"}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-400 dark:text-neutral-500">
        {mode === "fecha"
          ? "Puesto de cada jugador al cierre de cada fecha."
          : "Puesto después de cada partido finalizado (en orden cronológico)."}{" "}
        Pasá el mouse sobre una línea o nombre para resaltarla.
      </p>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[460px]" role="img">
          {/* Líneas guía + número de puesto por fila */}
          {Array.from({ length: players }, (_, k) => k + 1).map((pos) => (
            <g key={pos}>
              <line
                x1={padL} y1={y(pos)} x2={W - padR} y2={y(pos)}
                className="stroke-gray-100 dark:stroke-white/5"
                strokeWidth={1}
              />
              <text
                x={padL - 8} y={y(pos)} dominantBaseline="middle" textAnchor="end"
                className="fill-gray-300 text-[10px] dark:fill-neutral-600"
              >
                {pos}
              </text>
            </g>
          ))}

          {/* Etiquetas del eje X */}
          {labels.map((l, i) =>
            showLabel(i) ? (
              <text
                key={i} x={x(i)} y={H - 10} textAnchor="middle"
                className="fill-gray-400 text-[11px] font-medium dark:fill-neutral-500"
              >
                {mode === "fecha" ? l : `#${l}`}
              </text>
            ) : null,
          )}

          {/* Una línea por jugador */}
          {series.map((s, idx) => {
            const color = colorOf(idx)
            const dim = active != null && active !== s.id
            const isActive = active === s.id
            const pts = s.positions.map((p, i) => `${x(i)},${y(p)}`).join(" ")
            return (
              <g
                key={s.id}
                opacity={dim ? 0.12 : 1}
                onMouseEnter={() => setActive(s.id)}
                onMouseLeave={() => setActive(null)}
                style={{ cursor: "pointer" }}
              >
                <polyline
                  points={pts} fill="none" stroke={color}
                  strokeWidth={isActive ? 3.5 : 2}
                  strokeLinejoin="round" strokeLinecap="round"
                />
                {s.positions.map((p, i) => (
                  <circle key={i} cx={x(i)} cy={y(p)} r={isActive ? 4.5 : n > 12 ? 2 : 3} fill={color} />
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        {series.map((s, idx) => {
          const dim = active != null && active !== s.id
          return (
            <button
              key={s.id} type="button"
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
              className={cn("flex items-center gap-1.5 text-xs transition-opacity", dim ? "opacity-40" : "opacity-100")}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(idx) }} />
              <span className="text-gray-600 dark:text-neutral-300">{s.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
