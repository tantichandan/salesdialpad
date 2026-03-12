import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateSessionToken } from '@/lib/auth';

/**
 * POST /api/auth/verify
 * Verifies the password and returns a session token if correct
 * Password is never logged or exposed in response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password against environment variable (server-side only)
    const isValid = await verifyPassword(password);

    if (!isValid) {
      // Don't expose which part is wrong - just say invalid
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate session token (safe to expose, just proves user verified)
    const token = generateSessionToken();

    return NextResponse.json({ token }, { status: 200 });
  } catch (error: any) {
    console.error('Auth error:', error.message);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
