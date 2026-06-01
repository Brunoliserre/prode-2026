"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import Image from "next/image"

interface Props {
  isAdmin: boolean
  isLoggedIn: boolean
  userName?: string | null
  userImage?: string | null
  authForm: React.ReactNode
}

const LINKS = [
  { href: "/",             label: "Tabla" },
  { href: "/predicciones", label: "Predicciones" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/reglas",       label: "Reglas" },
]

export function MobileMenu({ isAdmin, isLoggedIn, userName, userImage, authForm }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="relative md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        aria-label="Menú"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[69px] z-40 bg-black/20 dark:bg-black/40"
            onClick={close}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/5 dark:bg-neutral-900">
            {/* User info */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/5">
                {userImage && (
                  <Image
                    src={userImage}
                    alt={userName ?? ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">
                  {userName}
                </span>
              </div>
            )}

            {/* Nav links */}
            <nav className="p-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="flex rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {l.label}
                </Link>
              ))}
              {isLoggedIn && (
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Perfil
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={close}
                  className="flex rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Auth form */}
            <div className="border-t border-gray-100 p-3 dark:border-white/5">
              {authForm}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
