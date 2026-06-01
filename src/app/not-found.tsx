import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="relative -mx-4 -my-8 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden text-center">
      {/* Background image — priority prevents lazy loading */}
      <Image
        src="/404-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover object-top"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <div className="flex items-center leading-none">
          <span className="text-[10rem] font-black tracking-tighter text-white opacity-40 drop-shadow-2xl sm:text-[14rem]">
            4
          </span>
          <span className="text-[10rem] font-black tracking-tighter text-white opacity-40 drop-shadow-2xl sm:text-[14rem]">
            0
          </span>
          <span className="text-[10rem] font-black tracking-tighter text-white opacity-40 drop-shadow-2xl sm:text-[14rem]">
            4
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-white sm:text-2xl">
            Esta página no existe.
          </p>
          <p className="text-sm text-white/60">
            Parece que el árbitro la expulsó del servidor.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
