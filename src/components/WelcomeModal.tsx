"use client"

import { useEffect, useState } from "react"

// Bump this key to volver a mostrar el modal a todos (cada versión se muestra una vez).
const SEEN_KEY = "prode-welcome-puntaje-v1"

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) !== "1") {
      setOpen(true)
    }
  }, [])

  function close() {
    localStorage.setItem(SEEN_KEY, "1")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Cómo se puntúa el prode 🧠
          </h2>
          <button
            onClick={close}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-neutral-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
          <p>
            Buenas! Antes de arrancar les explico el sistema de puntaje que elegimos, porque le
            dimos varias vueltas 🧠
          </p>

          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Cómo se puntúa cada partido:</p>
            <ul className="mt-1.5 space-y-1">
              <li>• <strong>+4</strong> si acertás quién gana (o el empate)</li>
              <li>• <strong>+1</strong> por cada equipo al que le acertás los goles</li>
              <li>• <strong>+1</strong> extra si clavás el resultado exacto → <strong>total 7</strong></li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
            <p className="font-semibold text-gray-900 dark:text-white">Ejemplo, si sale Argentina 2-1:</p>
            <ul className="mt-1.5 space-y-1">
              <li>→ Pusiste <strong>2-1</strong>: <strong>7 puntos</strong> (exacto)</li>
              <li>→ Pusiste <strong>2-0</strong> o <strong>3-1</strong>: <strong>5</strong> (ganador + un equipo)</li>
              <li>→ Pusiste <strong>1-0</strong>: <strong>4</strong> (sabías que ganaba por poco)</li>
              <li>→ Pusiste empate o que ganaba el otro: <strong>0</strong></li>
            </ul>
          </div>

          <p className="font-semibold text-gray-900 dark:text-white">
            ¿Por qué este y no el típico exacto = la mayoría de los puntos? Dos razones:
          </p>

          <div className="space-y-3">
            <p>
              <strong>1️⃣ Premia conocimiento, no suerte.</strong> Adivinar el marcador exacto es
              medio random; saber quién gana y cómo viene el partido tiene más mérito. Acá el que
              lee bien suma fuerte aunque no clave el número justo.
            </p>
            <p>
              <strong>2️⃣ La pelea queda abierta.</strong> Probamos los puntajes con datos reales y
              con este sistema el puntero no se escapa nunca de forma definitiva: siempre hay
              fechas para recortar.
            </p>
          </div>

          <p>
            Se mantienen los primeros 3 puestos igual, hay alguna varianza en los puestos 4-10
            pero nada raro.
          </p>

          <p>Cualquier puteada, ya saben cómo contactarme.</p>

          <p className="font-medium text-gray-900 dark:text-white">
            Bruno Liserre, CEO del prode
          </p>
        </div>

        <div className="border-t border-gray-200 px-5 py-4 dark:border-white/10">
          <button
            onClick={close}
            className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            ¡Entendido, a jugar!
          </button>
        </div>
      </div>
    </div>
  )
}
