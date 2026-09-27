'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Heart, MessageCircle, Share2, Star, MapPin, CheckCircle2, Shield,
  AlertCircle, XCircle, Send, Loader2, Sparkles, User, Check, RefreshCw
} from 'lucide-react';
import { formatPrice, getConditionBadge, formatDate } from '@/lib/utils';

interface Props {
  product: any;
  images: any[];
  seller: any;
  campus: any;
  category: any;
  subcategory: any;
}

export function ProductDetailClient({ product, images, seller, campus, category, subcategory }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const condBadge = getConditionBadge(product.condition);

  // Availability & Status state
  const isSeller = user?.id === product.sellerId || (seller?.id && user?.id === seller.id);
  const [isAvailable, setIsAvailable] = useState<boolean>(
    product.isAvailable !== false && product.status !== 'sold' && product.status !== 'archived' && product.status !== 'rejected'
  );
  const [status, setStatus] = useState<string>(product.status || 'active');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Messages state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Fetch product conversations
  const loadProductMessages = async () => {
    if (!user) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/messages?productId=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        const convos = data.data || [];
        setConversations(convos);
        if (convos.length > 0 && !selectedConvoId) {
          setSelectedConvoId(convos[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load product messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadProductMessages();
  }, [user, product.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversations, selectedConvoId]);

  const handleUpdateAvailability = async (newAvailable: boolean, newStatus?: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAvailable: newAvailable,
          status: newStatus || (newAvailable ? 'active' : 'sold'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');
      setIsAvailable(newAvailable);
      setStatus(newStatus || (newAvailable ? 'active' : 'sold'));
      toast.success(newAvailable ? '✅ Listing marked as Available!' : '🚫 Listing marked as Not Available / Sold!');
    } catch (err: any) {
      toast.error(err.message || 'Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.data?.wishlisted ?? !wishlisted);
        toast.success(data.data?.message || (data.data?.wishlisted ? 'Saved to wishlist!' : 'Removed from wishlist'));
      } else {
        toast.error('Please log in to save items to your wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out ${product.title} on Campus Loop!`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const scrollToChat = () => {
    const el = document.getElementById('product-messages-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/messages?user=${seller?.id || ''}&product=${product.id}`);
    }
  };

  const handleSendInlineMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const content = (customContent || messageText).trim();
    if (!content || sendingMsg) return;

    if (!user) {
      toast.error('Please log in to send a message');
      router.push('/login');
      return;
    }

    setSendingMsg(true);
    try {
      const payload: any = {
        content,
        productId: product.id,
      };

      if (isSeller) {
        if (!selectedConvoId) throw new Error('Select a student conversation to reply');
        payload.conversationId = selectedConvoId;
      } else {
        if (selectedConvoId) {
          payload.conversationId = selectedConvoId;
        } else {
          payload.recipientId = seller?.id;
        }
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setMessageText('');
      toast.success('Message sent!');
      await loadProductMessages();
    } catch (err: any) {
      toast.error(err.message || 'Could not send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === selectedConvoId) || conversations[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Seller Management Notification Bar */}
      {isSeller && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              👑
            </div>
            <div>
              <div className="font-bold text-sm text-purple-900 flex items-center gap-2">
                Your Listing
                <span className={`badge text-xs ${isAvailable ? 'bg-fresh-100 text-fresh-700' : 'bg-red-100 text-red-700'}`}>
                  {isAvailable ? '● Available' : '✕ Not Available / Sold'}
                </span>
              </div>
              <p className="text-xs text-purple-700">
                {isAvailable
                  ? 'Active and visible to all campus buyers. You can mark it as sold anytime.'
                  : 'Currently marked as unavailable/sold out. Campus buyers cannot purchase this.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAvailable ? (
              <button
                onClick={() => handleUpdateAvailability(false, 'sold')}
                disabled={updatingStatus}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Mark as Not Available / Sold
              </button>
            ) : (
              <button
                onClick={() => handleUpdateAvailability(true, 'active')}
                disabled={updatingStatus}
                className="btn btn-sm bg-fresh-600 hover:bg-fresh-700 text-white gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Re-list as Available
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: Images */}
        <div>
          <div className="card overflow-hidden mb-4 relative">
            <div className="aspect-square bg-neutral-100 relative">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-brand-100 to-electric-50">
                  📦
                </div>
              )}

              {/* Status Badge Overlay if not available */}
              {!isAvailable && (
                <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
                  <span className="text-4xl mb-2">🚫</span>
                  <span className="text-lg font-black tracking-wider uppercase bg-red-600 px-4 py-1.5 rounded-full shadow-lg">
                    Not Available / Sold
                  </span>
                  <span className="text-xs text-white/80 mt-2">This listing has been closed by the seller</span>
                </div>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImage ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="card p-6 mt-6">
            <h2 className="font-semibold text-lg mb-3">Description</h2>
            <p className="text-neutral-700 whitespace-pre-wrap">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-neutral-100 text-sm">
              {product.brand && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Brand</div>
                  <div className="font-medium">{product.brand}</div>
                </div>
              )}
              {product.author && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Author</div>
                  <div className="font-medium">{product.author}</div>
                </div>
              )}
              {product.edition && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Edition</div>
                  <div className="font-medium">{product.edition}</div>
                </div>
              )}
              {product.course && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Course</div>
                  <div className="font-medium">{product.course}</div>
                </div>
              )}
              {product.department && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Department</div>
                  <div className="font-medium">{product.department}</div>
                </div>
              )}
              {product.semester && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Semester</div>
                  <div className="font-medium">{product.semester}</div>
                </div>
              )}
              <div>
                <div className="text-neutral-500 text-xs mb-1">Category</div>
                <div className="font-medium">{category?.name}</div>
              </div>
              {subcategory && (
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Subcategory</div>
                  <div className="font-medium">{subcategory.name}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info & Pricing */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${condBadge.color}`}>{condBadge.label}</span>
              {product.listingType === 'rent' && <span className="badge bg-electric-500/10 text-electric-600">🔄 Rent</span>}
              {product.listingType === 'exchange' && <span className="badge bg-fresh-500/10 text-fresh-600">♻️ Swap</span>}
              {product.listingType === 'free' && <span className="badge bg-red-100 text-red-600">🎁 Free</span>}
              {!isAvailable && (
                <span className="badge bg-red-600 text-white font-bold">
                  ✕ Not Available
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              {campus && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-brand-600" /> {campus.name}
                </span>
              )}
              <span>👁️ {product.viewCount} views</span>
              <span>📅 {formatDate(product.createdAt)}</span>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              {product.listingType === 'free' ? (
                <div className="text-4xl font-bold text-fresh-600">Free</div>
              ) : product.listingType === 'rent' ? (
                <div>
                  <div className="text-3xl font-bold text-brand-600">
                    {formatPrice(product.rentalPriceDaily)}<span className="text-base text-neutral-500">/day</span>
                  </div>
                  {product.rentalPriceWeekly && (
                    <div className="text-sm text-neutral-600 mt-1">
                      Weekly: {formatPrice(product.rentalPriceWeekly)} · Monthly: {formatPrice(product.rentalPriceMonthly)}
                    </div>
                  )}
                  {product.rentalDeposit && (
                    <div className="text-sm text-neutral-600 mt-1">
                      Refundable deposit: {formatPrice(product.rentalDeposit)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-4xl font-bold text-brand-600">{formatPrice(product.price)}</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              {isAvailable ? (
                <button
                  onClick={scrollToChat}
                  className="btn btn-primary btn-lg"
                >
                  {product.listingType === 'rent' ? 'Rent Now' : product.listingType === 'free' ? 'Claim Item' : 'Buy Now'}
                </button>
              ) : (
                <button
                  disabled
                  className="btn btn-secondary btn-lg opacity-50 cursor-not-allowed text-red-600 border-red-200"
                >
                  🚫 Not Available
                </button>
              )}
              <button onClick={scrollToChat} className="btn btn-secondary btn-lg gap-1.5">
                <MessageCircle className="w-4 h-4 text-brand-600" />
                {conversations.length > 0 ? 'View Chat' : 'Message'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={handleWishlist}
                className="btn btn-ghost btn-sm flex-1"
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button onClick={handleShare} className="btn btn-ghost btn-sm flex-1">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          {/* Seller card */}
          {seller && (
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-electric-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {seller.profile?.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{seller.profile?.fullName || 'User'}</h3>
                    {seller.profile?.rating && parseFloat(seller.profile.rating) > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {parseFloat(seller.profile.rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-fresh-500" />
                    Verified Campus Student
                  </div>
                </div>
              </div>
              <Link href={`/profile/${seller.id}`} className="btn btn-secondary btn-md w-full">
                View Profile
              </Link>
            </div>
          )}

          {/* Campus Safety */}
          <div className="card p-6 bg-gradient-to-br from-fresh-50 to-electric-50 border-fresh-200">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-fresh-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Campus Loop Safety</h3>
                <ul className="text-sm text-neutral-700 space-y-1">
                  <li>✓ Meet in safe, public campus spots</li>
                  <li>✓ Inspect item condition before paying</li>
                  <li>✓ Coordinate directly in messages below</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT INQUIRIES & MESSAGES SECTION RIGHT BELOW PRODUCT */}
      <div id="product-messages-section" className="mt-10 card p-6 sm:p-8 border border-neutral-200 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {isSeller ? 'Student Inquiries for this Item' : 'Direct Messages with Seller'}
                </h2>
                <p className="text-neutral-500 text-xs">
                  {isSeller
                    ? 'Questions and deals from interested campus students regarding this product'
                    : 'Chat directly to arrange pickup, ask questions, or make an offer'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadProductMessages}
            disabled={loadingMessages}
            className="btn btn-ghost btn-sm gap-1 self-start sm:self-center"
            title="Refresh Messages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* If user not logged in */}
        {!user ? (
          <div className="py-10 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-neutral-800 mb-1">Log in to chat with the seller</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Have questions or want to buy this item? Sign in to coordinate campus pickup directly.
            </p>
            <button onClick={() => router.push('/login')} className="btn btn-primary btn-md">
              Log in to Message
            </button>
          </div>
        ) : isSeller ? (
          /* SELLER VIEW */
          <div>
            {conversations.length === 0 ? (
              <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <MessageCircle className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h4 className="font-semibold text-neutral-700 text-sm">No student inquiries yet</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  When other campus students message you about this listing, their questions and deals will appear right here.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-[240px_1fr] gap-4">
                {/* Conversation List for Seller */}
                <div className="flex md:flex-col overflow-x-auto no-scrollbar gap-2 md:gap-0 border border-neutral-200 rounded-xl p-1.5 md:p-0 md:divide-y md:divide-neutral-100 max-h-[360px] md:overflow-y-auto bg-neutral-50/50">
                  <div className="hidden md:block p-2.5 bg-neutral-50 text-xs font-semibold text-neutral-600">
                    Interested Buyers ({conversations.length})
                  </div>
                  {conversations.map((c) => {
                    const isSelected = c.id === activeConversation?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConvoId(c.id)}
                        className={`text-left p-2.5 md:p-3 flex items-center gap-2 rounded-lg md:rounded-none shrink-0 md:shrink transition-colors ${
                          isSelected ? 'bg-brand-50 md:border-l-4 md:border-brand-600 text-brand-900 border border-brand-200 md:border-transparent' : 'bg-white hover:bg-neutral-50 border border-neutral-200 md:border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {c.otherUser?.fullName?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate max-w-[110px] md:max-w-none">
                            {c.otherUser?.fullName || 'Student'}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate hidden md:block">
                            {c.messages?.[c.messages.length - 1]?.content || 'Started conversation'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Chat Thread */}
                <div className="border border-neutral-200 rounded-xl flex flex-col h-[360px] bg-neutral-50/30">
                  <div className="p-3 border-b border-neutral-100 bg-white font-semibold text-xs flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    Chat with {activeConversation?.otherUser?.fullName || 'Student Buyer'}
                  </div>

                  <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto space-y-2">
                    {activeConversation?.messages?.map((m: any) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                              isMe
                                ? 'bg-brand-600 text-white rounded-br-xs'
                                : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-white/70' : 'text-neutral-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendInlineMessage} className="p-2 border-t border-neutral-100 bg-white flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Reply to student buyer..."
                      className="input text-xs py-2 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sendingMsg}
                      className="btn btn-primary btn-sm px-3 shrink-0"
                    >
                      {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* BUYER VIEW */
          <div className="max-w-2xl mx-auto">
            {conversations.length > 0 && activeConversation?.messages?.length > 0 ? (
              /* Existing Conversation */
              <div className="border border-neutral-200 rounded-2xl flex flex-col h-[340px] bg-neutral-50/30 overflow-hidden shadow-xs">
                <div className="p-3 border-b border-neutral-100 bg-white font-semibold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {seller?.profile?.fullName?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <span>Direct chat with {seller?.profile?.fullName || 'Seller'}</span>
                  </div>
                  <span className="text-[11px] text-fresh-600">● Available for chat</span>
                </div>

                <div ref={chatScrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
                  {activeConversation.messages.map((m: any) => {
                    const isMe = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-xs'
                              : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-white/70' : 'text-neutral-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendInlineMessage} className="p-2.5 border-t border-neutral-100 bg-white flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to seller..."
                    className="input text-xs py-2 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sendingMsg}
                    className="btn btn-primary btn-sm px-4 shrink-0"
                  >
                    {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>
              </div>
            ) : (
              /* New Message / Inquire Form */
              <div className="bg-neutral-50/70 p-6 rounded-2xl border border-neutral-200">
                <div className="mb-4">
                  <h4 className="font-bold text-sm text-neutral-900 mb-1">
                    Send a direct message to {seller?.profile?.fullName || 'the seller'}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Ask questions, verify condition, or arrange meeting on campus.
                  </p>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    'Is this still available?',
                    'Can we meet near the campus library?',
                    'Is the price negotiable?',
                    'What condition is the item in?'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendInlineMessage(undefined, chip)}
                      disabled={sendingMsg}
                      className="px-2.5 py-1 text-xs rounded-full bg-white hover:bg-brand-50 hover:text-brand-600 border border-neutral-200 text-neutral-700 transition-colors"
                    >
                      💬 {chip}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendInlineMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${seller?.profile?.fullName || 'seller'} about this item...`}
                    className="input text-sm flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sendingMsg}
                    className="btn btn-primary btn-md px-5 shrink-0"
                  >
                    {sendingMsg ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
