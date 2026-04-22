'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';

interface Email {
  id: string;
  recipient: string;
  subject: string;
  preview?: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'draft';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  selectedCategory: 'scheduled' | 'sent' | 'draft';
  onCategoryChange: (category: 'scheduled' | 'sent' | 'draft') => void;
  emails: Email[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function DashboardLayout({
  children,
  user,
  selectedCategory,
  onCategoryChange,
  emails,
  searchQuery = '',
  onSearchChange = () => {},
}: DashboardLayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const supabase = useSupabase();
  const router = useRouter();

  // Initialize profile photo on mount
  useEffect(() => {
    if (user?.email) {
      // Generate MD5 hash of the email for Gravatar
      // Gravatar uses MD5 hash of lowercase email for fetching profile photos
      const trimmedEmail = user.email.toLowerCase().trim();
      const hash = CryptoJS.MD5(trimmedEmail).toString();
      
      // Gravatar URL - will fetch real profile photo if user has Gravatar account
      // d=identicon provides fallback avatar if no Gravatar profile exists
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
      setProfilePhotoUrl(gravatarUrl);
    }
  }, [user?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Calculate counts dynamically from emails
  const scheduledCount = emails.filter((e) => e.status === 'scheduled').length;
  const sentCount = emails.filter((e) => e.status === 'sent').length;
  const draftCount = emails.filter((e) => e.status === 'draft').length;

  const categories = [
    { id: 'scheduled', label: 'Scheduled', count: scheduledCount, icon: '📅' },
    { id: 'sent', label: 'Sent', count: sentCount, icon: '✉️' },
    { id: 'draft', label: 'Draft', count: draftCount, icon: '📝' },
  ];

  const userInitials = user?.email
    ?.split('@')[0]
    .split('.')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">ONG</h1>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition"
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userInitials || 'OB'}
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <span className="text-gray-400 text-xs flex-shrink-0">▼</span>
          </button>

          {showUserMenu && (
            <div className="absolute top-24 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/compose')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-full transition flex items-center justify-center gap-2"
          >
            ✎ Compose
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 p-6 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">CORE</p>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id as any)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition ${
                selectedCategory === category.id
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>{category.icon}</span>
                {category.label}
              </span>
              <span className={`text-sm ${selectedCategory === category.id ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>Email Scheduler v1.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">
              {categories.find((c) => c.id === selectedCategory)?.label}
            </h2>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-2xl">
              <span className="text-gray-500 flex-shrink-0">🔍</span>
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-gray-100 text-sm focus:outline-none text-gray-800 placeholder-gray-500 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
