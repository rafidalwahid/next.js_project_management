import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Temporarily comment out lastLogin update
        // try {
        //   // Update the lastLogin timestamp
        //   await prisma.user.update({
        //     where: { id: user.id },
        //     data: { lastLogin: new Date() }
        //   });
        // } catch (error) {
        //   console.error("Error updating lastLogin:", error);
        //   // Continue with authentication even if lastLogin update fails
        // }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Only update user data and lastLogin when the user first logs in
      if (user && account) {
        token.id = user.id;
        token.role = user.role;
        
        // Temporarily comment out lastLogin update
        // try {
        //   // Update lastLogin timestamp only on initial sign-in
        //   await prisma.user.update({
        //     where: { id: user.id },
        //     data: { lastLogin: new Date() }
        //   });
        // } catch (error) {
        //   console.error("Error updating lastLogin in JWT callback:", error);
        //   // Continue with JWT processing even if lastLogin update fails
        // }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
