'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import EmailList from '@/components/EmailList';

interface Email {
  id: string;
  recipient: string;
  subject: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'draft';
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'scheduled' | 'sent' | 'draft'>('scheduled');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

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
  }, [supabase.auth, router]);

  const fetchEmails = async () => {
    // Mock data for now - replace with actual API call
    const mockEmails: Email[] = [
      {
        id: '1',
        recipient: 'John Smith',
        subject: 'Meeting follow-up - Scheduled',
        scheduledTime: 'Tue 9:15:12 AM',
        status: 'scheduled',
      },
      {
        id: '2',
        recipient: 'Olive',
        subject: "Ramit, great to meet you - you'll love it",
        scheduledTime: 'Thu 8:15:12 PM',
        status: 'scheduled',
      },
      {
        id: '3',
        recipient: 'Sarah Johnson',
        subject: 'Project Update - Q2',
        scheduledTime: 'Wed 2:30:00 PM',
        status: 'scheduled',
      },
    ];

    setEmails(mockEmails);
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
    <DashboardLayout user={user} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory}>
      <EmailList emails={emails} category={selectedCategory} />
    </DashboardLayout>
  );
}
