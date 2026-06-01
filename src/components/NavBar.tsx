import Link from "next/link"
import { auth, signIn, signOut } from "@/lib/auth"
import Image from "next/image"
import { ThemeToggle } from "./ThemeToggle"
import { MobileMenu } from "./MobileMenu"

export async function NavBar({ emblemUrl }: { emblemUrl?: string }) {
  const session = await auth()
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL

  const authForm = session?.user ? (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
    >
      <button
        type="submit"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        Cerrar sesión
      </button>
    </form>
  ) : (
    <form
      action={async () => {
        "use server"
        await signIn("google", { redirectTo: "/profile" })
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
        </svg>
        Ingresar con Google
      </button>
    </form>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          {emblemUrl
            ? <Image src={emblemUrl} alt="Mundial 2026" width={32} height={32} className="drop-shadow-sm" />
            : <span className="text-2xl">⚽</span>
          }
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
              Prode 2026
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500 sm:block">
              Mundial FIFA
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            Tabla
          </Link>
          <Link href="/predicciones" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            Predicciones
          </Link>
          <Link href="/estadisticas" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            Estadísticas
          </Link>
          <Link href="/reglas" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            Reglas
          </Link>
          {session && (
            <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
              Perfil
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop user + auth */}
          {session?.user ? (
            <>
              <div className="hidden items-center gap-2.5 md:flex">
                <div className="h-4 w-px bg-gray-200 dark:bg-neutral-700" />
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={30}
                    height={30}
                    className="rounded-full ring-2 ring-gray-200 dark:ring-neutral-700"
                  />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                  {session.user.name}
                </span>
              </div>
              <form
                className="hidden md:block"
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <form
              className="hidden md:block"
              action={async () => {
                "use server"
                await signIn("google", { redirectTo: "/profile" })
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Ingresar con Google
              </button>
            </form>
          )}

          {/* Mobile hamburger */}
          <MobileMenu
            isAdmin={isAdmin}
            isLoggedIn={!!session?.user}
            userName={session?.user?.name}
            userImage={session?.user?.image}
            authForm={authForm}
          />
        </div>
      </div>
    </header>
  )
}
