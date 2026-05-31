import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl

  if (isAuthenticated || pathname === "/" || pathname.startsWith("/api/")) {
    return
  }

  const url = req.nextUrl.clone()
  url.pathname = "/"
  return Response.redirect(url)
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
}
