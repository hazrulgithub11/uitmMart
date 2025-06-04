import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";

// Define the shape of user data to be included in the session
export interface UserSession {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

// Extend the built-in NextAuth types to include our custom fields
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    profileImage?: string;
    username?: string;
  }
  
  interface Session {
    user: {
      id?: number;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
      phoneNumber?: string;
      gender?: string;
      dateOfBirth?: string;
      profileImage?: string;
      username?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    profileImage?: string;
    username?: string;
  }
}

// Use hardcoded secret since environment variables aren't loading
const AUTH_SECRET = "4561c2e49d88e1f4cf06e0ad77892f8b39f8b87f6b8fb1e8a2e0e94f3698a123";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  debug: true, // Enable debug mode to see more detailed errors
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing credentials: email or password not provided");
          throw new Error("Email and password are required");
        }

        try {
          // Check if the user exists
          console.log("Attempting to find user with email:", credentials.email);
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            console.log("No user found with email:", credentials.email);
            throw new Error("No user found with this email");
          }

          console.log("Found user:", user.id, user.email);
          
          // Verify password using bcrypt
          console.log("Comparing password...");
          let isPasswordValid = false;
          
          try {
            console.log("Using bcrypt to compare password");
            isPasswordValid = await compare(credentials.password, user.password);
            console.log("Bcrypt comparison result:", isPasswordValid);
          } catch (bcryptError) {
            console.error("Bcrypt comparison error:", bcryptError);
            
            // As a last resort, try direct string comparison if the password wasn't hashed
            console.log("Attempting direct string comparison as fallback");
            if (user.password === credentials.password) {
              console.log("Direct string comparison succeeded");
              isPasswordValid = true;
            } else {
              console.log("Direct string comparison also failed");
            }
          }
          
          console.log("Final password validation result:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Invalid password for user:", user.email);
            throw new Error("Invalid password");
          }

          console.log("Authentication successful for user:", user.email);
          
          // Return user data for the session
          return {
            id: user.id.toString(),
            name: user.fullName,
            email: user.email,
            role: user.role,
            username: user.username || undefined,
            phoneNumber: user.phoneNumber || undefined,
            gender: user.gender || undefined,
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : undefined,
            profileImage: user.profileImage || undefined,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      console.log("JWT callback called with user:", user ? `ID: ${user.id}` : "No user data");
      
      if (user) {
        // Add all user properties to the token
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.phoneNumber = user.phoneNumber;
        token.gender = user.gender;
        token.dateOfBirth = user.dateOfBirth;
        token.profileImage = user.profileImage;
        
        console.log("JWT token updated with user data");
      }
      return token;
    },
    session: async ({ session, token }) => {
      console.log("Session callback called with token:", token ? `ID: ${token.id}` : "No token data");
      
      if (token) {
        // Add all token properties to the session user
        session.user.id = Number(token.id);
        session.user.role = token.role;
        session.user.username = token.username as string | undefined;
        session.user.phoneNumber = token.phoneNumber as string | undefined;
        session.user.gender = token.gender as string | undefined;
        session.user.dateOfBirth = token.dateOfBirth as string | undefined;
        session.user.profileImage = token.profileImage as string | undefined;
        
        console.log("Session updated with token data");
      }
      return session;
    }
  },
  secret: AUTH_SECRET
};

// Helper to check if user is authenticated and has seller role
export const isSeller = async () => {
  try {
    const session = await getServerSession(authOptions);
    return !!session?.user && session.user.role === 'seller';
  } catch  {
    return false;
  }
};

// Helper to check if user is authenticated and has admin role
export const isAdmin = async () => {
  try {
    const session = await getServerSession(authOptions);
    return !!session?.user && session.user.role === 'admin';
  } catch{
    return false;
  }
}; 