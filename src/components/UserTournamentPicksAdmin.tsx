"use client"

import { useState } from "react"
import { Check, Loader, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCountryCode } from "@/lib/flags"
import { adminSaveUserPicks } from "@/lib/actions"
import { TOP10 } from "./TournamentPredictions"
import * as Flags from "country-flag-icons/react/3x2"

const CATEGORIES = [
  { key: "CHAMPION",   label: "Campeón",     icon: "🏆", type: "team",   teams: "top10" },
  { key: "RUNNER_UP",  label: "Subcampeón",  icon: "🥈", type: "team",   teams: "top10" },
  { key: "MVP",        label: "MVP",         icon: "🌟", type: "player", teams: "all" },
  { key: "PICHICHI",   label: "Pichichi",    icon: "👟", type: "player", teams: "all" },
  { key: "REVELATION", label: "Revelación",  icon: "⭐", type: "team",   teams: "all" },
  { key: "RUSTICO",    label: "Rústico",     icon: "💥", type: "team",   teams: "all" },
  { key: "FAIR_PLAY",  label: "Fair Play",   icon: "🤝", type: "team",   teams: "all" },
  { key: "DESASTROSO", label: "Desastroso",  icon: "🎯", type: "team",   teams: "all" },
  { key: "DECEPCION",  label: "Decepción",   icon: "😞", type: "team",   teams: "top10" },
] as const

const PLAYER_CATEGORIES = new Set(["MVP", "PICHICHI"])

interface UserRow {
  id: string
  name: string | null
  image: string | null
  picks: Record<string, string>
}

function TeamFlag({ team }: { team: string }) {
  const code = getCountryCode(team)
  if (!code) return null
  const Flag = Flags[code as keyof typeof Flags]
  if (!Flag) return null
  return <Flag className="inline-block h-3.5 w-5 shrink-0 rounded-sm" />
}

function PickCell({ category, value }: { category: string; value: string | undefined }) {
  if (!value) return <span className="text-gray-300 dark:text-neutral-700">—</span>
  if (PLAYER_CATEGORIES.has(category)) {
    return <span className="text-gray-700 dark:text-neutral-300">{value}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamFlag team={value} />
      <span className="text-gray-700 dark:text-neutral-300">{value}</span>
    </span>
  )
}

const editCls =
  "rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"

export function UserTournamentPicksAdmin({ users, teams }: { users: UserRow[]; teams: string[] }) {
  const [rows, setRows] = useState(users)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [errorId, setErrorId] = useState<string | null>(null)

  function startEdit(user: UserRow) {
    setEditingId(user.id)
    setErrorId(null)
    const d: Record<string, string> = {}
    for (const cat of CATEGORIES) d[cat.key] = user.picks[cat.key] ?? ""
    setDraft(d)
  }

  async function saveEdit(userId: string) {
    setSaving(true)
    setErrorId(null)
    try {
      await adminSaveUserPicks(userId, draft)
      setRows((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                picks: Object.fromEntries(
                  Object.entries(draft).filter(([, v]) => v.trim() !== ""),
                ),
              }
            : u,
        ),
      )
      setEditingId(null)
    } catch {
      setErrorId(userId)
    } finally {
      setSaving(false)
    }
  }

  // Options for a team select: the configured list, plus the current value if
  // it's something else (e.g. "N/A") so it doesn't get silently dropped
  function teamOptions(cat: (typeof CATEGORIES)[number], current: string): string[] {
    const base = cat.teams === "top10" ? TOP10 : teams
    return current && !base.includes(current) ? [current, ...base] : [...base]
  }

  const filled = rows.filter((u) => Object.keys(u.picks).length > 0)
  const empty = rows.filter((u) => Object.keys(u.picks).length === 0)
  const ordered = [...filled, ...empty]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5">
            <th className="sticky left-0 z-10 bg-white py-2 pr-4 text-left font-semibold text-gray-900 dark:bg-neutral-900 dark:text-white">
              Usuario
            </th>
            {CATEGORIES.map((cat) => (
              <th
                key={cat.key}
                className="px-3 py-2 text-center font-medium text-gray-500 dark:text-neutral-400"
                title={cat.label}
              >
                <span className="block text-base leading-none">{cat.icon}</span>
                <span className="block text-xs">{cat.label}</span>
              </th>
            ))}
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {ordered.map((user) => {
            const editing = editingId === user.id
            const hasPicks = Object.keys(user.picks).length > 0

            return (
              <tr
                key={user.id}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-white/[0.02]",
                  editing && "bg-blue-50/40 hover:bg-blue-50/40 dark:bg-blue-500/5 dark:hover:bg-blue-500/5",
                )}
              >
                <td className="sticky left-0 z-10 bg-white py-2.5 pr-4 dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-neutral-700" />
                    )}
                    <span className="whitespace-nowrap font-medium text-gray-800 dark:text-neutral-100">
                      {user.name ?? "Sin nombre"}
                    </span>
                    {!hasPicks && !editing && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        sin picks
                      </span>
                    )}
                  </div>
                </td>

                {CATEGORIES.map((cat) => (
                  <td key={cat.key} className="whitespace-nowrap px-3 py-2.5 text-center text-xs">
                    {editing ? (
                      cat.type === "player" ? (
                        <input
                          type="text"
                          value={draft[cat.key]}
                          onChange={(e) => setDraft((d) => ({ ...d, [cat.key]: e.target.value }))}
                          placeholder="—"
                          className={cn(editCls, "w-24")}
                        />
                      ) : (
                        <select
                          value={draft[cat.key]}
                          onChange={(e) => setDraft((d) => ({ ...d, [cat.key]: e.target.value }))}
                          className={cn(editCls, "w-32")}
                        >
                          <option value="">—</option>
                          {teamOptions(cat, draft[cat.key]).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <PickCell category={cat.key} value={user.picks[cat.key]} />
                    )}
                  </td>
                ))}

                <td className="whitespace-nowrap px-2 py-2.5 text-right">
                  {editing ? (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => saveEdit(user.id)}
                        disabled={saving}
                        title="Guardar"
                        className="flex h-6 w-7 items-center justify-center rounded bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200 disabled:opacity-40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                      >
                        {saving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        title="Cancelar"
                        className="flex h-6 w-7 items-center justify-center rounded bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      title="Editar picks"
                      className="flex h-6 w-7 items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-600 dark:hover:bg-white/5 dark:hover:text-neutral-300"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {errorId === user.id && (
                    <p className="mt-1 text-[10px] text-red-500">Error al guardar</p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
