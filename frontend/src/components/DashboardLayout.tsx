'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';
import { CalendarClock, ChevronDown, LogOut, Mail, PenLine, RotateCcw, Search, Send, SlidersHorizontal } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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

const categoryMeta = {
  scheduled: {
    label: 'Scheduled',
    icon: CalendarClock,
  },
  sent: {
    label: 'Sent',
    icon: Send,
  },
  draft: {
    label: 'Draft',
    icon: Mail,
  },
} as const;

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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      const trimmedEmail = user.email.toLowerCase().trim();
      const hash = CryptoJS.MD5(trimmedEmail).toString();
      setProfilePhotoUrl(`https://www.gravatar.com/avatar/${hash}?d=identicon&s=96`);
    }
  }, [user?.email]);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    });
    router.push('/auth/login');
  };

  const scheduledCount = emails.filter((e) => e.status === 'scheduled').length;
  const sentCount = emails.filter((e) => e.status === 'sent').length;
  const draftCount = emails.filter((e) => e.status === 'draft').length;

  const categories = [
    { id: 'scheduled', ...categoryMeta.scheduled, count: scheduledCount },
    { id: 'sent', ...categoryMeta.sent, count: sentCount },
    { id: 'draft', ...categoryMeta.draft, count: draftCount },
  ] as const;

  const userInitials = useMemo(() => {
    if (!user?.email) return 'UN';
    return user.email
      .split('@')[0]
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.email]);

  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      <aside className="flex w-[326px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4">
        <div className="px-2 pb-5">
          <h1 className="select-none text-6xl font-black leading-none tracking-[-0.08em] text-slate-900">ONG</h1>
        </div>

        <div className="relative px-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex w-full items-center gap-3 rounded-3xl bg-slate-100 px-3 py-3.5 text-left transition hover:bg-slate-200/60"
          >
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg leading-tight text-slate-900">{user?.email?.split('@')[0] || 'Oliver Brown'}</p>
              <p className="truncate text-[15px] leading-tight text-slate-500">{user?.email || 'oliver.brown@domain.io'}</p>
            </div>
            <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute left-2 right-2 top-[92px] z-50 rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="px-2 py-5">
          <button
            onClick={() => router.push('/compose')}
            className="flex w-full items-center justify-center rounded-full border-2 border-emerald-500 px-4 py-4 text-[22px] font-medium text-emerald-600 transition hover:bg-emerald-50"
          >
            <PenLine className="mr-3 h-6 w-6" />
            Compose
          </button>
        </div>

        <div className="px-2 pt-2">
          <p className="mb-4 px-4 text-[13px] font-medium uppercase tracking-[0.12em] text-slate-400">Core</p>
          <div className="space-y-1.5">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition ${
                    active ? 'bg-emerald-100/70 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-slate-600" />
                    <span className="text-[22px] leading-none font-medium">{category.label}</span>
                  </span>
                  <span className={`text-[18px] leading-none ${active ? 'text-slate-500' : 'text-slate-500'}`}>{category.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex items-center gap-4 border-b border-slate-200 px-8 py-6">
          <div className="relative flex min-w-0 flex-1 items-center">
            <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-[54px] w-full rounded-full bg-slate-50 pl-14 pr-5 text-[19px] text-slate-700 placeholder:text-slate-400 outline-none ring-0 transition focus:bg-white focus:shadow-[0_0_0_1px_rgba(148,163,184,0.25)]"
            />
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Filter"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Refresh"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">{children}</div>
      </main>
    </div>
  );
}
