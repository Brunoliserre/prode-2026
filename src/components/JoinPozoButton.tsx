"use client"

import { useState, useTransition } from "react"
import { Check, HandCoins, Loader } from "lucide-react"
import { requestToJoinPozo } from "@/lib/actions"

interface Props {
  hasPaid: boolean
  wantsToJoin: boolean
}

export function JoinPozoButton({ hasPaid, wantsToJoin }: Props) {
  const [requested, setRequested] = useState(wantsToJoin)
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (hasPaid) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Ya estás participando del pozo
      </p>
    )
  }

  if (requested) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        ¡Listo! Le avisamos al admin — coordiná la transferencia con él.
      </p>
    )
  }

  function handleClick() {
    setError(false)
    startTransition(async () => {
      try {
        await requestToJoinPozo()
        setRequested(true)
      } catch {
        setError(true)
      }
    })
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <HandCoins className="h-3.5 w-3.5" />}
        ¿Querés participar?
      </button>
      {error && <span className="text-xs text-red-500">No se pudo enviar, probá de nuevo</span>}
    </div>
  )
}
