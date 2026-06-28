import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Los avatares se guardan como data URL base64 en la DB. Si esa imagen entra
    // al JWT (token.picture), el cookie crece tanto que rompe con HTTP 431.
    // La quitamos del token; la imagen se resuelve desde la DB en `session`.
    async jwt({ token }) {
      delete token.picture
      return token
    },
    async session({ session, token }) {
      if (!token.sub) return session
      session.user.id = token.sub
      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { name: true, image: true },
      })
      if (user) {
        session.user.name = user.name
        session.user.image = user.image
      }
      return session
    },
  },
})
