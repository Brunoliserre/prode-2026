"use client"

import { useState } from "react"
import { Check, Loader } from "lucide-react"
import { cn, ENTRY_AMOUNT } from "@/lib/utils"
import { setUserPaid } from "@/lib/actions"

interface UserRow {
  id: string
  name: string | null
  image: string | null
  hasPaid: boolean
  wantsToJoin: boolean
}

export function PaidUsersAdmin({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  async function toggle(user: UserRow) {
    setSavingId(user.id)
    setErrorId(null)
    try {
      await setUserPaid(user.id, !user.hasPaid)
      setRows((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, hasPaid: !user.hasPaid } : u)),
      )
    } catch {
      setErrorId(user.id)
    } finally {
      setSavingId(null)
    }
  }

  const paidCount = rows.filter((u) => u.hasPaid).length
  // Pending join requests on top so they don't get missed
  const ordered = [...rows].sort(
    (a, b) => Number(b.wantsToJoin && !b.hasPaid) - Number(a.wantsToJoin && !a.hasPaid),
  )

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          $ {(paidCount * ENTRY_AMOUNT).toLocaleString("es-AR")}
        </span>
        <span className="text-xs text-gray-400 dark:text-neutral-500">
          {paidCount} de {rows.length} transfirieron · $ {ENTRY_AMOUNT.toLocaleString("es-AR")} por cabeza
        </span>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {ordered.map((user) => {
          const saving = savingId === user.id
          return (
            <button
              key={user.id}
              onClick={() => toggle(user)}
              disabled={saving}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-60",
                user.hasPaid
                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                  : "border-gray-200 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-white/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  user.hasPaid
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-300 dark:border-neutral-600",
                )}
              >
                {saving ? (
                  <Loader className="h-3 w-3 animate-spin text-gray-400" />
                ) : user.hasPaid ? (
                  <Check className="h-3 w-3" />
                ) : null}
              </span>
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-6 w-6 shrink-0 rounded-full" />
              ) : (
                <div className="h-6 w-6 shrink-0 rounded-full bg-gray-200 dark:bg-neutral-700" />
              )}
              <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">
                {user.name ?? "Sin nombre"}
              </span>
              {user.wantsToJoin && !user.hasPaid && (
                <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  quiere participar
                </span>
              )}
              {errorId === user.id && (
                <span className="ml-auto shrink-0 text-[10px] text-red-500">Error</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
