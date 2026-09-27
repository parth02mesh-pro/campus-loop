'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  MessageCircle, Send, User, Package, ArrowLeft, Loader2, Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');
  const targetProductId = searchParams.get('product');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        const convos = data.data || [];
        setConversations(convos);

        if (convos.length > 0 && !activeConvoId && !targetUserId) {
          setActiveConvoId(convos[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convoId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convoId}`);
      if (res.ok) {
        const data = await res.json();
        setMessagesList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId);
      const interval = setInterval(() => loadMessages(activeConvoId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvoId]);

  useEffect(() => {
    scrollToBottom(false);
    const t = setTimeout(() => scrollToBottom(false), 60);
    return () => clearTimeout(t);
  }, [messagesList, activeConvoId]);

  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Handle initial direct message from product page
  useEffect(() => {
    if (targetUserId && user && conversations.length > 0) {
      const existing = conversations.find(
        (c) => c.otherUser?.id === targetUserId
      );
      if (existing) {
        setActiveConvoId(existing.id);
        setMobileShowChat(true);
      } else {
        setMobileShowChat(true);
      }
    }
  }, [targetUserId, conversations, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const payload: any = { content: newMessage.trim() };
      if (activeConvoId) {
        payload.conversationId = activeConvoId;
      } else if (targetUserId) {
        payload.recipientId = targetUserId;
        if (targetProductId) payload.productId = targetProductId;
      } else {
        return;
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setNewMessage('');
      if (!activeConvoId && data.data?.conversationId) {
        setActiveConvoId(data.data.conversationId);
      }
      await loadConversations();
      if (activeConvoId || data.data?.conversationId) {
        await loadMessages(activeConvoId || data.data.conversationId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-neutral-500">Loading messages...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-2xl font-bold mb-2">Campus Messages</h1>
        <p className="text-neutral-600 mb-6">Log in to chat with student buyers and sellers directly</p>
        <button onClick={() => router.push('/login')} className="btn btn-primary btn-md">
          Login to Continue
        </button>
      </div>
    );
  }

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Direct campus buyer & seller chats</p>
        </div>
      </div>

      <div className="card grid md:grid-cols-[320px_1fr] h-[calc(100vh-13rem)] min-h-[480px] max-h-[750px] overflow-hidden border border-neutral-200">
        {/* Left: Conversation List */}
        <div className={`border-r border-neutral-100 flex-col h-full bg-neutral-50/50 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-neutral-200 bg-white font-medium text-sm text-neutral-600">
            All Conversations ({conversations.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {conversations.length === 0 && !targetUserId ? (
              <div className="p-8 text-center text-neutral-400 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No conversations yet. Message sellers from any product listing!
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeConvoId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConvoId(c.id);
                      setMobileShowChat(true);
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-brand-50/80 border-l-4 border-brand-600' : 'hover:bg-neutral-100/70 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-electric-500 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-sm">
                      {c.otherUser?.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm text-neutral-900 truncate">
                          {c.otherUser?.fullName || 'User'}
                        </span>
                        {c.lastMessageAt && (
                          <span className="text-[11px] text-neutral-400">
                            {formatDate(c.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {c.lastMessage?.content || 'Started a conversation'}
                      </p>
                      {c.product && (
                        <div className="flex items-center gap-1 text-[11px] text-brand-600 mt-1 truncate">
                          <Package className="w-3 h-3 shrink-0" />
                          <span>{c.product.title}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className={`flex-col h-full bg-white ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeConvo || targetUserId ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-3.5 border-b border-neutral-100 flex items-center justify-between bg-white shadow-xs">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand-500 to-electric-500 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0">
                    {activeConvo?.otherUser?.fullName?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      {activeConvo?.otherUser?.fullName || 'Seller'}
                    </div>
                    <div className="text-xs text-fresh-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-fresh-500" /> Online student
                    </div>
                  </div>
                </div>

                {activeConvo?.product && (
                  <Link
                    href={`/products/${activeConvo.product.id}`}
                    className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-brand-600" />
                    <span className="max-w-[140px] truncate">{activeConvo.product.title}</span>
                  </Link>
                )}
              </div>

              {/* Messages Body */}
              <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/40">
                {messagesList.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-sm">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-brand-400" />
                    Say hello to start the conversation! Arrange a pickup spot on campus.
                  </div>
                ) : (
                  messagesList.map((m) => {
                    const isMe = m.senderId === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-xs'
                              : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isMe ? 'text-white/70' : 'text-neutral-400'
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message... (e.g. Is this still available?)"
                  className="flex-1 input text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="btn btn-primary btn-md px-4 shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 text-center">
              <MessageCircle className="w-12 h-12 text-neutral-300 mb-3" />
              <h3 className="font-semibold text-neutral-700 mb-1">Select a conversation</h3>
              <p className="text-sm text-neutral-500 max-w-xs">
                Pick a chat from the left or contact any seller from a product listing to coordinate deals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-neutral-500">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
