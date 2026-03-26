import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email) return false;

      // Check if this Google account is already linked
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      });

      if (existingAccount) return true;

      // Find or create user
      let dbUser = await prisma.user.findUnique({ where: { email } });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name ?? null,
            emailVerified: new Date(),
          },
        });
      } else if (!dbUser.emailVerified) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { emailVerified: new Date() },
        });
      }

      await prisma.account.create({
        data: {
          userId: dbUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token as string | undefined,
          refresh_token: account.refresh_token as string | undefined,
          expires_at: account.expires_at as number | undefined,
          token_type: account.token_type as string | undefined,
          scope: account.scope as string | undefined,
          id_token: account.id_token as string | undefined,
        },
      });

      return true;
    },

    async jwt({ token, account }) {
      // On Google sign-in, resolve our internal user ID from email
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) token.sub = dbUser.id;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
