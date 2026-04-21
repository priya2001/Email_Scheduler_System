'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The URL fragment is automatically handled by Supabase
        // This component just waits for the auth state to be set
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => {
            router.replace('/auth/login');
          }, 3000);
          return;
        }

        if (session) {
          console.log('Session established, redirecting to dashboard');
          router.replace('/dashboard');
        } else {
          console.log('No session, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication error');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing your login...</p>
      </div>
    </div>
  );
}
