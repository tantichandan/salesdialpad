/**
 * Authentication utilities for SalesDialpad
 * Handles session token generation and validation
 */

const SESSION_TOKEN_KEY = 'auth_session_token';
const SESSION_STORAGE_KEY = 'dialpad_session_auth';

/**
 * Verify password against the env variable
 * This function runs only on the server and never exposes the password
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const correctPassword = process.env.APP_PASSWORD || 'acpremium@021287';
  return password === correctPassword;
}

/**
 * Generate a simple session token (not sensitive, just proof of auth)
 */
export function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get session token from client-side storage
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

/**
 * Set session token in client-side storage
 */
export function setSessionToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  }
}

/**
 * Clear session token (on logout)
 */
export function clearSessionToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSessionToken() !== null;
}
