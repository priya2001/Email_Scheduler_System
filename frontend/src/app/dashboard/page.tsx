'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import EmailList from '@/components/EmailList';
import { apiFetch } from '@/lib/api';

interface Email {
  id: string;
  recipient: string;
  subject: string;
  preview?: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'draft';
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'scheduled' | 'sent' | 'draft'>('scheduled');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiFetch('/api/auth/session');

        if (!response.ok) {
          router.replace('/auth/login');
          return;
        }

        const data = await response.json();
        setUser(data?.data?.user || null);

        // Fetch emails from your API
        fetchEmails();
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // Empty dependency array ensures this runs only once on mount
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await apiFetch('/api/emails', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      setEmails(data.data || []);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setEmails([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      emails={emails}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {emails.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center px-6 py-10 text-center">
          <div className="max-w-sm">
            <h3 className="text-lg font-medium text-slate-900">No emails yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              When you schedule or send emails, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <EmailList emails={emails} category={selectedCategory} searchQuery={searchQuery} />
      )}
    </DashboardLayout>
  );
}
