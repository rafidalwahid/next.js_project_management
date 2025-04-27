import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { googleProvider, facebookProvider } from "@/providers";

export const authOptions: NextAuthOptions = {
  providers: [
    googleProvider,
    facebookProvider,
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

        // Update lastLogin timestamp
        try {
          // Update the lastLogin timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });
        } catch (error) {
          console.error("Error updating lastLogin:", error);
          // Continue with authentication even if lastLogin update fails
        }

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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email as string }
          });

          if (!existingUser) {
            // Create new user if they don't exist
            await prisma.user.create({
              data: {
                email: user.email as string,
                name: user.name,
                image: user.image,
                role: "user", // Default role
                lastLogin: new Date()
              }
            });
          } else {
            // Update existing user's last login
            await prisma.user.update({
              where: { email: user.email as string },
              data: { lastLogin: new Date() }
            });
          }
        } catch (error) {
          console.error("Error during social login:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Only update user data and lastLogin when the user first logs in
      if (user && account) {
        token.id = user.id;
        token.role = user.role || "user"; // Default to user role for social logins

        // Update lastLogin for credential logins
        if (account.provider === "credentials") {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            });
          } catch (error) {
            console.error("Error updating lastLogin in JWT callback:", error);
          }
        }
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
