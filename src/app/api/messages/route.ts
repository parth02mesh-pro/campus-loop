import { NextRequest } from 'next/server';
import { db } from '@/db';
import { conversations, messages, users, userProfiles, products } from '@/db/schema';
import { eq, or, and, desc, asc } from 'drizzle-orm';
import { successResponse, errorResponse, withAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const conversationId = searchParams.get('conversationId');

      if (conversationId) {
        // Fetch messages for a specific conversation
        const msgs = await db
          .select({
            id: messages.id,
            conversationId: messages.conversationId,
            senderId: messages.senderId,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            senderProfile: userProfiles,
          })
          .from(messages)
          .leftJoin(userProfiles, eq(messages.senderId, userProfiles.userId))
          .where(eq(messages.conversationId, conversationId))
          .orderBy(asc(messages.createdAt));

        return successResponse(msgs);
      }

      const productId = searchParams.get('productId');
      if (productId) {
        const productConvos = await db
          .select({
            id: conversations.id,
            user1Id: conversations.user1Id,
            user2Id: conversations.user2Id,
            productId: conversations.productId,
            lastMessageAt: conversations.lastMessageAt,
          })
          .from(conversations)
          .where(
            and(
              eq(conversations.productId, productId),
              or(
                eq(conversations.user1Id, user.userId),
                eq(conversations.user2Id, user.userId)
              )
            )
          )
          .orderBy(desc(conversations.lastMessageAt));

        const enriched = await Promise.all(
          productConvos.map(async (c) => {
            const otherUserId = c.user1Id === user.userId ? c.user2Id : c.user1Id;
            const [otherProfile] = await db
              .select()
              .from(userProfiles)
              .where(eq(userProfiles.userId, otherUserId))
              .limit(1);

            const msgs = await db
              .select({
                id: messages.id,
                conversationId: messages.conversationId,
                senderId: messages.senderId,
                content: messages.content,
                createdAt: messages.createdAt,
              })
              .from(messages)
              .where(eq(messages.conversationId, c.id))
              .orderBy(asc(messages.createdAt));

            return {
              ...c,
              otherUser: {
                id: otherUserId,
                fullName: otherProfile?.fullName || 'Student',
                avatarUrl: otherProfile?.avatarUrl,
              },
              messages: msgs,
            };
          })
        );

        return successResponse(enriched);
      }

      // Fetch all conversations for current user
      const convos = await db
        .select({
          id: conversations.id,
          user1Id: conversations.user1Id,
          user2Id: conversations.user2Id,
          productId: conversations.productId,
          lastMessageAt: conversations.lastMessageAt,
          product: products,
        })
        .from(conversations)
        .leftJoin(products, eq(conversations.productId, products.id))
        .where(
          or(
            eq(conversations.user1Id, user.userId),
            eq(conversations.user2Id, user.userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));

      // Enrich with other user's profile and last message
      const enriched = await Promise.all(
        convos.map(async (c) => {
          const otherUserId = c.user1Id === user.userId ? c.user2Id : c.user1Id;
          const [otherProfile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, otherUserId))
            .limit(1);

          const [lastMsg] = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, c.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);

          return {
            ...c,
            otherUser: {
              id: otherUserId,
              fullName: otherProfile?.fullName || 'Campus Student',
              avatarUrl: otherProfile?.avatarUrl,
            },
            lastMessage: lastMsg || null,
          };
        })
      );

      return successResponse(enriched);
    } catch (error: any) {
      console.error('Messages GET error:', error);
      return errorResponse('Failed to fetch messages', 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { conversationId, recipientId, productId, content } = body;

      if (!content || !content.trim()) {
        return errorResponse('Message content cannot be empty', 400);
      }

      let activeConvoId = conversationId;

      if (!activeConvoId && recipientId) {
        if (recipientId === user.userId) {
          return errorResponse('Cannot start conversation with yourself', 400);
        }

        // Check if conversation already exists between these 2 users
        const [existing] = await db
          .select()
          .from(conversations)
          .where(
            or(
              and(eq(conversations.user1Id, user.userId), eq(conversations.user2Id, recipientId)),
              and(eq(conversations.user1Id, recipientId), eq(conversations.user2Id, user.userId))
            )
          )
          .limit(1);

        if (existing) {
          activeConvoId = existing.id;
        } else {
          const [created] = await db
            .insert(conversations)
            .values({
              user1Id: user.userId,
              user2Id: recipientId,
              productId: productId || null,
            })
            .returning();
          activeConvoId = created.id;
        }
      }

      if (!activeConvoId) {
        return errorResponse('Missing conversation or recipient', 400);
      }

      const [newMsg] = await db
        .insert(messages)
        .values({
          conversationId: activeConvoId,
          senderId: user.userId,
          content: content.trim(),
        })
        .returning();

      // Update conversation timestamp
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, activeConvoId));

      return successResponse({ message: newMsg, conversationId: activeConvoId }, 201);
    } catch (error: any) {
      console.error('Messages POST error:', error);
      return errorResponse('Failed to send message', 500);
    }
  });
}
