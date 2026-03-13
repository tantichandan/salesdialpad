'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dialpad');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await login(password);
    
    if (success) {
      router.push('/dialpad');
    } else {
      setError('Invalid password. Please try again.');
      setPassword('');
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="vl-login-root">
        <style>{loginStyles}</style>
        <div className="vl-login-loading">
          <div className="vl-login-spinner" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="vl-login-root">
      <style>{loginStyles}</style>
      
      <div className="vl-login-card">
        <div className="vl-login-header">
          <div className="vl-login-logo">
            <Phone size={24} color="#fff" />
          </div>
          <h1 className="vl-login-title">VoiceLink</h1>
          <p className="vl-login-subtitle">Professional Communication Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="vl-login-form">
          <div className="vl-login-field">
            <label className="vl-login-label">
              <Lock size={14} />
              Access Password
            </label>
            <div className="vl-login-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className="vl-login-input"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="vl-login-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="vl-login-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="vl-login-btn"
            disabled={!password.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="vl-login-btn-spinner" />
                Verifying...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <p className="vl-login-footer">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c10;
    --surface: #111318;
    --surface2: #1a1d24;
    --surface3: #22262f;
    --border: #2a2d36;
    --border2: #343840;
    --text: #e8eaf0;
    --text2: #9095a3;
    --text3: #5a5f6e;
    --accent: #4f8ef7;
    --accent2: #3b6fd4;
    --red: #ef4444;
    --mono: 'DM Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }

  .vl-login-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .vl-login-loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vl-login-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .vl-login-card {
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 32px;
  }

  .vl-login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .vl-login-logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--accent), #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(79, 142, 247, 0.3);
  }

  .vl-login-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .vl-login-subtitle {
    font-size: 13px;
    color: var(--text3);
    font-family: var(--mono);
  }

  .vl-login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .vl-login-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vl-login-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-family: var(--mono);
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .vl-login-input-wrap {
    position: relative;
  }

  .vl-login-input {
    width: 100%;
    padding: 14px 44px 14px 16px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 12px;
    color: var(--text);
    font-size: 15px;
    font-family: var(--sans);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .vl-login-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
  }

  .vl-login-input::placeholder {
    color: var(--text3);
  }

  .vl-login-input:disabled {
    opacity: 0.6;
  }

  .vl-login-eye {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text3);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .vl-login-eye:hover {
    color: var(--text2);
  }

  .vl-login-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 13px;
    animation: shake 0.4s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .vl-login-btn {
    width: 100%;
    padding: 14px 20px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--sans);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.15s, transform 0.1s;
    box-shadow: 0 4px 20px rgba(79, 142, 247, 0.3);
  }

  .vl-login-btn:hover:not(:disabled) {
    opacity: 0.92;
  }

  .vl-login-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .vl-login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vl-login-btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .vl-login-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 11px;
    color: var(--text3);
    font-family: var(--mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;
