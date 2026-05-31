import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NavBar } from "@/components/NavBar"
import { getWCEmblem } from "@/lib/competition"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "El prode del Mundial FIFA 2026 con tus amigos",
}

const themeScript = `
(function() {
  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const emblem = await getWCEmblem()

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        <NavBar emblemUrl={emblem} />
        <main className="container mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
