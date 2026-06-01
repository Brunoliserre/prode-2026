"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { deleteUser } from "@/lib/actions"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

export function DeleteUserForm({ users }: { users: User[] }) {
  const [query, setQuery] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filtered = query.trim()
    ? users.filter(
        (u) =>
          !deleted.has(u.id) &&
          (u.name?.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase())),
      )
    : []

  function handleDelete(userId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteUser(userId)
        setDeleted((prev) => new Set(prev).add(userId))
        setConfirmId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al eliminar")
        setConfirmId(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setConfirmId(null); setError(null) }}
        placeholder="Buscar por nombre o email..."
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-600"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {query.trim() && filtered.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-neutral-500">Sin resultados.</p>
      )}

      {filtered.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-neutral-800/50"
        >
          <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} width={32} height={32} className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500 dark:text-neutral-400">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">
              {user.name ?? "Sin nombre"}
            </p>
            <p className="truncate text-xs text-gray-400 dark:text-neutral-500">{user.email}</p>
          </div>

          {confirmId === user.id ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400">¿Confirmar?</span>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "…" : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(user.id)}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
