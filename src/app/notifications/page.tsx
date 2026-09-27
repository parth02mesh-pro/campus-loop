'use client';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      {!user ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-lg mb-2">Login to see notifications</h3>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
          <p className="text-neutral-600">No new notifications right now</p>
        </div>
      )}
    </div>
  );
}
