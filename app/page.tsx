'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid session token
    if (isAuthenticated()) {
      // User is authenticated, go to dialpad
      router.push('/dialpad');
    } else {
      // User not authenticated, go to auth page
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">VoiceLink</h1>
        <p className="text-slate-300">Initializing...</p>
      </div>
    </div>
  );
}
