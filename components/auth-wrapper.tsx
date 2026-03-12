'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearSessionToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

/**
 * Wrapper component that protects pages from unauthorized access
 * Redirects to /auth if no valid session token
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated()) {
      router.push('/auth');
    }
  }, [router]);

  const handleLogout = () => {
    clearSessionToken();
    router.push('/auth');
  };

  // If not authenticated, don't render children (redirect will happen in effect)
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="relative">
      {/* Logout button in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
      {children}
    </div>
  );
}
