import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { prompt: "select_account" } },
  })],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google" || !account.providerAccountId) return false;
      if (profile?.email_verified !== true || !user.email) return false;

      // The verified Google subject, not the editable email, identifies the account.
      const googleSub = account.providerAccountId;
      const existing = await prisma.user.findUnique({ where: { googleSub } });
      if (existing) {
        if (existing.email !== user.email) {
          const other = await prisma.user.findUnique({ where: { email: user.email } });
          if (other && other.id !== existing.id) return false;
          await prisma.user.update({
            where: { id: existing.id },
            data: { email: user.email, displayName: user.name },
          });
        }
        return true;
      }
      // An email collision with a different Google subject must not take over a user.
      if (await prisma.user.findUnique({ where: { email: user.email } })) return false;
      const isInitialAdmin = user.email.toLowerCase() ===
        process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
      await prisma.user.create({
        data: {
          googleSub,
          email: user.email,
          displayName: user.name,
          role: isInitialAdmin ? "ADMIN" : "PENDING",
        },
      });
      return true;
    },
  },
  pages: { signIn: "/login" },
});
