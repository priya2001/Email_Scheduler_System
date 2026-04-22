'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
      return;
    }

    const checkSession = async () => {
      const response = await apiFetch('/api/auth/session');

      if (response.ok) {
        router.replace('/dashboard');
        return;
      }

      router.replace('/auth/login');
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
