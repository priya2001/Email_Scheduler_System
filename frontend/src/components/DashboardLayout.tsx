'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  selectedCategory: 'scheduled' | 'sent' | 'draft';
  onCategoryChange: (category: 'scheduled' | 'sent' | 'draft') => void;
}

export default function DashboardLayout({
  children,
  user,
  selectedCategory,
  onCategoryChange,
}: DashboardLayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const categories = [
    { id: 'scheduled', label: 'Scheduled', count: 12, icon: '📅' },
    { id: 'sent', label: 'Sent', count: 785, icon: '✉️' },
    { id: 'draft', label: 'Draft', count: 5, icon: '📝' },
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
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Email</h1>
          <p className="text-xs text-gray-400 mt-1">Scheduler</p>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 hover:bg-gray-50 p-3 rounded-lg transition"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {userInitials}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <span className="text-gray-400">▼</span>
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
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
            ✎ Compose
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">CORE</p>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id as any)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center justify-between transition ${
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
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {categories.find((c) => c.id === selectedCategory)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search emails..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              ⚙️
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
