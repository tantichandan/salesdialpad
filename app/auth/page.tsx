'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setSessionToken } from '@/lib/auth';
import { AlertCircle, Lock } from 'lucide-react';

export default function AuthPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid password');
        setLoading(false);
        return;
      }

      // Store session token
      setSessionToken(data.token);

      // Redirect to dialpad
      router.push('/dialpad');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">SalesDialpad</h1>
          <p className="text-center text-slate-600 mb-8">
            Enter your access password to continue
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Verifying...' : 'Access'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            Password is securely verified on server. Never exposed in source code or console.
          </p>
        </div>
      </Card>
    </div>
  );
}
