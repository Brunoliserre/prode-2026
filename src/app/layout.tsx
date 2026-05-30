import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NavBar } from "@/components/NavBar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "El prode del Mundial FIFA 2026 con tus amigos",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <NavBar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">{children}</main>
      </body>
    </html>
  )
}
