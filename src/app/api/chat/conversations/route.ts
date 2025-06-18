import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user ID exists and convert it to a number safely
    const userId = session.user.id ? parseInt(session.user.id.toString()) : 0;
    if (userId === 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    const userRole = session.user.role;
    
    // Query conversations based on user role
    const chats = await prisma.chat.findMany({
      where: userRole === 'seller' 
        ? { sellerId: userId } 
        : { buyerId: userId },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    
    // Count unread messages for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            read: false,
          },
        });
        
        return {
          ...chat,
          unreadCount,
        };
      })
    );
    
    return NextResponse.json(chatsWithUnreadCount);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// Create a new conversation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user ID exists and convert it to a number safely
    const userId = session.user.id ? parseInt(session.user.id.toString()) : 0;
    if (userId === 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    const userRole = session.user.role;
    
    const body = await request.json();
    const { shopId } = body;
    
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }
    
    // Convert shopId to number safely
    const shopIdNum = parseInt(shopId.toString());
    
    // Only buyers can initiate chats
    if (userRole !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can initiate chats' }, { status: 403 });
    }
    
    // Get the shop and seller information
    const shop = await prisma.shop.findUnique({
      where: { id: shopIdNum },
      include: { seller: true },
    });
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    // Check if chat already exists between this buyer and shop
    let chat = await prisma.chat.findFirst({
      where: {
        buyerId: userId,
        shopId: shopIdNum,
      },
    });
    
    // If chat doesn't exist, create it
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          buyerId: userId,
          sellerId: shop.sellerId,
          shopId: shopIdNum,
        },
      });
    }
    
    // Return the chat with related entities
    const chatWithDetails = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });
    
    return NextResponse.json(chatWithDetails);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 