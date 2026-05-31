"use client"

import { useRef, useState, useTransition } from "react"
import { updateProfile } from "@/lib/actions"

interface Props {
  initialName: string
  initialImage: string | null
}

const MAX_SIZE = 256 // px — lado máximo antes de guardar

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // Crop centrado a cuadrado, luego escalar a MAX_SIZE
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      const canvas = document.createElement("canvas")
      canvas.width = MAX_SIZE
      canvas.height = MAX_SIZE
      canvas.getContext("2d")!.drawImage(img, sx, sy, side, side, 0, 0, MAX_SIZE, MAX_SIZE)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

export function ProfileForm({ initialName, initialImage }: Props) {
  const [name, setName] = useState(initialName)
  const [image, setImage] = useState(initialImage ?? "")
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await resizeToBase64(file)
      setImage(base64)
      setStatus("idle")
    } catch {
      setStatus("error")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("idle")
    const formData = new FormData()
    formData.set("name", name)
    formData.set("image", image)
    startTransition(async () => {
      try {
        await updateProfile(formData)
        setStatus("ok")
      } catch {
        setStatus("error")
      }
    })
  }

  const preview = image || initialImage

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400 dark:text-neutral-500">
                {name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white shadow transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            title="Cambiar imagen"
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">Imagen de perfil</p>
          
          <p className="text-[11px] text-gray-400 dark:text-neutral-600">
            Se redimensiona automáticamente a 256 px
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-neutral-400">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setStatus("idle") }}
          required
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        {status === "ok" && <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Guardado</span>}
        {status === "error" && <span className="text-sm text-red-500">Error al guardar</span>}
      </div>
    </form>
  )
}
