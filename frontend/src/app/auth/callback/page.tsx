'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState('Completing your login...');

  useEffect(() => {
    const finalizeLogin = async () => {
      try {
        const response = await apiFetch('/api/auth/session');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || 'Could not complete Google login');
        }

        setMessage('Login complete');
        router.replace('/dashboard');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setMessage(err.message || 'Login failed');
        router.replace('/auth/login');
      }
    };

    finalizeLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
