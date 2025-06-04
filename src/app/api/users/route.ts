import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET handler to fetch all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        createdAt: true,
        // Don't include password in response
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST handler to register a new user
export async function POST(request: Request) {
  try {
    const { fullName, email, username, password, role = 'buyer' } = await request.json()
    
    // Check if user with email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 400 }
      )
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        role
      },
    })
    
    // Don't return the password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser
    
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 