import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  if (!price) return '₹0';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `₹${numPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CL-${timestamp}-${random}`;
}

export function generateRentalNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RN-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getConditionBadge(condition: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: 'bg-green-100 text-green-700' },
    like_new: { label: 'Like New', color: 'bg-emerald-100 text-emerald-700' },
    very_good: { label: 'Very Good', color: 'bg-blue-100 text-blue-700' },
    good: { label: 'Good', color: 'bg-indigo-100 text-indigo-700' },
    acceptable: { label: 'Acceptable', color: 'bg-yellow-100 text-yellow-700' },
    used: { label: 'Used', color: 'bg-gray-100 text-gray-700' },
  };
  return badges[condition] || { label: condition, color: 'bg-gray-100 text-gray-700' };
}

export function getOrderStatusBadge(status: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-700' },
    preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700' },
    ready_pickup: { label: 'Ready for Pickup', color: 'bg-cyan-100 text-cyan-700' },
    shipped: { label: 'Shipped', color: 'bg-blue-100 text-blue-700' },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
    disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-700' },
  };
  return badges[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
}
