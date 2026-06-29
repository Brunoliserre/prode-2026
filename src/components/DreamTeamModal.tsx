"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

const SEEN_KEY = "dreamteam-intro-v1"

export function DreamTeamModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) setOpen(true)
  }, [])

  if (!open) return null

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1")
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-neutral-200"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 text-4xl">🏆</div>
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          Nuevo modo: Dream Team
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">
          Para la fase de <span className="font-semibold">eliminatorias</span>, armá tu equipo
          ideal con jugadores de las selecciones que siguen en carrera y sumá los puntos de cada uno.
        </p>

        <ul className="mb-5 space-y-2 text-sm text-gray-700 dark:text-neutral-200">
          <li className="flex gap-2">
            <span>⚽</span> <span><b>7 jugadores</b>: 1 arquero + la formación que elijas (2-2-2, 3-1-2, 2-1-3…).</span>
          </li>
          <li className="flex gap-2">
            <span>🔁</span> <span>Se <b>rearma cada ronda</b> (16vos, 8vos, 4tos…).</span>
          </li>
          <li className="flex gap-2">
            <span>🥇</span> <span>El que <b>más puntos suma, más puntos gana.</b></span>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/dreamteam"
            onClick={close}
            className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Probar ahora
          </Link>
          <button
            onClick={close}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  )
}
