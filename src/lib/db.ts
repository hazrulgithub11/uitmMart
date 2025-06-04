import { PrismaClient } from '@prisma/client'

// Create a new PrismaClient instance
const prisma = new PrismaClient()

// If we're not in production, add the PrismaClient to the global scope
// This is to prevent exhausting your database connection limit due to
// creating a new instance in each API call during development
declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined
}

// Use the global prisma instance or create a new one
const db = globalThis.globalPrisma || prisma

// In development, set the globalPrisma to the db instance
if (process.env.NODE_ENV !== 'production') {
  globalThis.globalPrisma = db
}

// Export the db instance
export { db } 