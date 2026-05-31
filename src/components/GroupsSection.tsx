"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function GroupsSection({ children, count, emblemUrl }: { children: React.ReactNode; count: number; emblemUrl?: string }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-neutral-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2.5">
          {emblemUrl
            ? <Image src={emblemUrl} alt="Mundial 2026" width={22} height={22} />
            : <span className="text-lg">⚽</span>}
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">Fase de Grupos</p>
            <p className="text-xs text-gray-400 dark:text-neutral-500">{count} grupos</p>
          </div>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-gray-300 transition-transform duration-200 dark:text-neutral-600",
            !open && "rotate-180",
          )}
        />
      </button>

      {open && <div className="border-t border-gray-200 p-3 space-y-3 dark:border-white/5">{children}</div>}
    </div>
  )
}
