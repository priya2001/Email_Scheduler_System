'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';
import DashboardLayout from '@/components/DashboardLayout';
import EmailList from '@/components/EmailList';

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
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/auth/login');
          return;
        }

        setUser(session.user);
        
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
      const response = await fetch('http://localhost:3001/api/emails', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      setEmails(data.data || []);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      // Show mock data on error for testing
      const mockEmails: Email[] = [
        {
          id: '1',
          recipient: 'Sarah Wilson',
          subject: 'Re: Project Update',
          preview: 'Thanks for the update, Sarah. Looks good!',
          scheduledTime: 'Tue 9:15:12 AM',
          status: 'sent',
        },
        {
          id: '2',
          recipient: 'Support',
          subject: 'Issue with login',
          preview: 'I am having trouble logging in to the dashboard...',
          scheduledTime: 'Thu 8:15:12 PM',
          status: 'sent',
        },
        {
          id: '3',
          recipient: 'Sarah Johnson',
          subject: 'Project Update - Q2',
          preview: 'Here are the Q2 updates...',
          scheduledTime: 'Wed 2:30:00 PM',
          status: 'scheduled',
        },
      ];
      setEmails(mockEmails);
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
    >
      <EmailList emails={emails} category={selectedCategory} />
    </DashboardLayout>
  );
}
