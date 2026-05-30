import Link from "next/link"
import { auth, signIn, signOut } from "@/lib/auth"
import Image from "next/image"

export async function NavBar() {
  const session = await auth()
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL

  return (
    <header className="bg-[#1a3a6b] text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">⚽</span>
            <span className="hidden sm:inline">Prode Mundial 2026</span>
            <span className="sm:hidden">Prode</span>
          </Link>
          <Link href="/" className="text-sm hover:text-yellow-300 transition-colors">
            Tabla
          </Link>
          <Link href="/fixtures" className="text-sm hover:text-yellow-300 transition-colors">
            Partidos
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm hover:text-yellow-300 transition-colors">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-gray-200">{session.user.name}</span>
              </div>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="rounded bg-red-600 px-3 py-1 text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server"
                await signIn("google")
              }}
            >
              <button
                type="submit"
                className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Ingresar con Google
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}
