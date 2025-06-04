import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// This is required for the NextAuth API to work
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 