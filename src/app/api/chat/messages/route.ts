import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get messages for a specific chat
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = searchParams.get('limit') || '50';
    const before = searchParams.get('before');
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }
    
    // Get the chat to verify user has access
    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) },
      include: { buyer: true, seller: true },
    });
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    // Check if the user is either the buyer or seller in this chat
    const userId = parseInt(String(session.user.id));
    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to this chat' }, { status: 403 });
    }
    
    // Query messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: parseInt(chatId),
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });
    
    // Mark messages as read if the user is the recipient
    await prisma.chatMessage.updateMany({
      where: {
        chatId: parseInt(chatId),
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });
    
    // Add isMine flag to each message
    const formattedMessages = messages.map(message => ({
      ...message,
      isMine: message.senderId === userId,
    }));
    
    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Create a new message (backup for when socket is not available)
export async function POST(request: Request) {
  try {
    console.log('[API DEBUG] POST /api/chat/messages - Starting to process request');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('[API DEBUG] Unauthorized request - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { chatId, content, clientId } = body;
    
    console.log('[API DEBUG] Message request data:', { 
      chatId, 
      contentLength: content?.length,
      clientId: clientId || 'not provided'
    });
    
    if (!chatId || !content) {
      console.log('[API DEBUG] Missing required fields');
      return NextResponse.json({ error: 'Chat ID and content are required' }, { status: 400 });
    }
    
    // Get the chat to verify user has access
    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) },
    });
    
    if (!chat) {
      console.log('[API DEBUG] Chat not found:', chatId);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    // Check if the user is either the buyer or seller in this chat
    const userId = parseInt(String(session.user.id));
    if (chat.buyerId !== userId && chat.sellerId !== userId) {
      console.log('[API DEBUG] Unauthorized access to chat:', { chatId, userId });
      return NextResponse.json({ error: 'Unauthorized access to this chat' }, { status: 403 });
    }
    
    console.log('[API DEBUG] Creating message in database');
    
    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        chatId: parseInt(chatId),
        senderId: userId,
        read: false,
        // Store clientId in metadata if provided
        ...(clientId ? { metadata: { clientId } } : {})
      },
    });
    
    console.log('[API DEBUG] Message created with ID:', message.id);
    
    // Update the lastMessageAt timestamp in the chat
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: { lastMessageAt: new Date() },
    });
    
    console.log('[API DEBUG] Returning message to client');
    
    // Return the message with clientId if it was provided
    return NextResponse.json({
      ...message,
      isMine: true,
      ...(clientId ? { clientId } : {})
    });
  } catch (error) {
    console.error('[API DEBUG] Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
} 