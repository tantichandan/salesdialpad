'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import {
  Phone, MessageSquare, Radio, ChevronLeft, Search,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Calendar,
  Filter, X, LogOut, Loader2
} from 'lucide-react';

interface CallRecord {
  sid: string;
  from: string;
  to: string;
  status: string;
  duration: string;
  direction: string;
  dateCreated: string;
}

interface MessageRecord {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status: string;
  dateCreated: string;
}

interface RecordingRecord {
  sid: string;
  callSid: string;
  duration: string;
  dateCreated: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'messages' | 'recordings'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [error, setError] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSearch = async () => {
    setError('');
    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setCalls(data.calls || []);
      setMessages(data.messages || []);
      setRecordings(data.recordings || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setCalls([]);
      setMessages([]);
      setRecordings([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setStartDate('');
    setEndDate('');
    setCalls([]);
    setMessages([]);
    setRecordings([]);
    setHasSearched(false);
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0c10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '2px solid #2a2d36',
          borderTopColor: '#4f8ef7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalResults = calls.length + messages.length + recordings.length;

  return (
    <>
      <style>{historyStyles}</style>

      <div className="vl-history-root">
        {/* Header */}
        <div className="vl-history-header">
          <Link href="/dialpad" className="vl-back-link">
            <ChevronLeft size={16} />
            Back to Dialpad
          </Link>
          <div className="vl-history-title-wrap">
            <h1 className="vl-history-title">History Search</h1>
            <p className="vl-history-subtitle">Search call logs, messages, and recordings by date</p>
          </div>
          <button className="vl-header-btn logout" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Search Card */}
        <div className="vl-search-card">
          {/* Tabs */}
          <div className="vl-search-tabs">
            <button
              className={`vl-search-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Filter size={14} />
              All Records
            </button>
            <button
              className={`vl-search-tab ${activeTab === 'calls' ? 'active' : ''}`}
              onClick={() => setActiveTab('calls')}
            >
              <Phone size={14} />
              Calls
            </button>
            <button
              className={`vl-search-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={14} />
              Messages
            </button>
            <button
              className={`vl-search-tab ${activeTab === 'recordings' ? 'active' : ''}`}
              onClick={() => setActiveTab('recordings')}
            >
              <Radio size={14} />
              Recordings
            </button>
          </div>

          {/* Date Filters */}
          <div className="vl-search-filters">
            <div className="vl-date-field">
              <label className="vl-date-label">
                <Calendar size={12} />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="vl-date-input"
              />
            </div>
            <div className="vl-date-field">
              <label className="vl-date-label">
                <Calendar size={12} />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="vl-date-input"
              />
            </div>
            <div className="vl-search-actions">
              <button
                className="vl-search-btn"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 size={14} className="vl-spinner" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Search
                  </>
                )}
              </button>
              {hasSearched && (
                <button className="vl-clear-btn" onClick={clearSearch}>
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Info text */}
          <p className="vl-search-info">
            Leave dates empty to fetch all available records. Results are fetched on-demand and not stored.
          </p>
        </div>

        {/* Results */}
        {error && (
          <div className="vl-error-card">
            {error}
          </div>
        )}

        {hasSearched && !isSearching && !error && (
          <div className="vl-results">
            <div className="vl-results-header">
              <span className="vl-results-count">{totalResults} results found</span>
            </div>

            {/* Calls Section */}
            {(activeTab === 'all' || activeTab === 'calls') && calls.length > 0 && (
              <div className="vl-results-section">
                <h3 className="vl-section-title">
                  <Phone size={14} />
                  Call Logs ({calls.length})
                </h3>
                <div className="vl-results-list">
                  {calls.map((call) => {
                    const isOutbound = call.direction?.includes('outbound');
                    const number = isOutbound ? call.to : call.from;
                    return (
                      <div key={call.sid} className="vl-result-item">
                        <div className={`vl-result-icon ${isOutbound ? 'out' : call.status === 'no-answer' ? 'miss' : 'in'}`}>
                          {isOutbound
                            ? <PhoneOutgoing size={14} />
                            : call.status === 'no-answer'
                              ? <PhoneMissed size={14} />
                              : <PhoneIncoming size={14} />
                          }
                        </div>
                        <div className="vl-result-info">
                          <div className="vl-result-number">{number}</div>
                          <div className="vl-result-status">{call.status}</div>
                        </div>
                        <div className="vl-result-meta">
                          <div className="vl-result-duration">{call.duration || 0}s</div>
                          <div className="vl-result-date">{formatDate(call.dateCreated)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {(activeTab === 'all' || activeTab === 'messages') && messages.length > 0 && (
              <div className="vl-results-section">
                <h3 className="vl-section-title">
                  <MessageSquare size={14} />
                  Messages ({messages.length})
                </h3>
                <div className="vl-results-list">
                  {messages.map((msg) => {
                    const isSent = msg.direction?.includes('outbound');
                    const number = isSent ? msg.to : msg.from;
                    const isExpanded = expandedMessage === msg.sid;
                    return (
                      <div 
                        key={msg.sid} 
                        className={`vl-message-item ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedMessage(isExpanded ? null : msg.sid)}
                      >
                        <div className="vl-message-header">
                          <div className={`vl-result-icon ${isSent ? 'out' : 'in'}`}>
                            <MessageSquare size={14} />
                          </div>
                          <div className="vl-message-info">
                            <div className="vl-message-number">
                              <span className="vl-message-direction">{isSent ? 'To:' : 'From:'}</span>
                              {number}
                            </div>
                            {!isExpanded && (
                              <div className="vl-message-preview">{msg.body}</div>
                            )}
                          </div>
                          <div className="vl-result-meta">
                            <div className="vl-result-status-badge">{msg.status}</div>
                            <div className="vl-result-date">{formatDate(msg.dateCreated)}</div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="vl-message-body-full">
                            {msg.body}
                          </div>
                        )}
                        <div className="vl-message-tap-hint">
                          {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recordings Section */}
            {(activeTab === 'all' || activeTab === 'recordings') && recordings.length > 0 && (
              <div className="vl-results-section">
                <h3 className="vl-section-title">
                  <Radio size={14} />
                  Recordings ({recordings.length})
                </h3>
                <div className="vl-results-list">
                  {recordings.map((rec) => (
                    <div key={rec.sid} className="vl-recording-item">
                      <div className="vl-recording-meta">
                        <span>Duration: {rec.duration}s</span>
                        <span>{formatDate(rec.dateCreated)}</span>
                      </div>
                      <audio controls src={`/api/recording/stream/${rec.sid}`} className="vl-audio" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {totalResults === 0 && (
              <div className="vl-empty-results">
                <div className="vl-empty-icon">
                  <Search size={24} />
                </div>
                <p>No records found for the selected criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="vl-initial-state">
            <div className="vl-empty-icon">
              <Search size={24} />
            </div>
            <p>Select filters and click Search to fetch records</p>
          </div>
        )}
      </div>
    </>
  );
}

const historyStyles = `
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
    --green: #22c55e;
    --red: #ef4444;
    --amber: #f59e0b;
    --mono: 'DM Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); }

  .vl-history-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
    padding: 24px 20px 48px;
    max-width: 900px;
    margin: 0 auto;
  }

  /* Header */
  .vl-history-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .vl-back-link {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px 8px 10px;
    border-radius: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text2);
    font-size: 13px;
    font-family: var(--mono);
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
  }
  .vl-back-link:hover {
    background: var(--surface3);
    color: var(--text);
  }

  .vl-history-title-wrap {
    flex: 1;
  }
  .vl-history-title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.4px;
  }
  .vl-history-subtitle {
    font-size: 12px;
    color: var(--text3);
    font-family: var(--mono);
    margin-top: 2px;
  }

  .vl-header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text2);
    font-size: 12px;
    font-family: var(--mono);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .vl-header-btn:hover {
    background: var(--surface3);
    border-color: var(--border2);
    color: var(--text);
  }
  .vl-header-btn.logout:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  /* Search Card */
  .vl-search-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .vl-search-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .vl-search-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text2);
    font-size: 13px;
    font-family: var(--sans);
    cursor: pointer;
    transition: all 0.15s;
  }
  .vl-search-tab:hover {
    background: var(--surface3);
    border-color: var(--border2);
    color: var(--text);
  }
  .vl-search-tab.active {
    background: rgba(79, 142, 247, 0.12);
    border-color: rgba(79, 142, 247, 0.4);
    color: var(--accent);
  }

  .vl-search-filters {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .vl-date-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .vl-date-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-family: var(--mono);
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .vl-date-input {
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 10px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--mono);
    outline: none;
    transition: border-color 0.15s;
    color-scheme: dark;
  }
  .vl-date-input:focus {
    border-color: var(--accent);
  }

  .vl-search-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .vl-search-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--sans);
    cursor: pointer;
    transition: opacity 0.15s;
    box-shadow: 0 4px 16px rgba(79, 142, 247, 0.25);
  }
  .vl-search-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  .vl-search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .vl-clear-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 16px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text2);
    font-size: 13px;
    font-family: var(--sans);
    cursor: pointer;
    transition: all 0.15s;
  }
  .vl-clear-btn:hover {
    background: var(--surface3);
    color: var(--text);
  }

  .vl-spinner {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .vl-search-info {
    margin-top: 14px;
    font-size: 12px;
    color: var(--text3);
    font-family: var(--mono);
  }

  /* Error */
  .vl-error-card {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 12px;
    padding: 14px 18px;
    color: #fca5a5;
    font-size: 13px;
    margin-bottom: 20px;
  }

  /* Results */
  .vl-results {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
  }

  .vl-results-header {
    margin-bottom: 16px;
  }
  .vl-results-count {
    font-size: 13px;
    color: var(--text2);
    font-family: var(--mono);
  }

  .vl-results-section {
    margin-bottom: 24px;
  }
  .vl-results-section:last-child {
    margin-bottom: 0;
  }

  .vl-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .vl-results-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vl-result-item {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    transition: border-color 0.12s;
  }
  .vl-result-item:hover {
    border-color: var(--border2);
  }

  .vl-result-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 12px;
  }
  .vl-result-icon.out {
    background: rgba(79, 142, 247, 0.1);
    color: var(--accent);
  }
  .vl-result-icon.in {
    background: rgba(34, 197, 94, 0.1);
    color: #4ade80;
  }
  .vl-result-icon.miss {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
  }

  .vl-result-info {
    flex: 1;
    min-width: 0;
  }
  .vl-result-number {
    font-size: 14px;
    font-weight: 500;
    font-family: var(--mono);
  }
  .vl-result-status {
    font-size: 11px;
    color: var(--text3);
    margin-top: 2px;
  }
  .vl-result-body {
    font-size: 12px;
    color: var(--text2);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  /* Message Item */
  .vl-message-item {
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }
  .vl-message-item:hover {
    border-color: var(--border2);
  }
  .vl-message-item.expanded {
    background: var(--surface3);
    border-color: var(--accent);
  }

  .vl-message-header {
    display: flex;
    align-items: center;
  }

  .vl-message-info {
    flex: 1;
    min-width: 0;
  }

  .vl-message-number {
    font-size: 14px;
    font-weight: 500;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .vl-message-direction {
    font-size: 11px;
    color: var(--text3);
    font-weight: 400;
  }

  .vl-message-preview {
    font-size: 12px;
    color: var(--text2);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  .vl-message-body-full {
    margin-top: 12px;
    padding: 12px 14px;
    background: var(--surface);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .vl-message-tap-hint {
    margin-top: 8px;
    font-size: 10px;
    color: var(--text3);
    text-align: center;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .vl-result-meta {
    margin-left: auto;
    text-align: right;
    flex-shrink: 0;
  }
  .vl-result-duration {
    font-size: 12px;
    font-family: var(--mono);
    color: var(--text2);
  }
  .vl-result-date {
    font-size: 11px;
    color: var(--text3);
    margin-top: 2px;
  }
  .vl-result-status-badge {
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Recording Item */
  .vl-recording-item {
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
  }
  .vl-recording-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text3);
    font-family: var(--mono);
    margin-bottom: 10px;
  }
  .vl-audio {
    width: 100%;
    height: 36px;
    filter: invert(0.85) hue-rotate(180deg);
  }

  /* Empty States */
  .vl-empty-results,
  .vl-initial-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text3);
    text-align: center;
    gap: 12px;
  }
  .vl-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .vl-search-filters {
      flex-direction: column;
      align-items: stretch;
    }
    .vl-search-actions {
      margin-left: 0;
      margin-top: 8px;
    }
    .vl-result-body {
      max-width: 150px;
    }
    .vl-message-preview {
      max-width: 150px;
    }
    .vl-message-header {
      flex-wrap: wrap;
      gap: 8px;
    }
    .vl-result-meta {
      width: 100%;
      text-align: left;
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }
  }
`;
