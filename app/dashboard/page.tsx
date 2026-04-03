'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Device, Call } from '@twilio/voice-sdk';
import { useAuth } from '@/components/auth-provider';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  MessageSquare, Radio, Delete, PhoneIncoming, PhoneOutgoing,
  LogOut, Settings, Search, Calendar, X, Loader2, Copy, CheckCircle,
  AlertCircle
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

interface RecordingRecord {
  sid: string;
  callSid: string;
  duration: string;
  dateCreated: string;
}

interface Message {
  sid?: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status?: string;
  dateCreated: string;
  timestamp?: Date;
}

const StatusDot = ({ status }: { status: string }) => {
  const color =
    status === 'Ready' ? '#22c55e' :
    status === 'Connected' ? '#3b82f6' :
    status === 'Calling...' ? '#f59e0b' :
    status.startsWith('Error') ? '#ef4444' : '#64748b';

  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: color,
      marginRight: 8,
      boxShadow: `0 0 6px ${color}`,
      animation: status === 'Calling...' || status === 'Connected' ? 'pulse 1.5s infinite' : 'none',
    }} />
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dialer' | 'call-logs' | 'incoming' | 'recordings'>('dialer');

  // Dialer state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [callStatus, setCallStatus] = useState('Ready');
  const [callDuration, setCallDuration] = useState(0);

  // Call logs state
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Incoming calls state
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingNumber, setForwardingNumber] = useState('');
  const [isSavingForwarding, setIsSavingForwarding] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState('');

  // Recordings state
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [recordingStartDate, setRecordingStartDate] = useState('');
  const [recordingEndDate, setRecordingEndDate] = useState('');
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

  // Refs for Twilio
  const deviceRef = useRef<Device | null>(null);
  const activeConnectionRef = useRef<Call | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneNumberRef = useRef(phoneNumber);
  const callDurationRef = useRef(callDuration);

  useEffect(() => { phoneNumberRef.current = phoneNumber; }, [phoneNumber]);
  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize Twilio
  useEffect(() => {
    let isMounted = true;
    let device: Device | null = null;

    const initializeTwilio = async () => {
      try {
        if (!isMounted) return;
        setCallStatus('Initializing...');
        const response = await fetch('/api/token');
        if (!response.ok) throw new Error('Token fetch failed');
        const { token } = await response.json();
        if (!token) throw new Error('No token received');

        device = new Device(token, { logLevel: 1 });

        device.on('registered', () => { if (isMounted) setCallStatus('Ready'); });
        device.on('error', (error) => {
          console.error('Twilio Device Error:', error);
          if (isMounted) setCallStatus(`Error: ${error.message}`);
        });

        device.on('connect', (call: Call) => {
          if (!isMounted) return;
          activeConnectionRef.current = call;
          setIsCallActive(true);
          setCallStatus('Connected');
          setCallDuration(0);
          callTimerRef.current = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
        });

        device.on('disconnect', () => {
          if (!isMounted) return;
          setIsCallActive(false);
          setCallStatus('Ready');
          setIsMuted(false);
          setIsRecording(false);
          if (callTimerRef.current) clearInterval(callTimerRef.current);
          const currentNumber = phoneNumberRef.current;
          if (currentNumber) {
            setCalls(prev => [{
              sid: Date.now().toString(),
              from: process.env.NEXT_PUBLIC_TWILIO_NUMBER || '',
              to: currentNumber,
              status: 'completed',
              duration: callDurationRef.current.toString(),
              direction: 'outgoing',
              dateCreated: new Date().toISOString(),
            }, ...prev]);
          }
          setPhoneNumber('');
          activeConnectionRef.current = null;
        });

        device.on('incoming', (call: Call) => {
          if (!isMounted) return;
          setIncomingCall(call);
          setIncomingNumber(call.parameters.From || '');
          activeConnectionRef.current = call;
          setCallStatus('Incoming call...');
        });

        await device.register();
        deviceRef.current = device;
      } catch (error: any) {
        console.error('Initialization Error:', error);
        if (isMounted) setCallStatus(`Init failed: ${error?.message || 'Unknown error'}`);
      }
    };

    initializeTwilio();
    return () => {
      isMounted = false;
      if (device) { try { device.destroy(); } catch { } }
    };
  }, []);

  // Load forwarding config on mount
  useEffect(() => {
    const loadForwardingConfig = async () => {
      try {
        const response = await fetch('/api/call-forwarding');
        const config = await response.json();
        setForwardingEnabled(config.forwardingEnabled || false);
        setForwardingNumber(config.forwardingNumber || '');
      } catch (error) {
        console.error('Error loading forwarding config:', error);
      }
    };
    loadForwardingConfig();
  }, []);

  // Dialer functions
  const handleDial = async () => {
    const currentNumber = phoneNumber.trim();
    if (!currentNumber || !deviceRef.current) return;
    try {
      setCallStatus('Calling...');
      setIsCallActive(true);
      const call = await deviceRef.current.connect({ params: { To: currentNumber } });
      activeConnectionRef.current = call;
    } catch (error) {
      setIsCallActive(false);
      setCallStatus('Call failed');
    }
  };

  const handleHangup = () => {
    if (activeConnectionRef.current) { activeConnectionRef.current.disconnect(); activeConnectionRef.current = null; }
    if (deviceRef.current) deviceRef.current.disconnectAll();
    setIsCallActive(false);
    setCallStatus('Ready');
    if (callTimerRef.current) clearInterval(callTimerRef.current);
  };

  const handleMute = () => {
    if (activeConnectionRef.current) { activeConnectionRef.current.mute(!isMuted); setIsMuted(!isMuted); }
  };

  const handleSpeaker = () => { setIsSpeakerOn(!isSpeakerOn); };

  const handleRecord = async () => {
    if (!activeConnectionRef.current) return;
    try {
      const params = activeConnectionRef.current.parameters;
      const callSid = params?.CallSid;
      if (!callSid) { setIsRecording(!isRecording); return; }
      const action = isRecording ? 'stop' : 'start';
      await fetch('/api/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, callSid })
      });
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const handleNumberClick = (num: string) => { if (!isCallActive) setPhoneNumber(phoneNumber + num); };
  const handleBackspace = () => { setPhoneNumber(phoneNumber.slice(0, -1)); };

  const formatDuration = (seconds: number | string) => {
    const secs = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const sec = secs % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${mins}:${sec.toString().padStart(2, '0')}`;
  };

  // Incoming calls functions
  const handleAccept = () => {
    if (!incomingCall) return;
    incomingCall.accept();
    setIsCallActive(true);
    setCallStatus('Connected');
    setCallDuration(0);
    callTimerRef.current = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
    setIncomingCall(null);
    incomingCall.on('disconnect', () => {
      setIsCallActive(false);
      setCallStatus('Ready');
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      activeConnectionRef.current = null;
      setCalls(prev => [{
        sid: Date.now().toString(),
        from: incomingNumber,
        to: process.env.NEXT_PUBLIC_TWILIO_NUMBER || '',
        status: 'completed',
        duration: callDurationRef.current.toString(),
        direction: 'incoming',
        dateCreated: new Date().toISOString(),
      }, ...prev]);
    });
  };

  const handleReject = () => {
    if (!incomingCall) return;
    incomingCall.reject();
    setIncomingCall(null);
    setCallStatus('Ready');
    activeConnectionRef.current = null;
  };

  const saveForwardingConfig = async () => {
    setIsSavingForwarding(true);
    setForwardingMessage('');
    try {
      const response = await fetch('/api/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwardingEnabled,
          forwardingNumber
        })
      });
      
      if (response.ok) {
        setForwardingMessage('Call forwarding configuration saved successfully.');
        setTimeout(() => setForwardingMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving forwarding config:', error);
      setForwardingMessage('Failed to save configuration.');
    } finally {
      setIsSavingForwarding(false);
    }
  };

  // Call logs functions
  const fetchCallLogs = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      params.set('type', 'calls');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch call logs');
      const data = await response.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Recordings functions
  const fetchRecordings = async () => {
    setIsLoadingRecordings(true);
    try {
      const params = new URLSearchParams();
      params.set('type', 'recordings');
      if (recordingStartDate) params.set('startDate', recordingStartDate);
      if (recordingEndDate) params.set('endDate', recordingEndDate);

      const response = await fetch(`/api/history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch recordings');
      const data = await response.json();
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Loading state
  if (isLoading || !isAuthenticated) {
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

  const dialpadNumbers = [
    [{ key: '1', sub: '' }, { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' }],
    [{ key: '4', sub: 'GHI' }, { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' }],
    [{ key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' }],
    [{ key: '*', sub: '' }, { key: '0', sub: '+' }, { key: '#', sub: '' }],
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <style>{`
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

        html, body { margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: var(--sans); }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dashboard-root {
          display: flex;
          height: 100vh;
          background: var(--bg);
          overflow: hidden;
        }

        .dashboard-sidebar {
          width: 60px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          gap: 8px;
        }

        .sidebar-tab {
          width: 44px;
          height: 44px;
          border: 1px solid var(--border);
          background: transparent;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text2);
          transition: all 0.3s ease;
        }

        .sidebar-tab:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .sidebar-tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .sidebar-logout {
          margin-top: auto;
          width: 44px;
          height: 44px;
          border: 1px solid var(--red);
          background: transparent;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--red);
          transition: all 0.3s ease;
        }

        .sidebar-logout:hover {
          background: var(--red);
          color: white;
        }

        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dashboard-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dashboard-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .dashboard-header-status {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--text2);
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .tab-pane {
          display: none;
        }

        .tab-pane.active {
          display: block;
        }

        .dialer-section {
          max-width: 400px;
          margin: 0 auto;
        }

        .phone-display {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-family: var(--mono);
          font-weight: 500;
          letter-spacing: 2px;
          word-break: break-all;
        }

        .call-timer {
          font-size: 24px;
          font-family: var(--mono);
          color: var(--green);
        }

        .call-status {
          font-size: 13px;
          color: var(--text2);
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
        }

        .dialpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .dial-button {
          aspect-ratio: 1;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .dial-button:hover {
          background: var(--surface3);
          border-color: var(--accent);
        }

        .dial-button:active {
          transform: scale(0.95);
        }

        .dial-button-sub {
          font-size: 11px;
          color: var(--text2);
          margin-top: 4px;
        }

        .call-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .call-button {
          flex: 1;
          padding: 14px;
          border: 1px solid var(--border);
          background: var(--surface2);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .call-button:hover {
          border-color: var(--accent);
          background: var(--surface3);
        }

        .call-button.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .call-button.primary:hover {
          background: var(--accent2);
          border-color: var(--accent2);
        }

        .call-button.danger {
          background: var(--red);
          border-color: var(--red);
          color: white;
        }

        .call-button.danger:hover {
          background: #dc2626;
        }

        .incoming-call-box {
          background: linear-gradient(135deg, var(--surface2), var(--surface3));
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px 24px;
          margin-bottom: 20px;
          text-align: center;
        }

        .incoming-call-number {
          font-size: 28px;
          font-family: var(--mono);
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--accent);
        }

        .incoming-call-label {
          font-size: 14px;
          color: var(--text2);
          margin-bottom: 24px;
        }

        .incoming-call-actions {
          display: flex;
          gap: 12px;
        }

        .incoming-call-actions button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .accept-btn {
          background: var(--green);
          color: white;
        }

        .accept-btn:hover {
          background: #16a34a;
        }

        .reject-btn {
          background: var(--red);
          color: white;
        }

        .reject-btn:hover {
          background: #dc2626;
        }

        .logs-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .logs-filter {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 12px;
          color: var(--text2);
          font-weight: 500;
          text-transform: uppercase;
        }

        .filter-group input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 12px;
          color: var(--text);
          font-size: 13px;
        }

        .filter-group input::placeholder {
          color: var(--text3);
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .logs-table th {
          background: var(--surface2);
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text2);
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
        }

        .logs-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .logs-table tr:last-child td {
          border-bottom: none;
        }

        .call-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .incoming-badge {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .outgoing-badge {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .forwarding-config {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
        }

        .forwarding-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .forwarding-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .forwarding-toggle {
          margin-left: auto;
          width: 40px;
          height: 24px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .forwarding-toggle.enabled {
          background: var(--green);
          border-color: var(--green);
        }

        .forwarding-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 10px;
          transition: left 0.2s ease;
        }

        .forwarding-toggle.enabled::after {
          left: 18px;
        }

        .forwarding-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .forwarding-input-group label {
          font-size: 12px;
          color: var(--text2);
          font-weight: 500;
          text-transform: uppercase;
        }

        .forwarding-input-group input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
          font-family: var(--mono);
        }

        .forwarding-input-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .forwarding-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .forwarding-message.success {
          background: rgba(34, 197, 94, 0.1);
          border-color: var(--green);
          color: var(--green);
        }

        .save-button {
          width: 100%;
          padding: 10px;
          background: var(--accent);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .save-button:hover {
          background: var(--accent2);
        }

        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .dashboard-root {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            height: 60px;
            flex-direction: row;
            padding: 0 16px;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }

          .sidebar-logout {
            margin-top: 0;
            margin-left: auto;
          }

          .dashboard-content {
            padding: 16px;
          }

          .logs-filter {
            grid-template-columns: 1fr;
          }

          .phone-display {
            font-size: 24px;
          }

          .dialpad {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
      `}</style>

      <div className="dashboard-root">
        <div className="dashboard-sidebar">
          <button
            className={`sidebar-tab ${activeTab === 'dialer' ? 'active' : ''}`}
            onClick={() => setActiveTab('dialer')}
            title="Dialer"
          >
            <Phone size={20} />
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'call-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('call-logs')}
            title="Call Logs"
          >
            <Radio size={20} />
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming')}
            title="Incoming Calls"
          >
            <PhoneIncoming size={20} />
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'recordings' ? 'active' : ''}`}
            onClick={() => setActiveTab('recordings')}
            title="Recordings"
          >
            <Radio size={20} />
          </button>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-header">
            <h1>SalesDialpad</h1>
            <div className="dashboard-header-status">
              <StatusDot status={callStatus} />
              <span>{callStatus}</span>
            </div>
          </div>

          <div className="dashboard-content">
            {/* Dialer Tab */}
            <div className={`tab-pane ${activeTab === 'dialer' ? 'active' : ''}`}>
              <div className="dialer-section">
                <div className="phone-display">
                  {isCallActive ? (
                    <div className="call-timer">{formatDuration(callDuration)}</div>
                  ) : (
                    phoneNumber || '0'
                  )}
                </div>

                <div className="call-status">
                  {isCallActive && (
                    <>
                      <span>Call in progress</span>
                      <span style={{ fontSize: '10px' }}>({formatDuration(callDuration)})</span>
                    </>
                  )}
                </div>

                {!isCallActive && !incomingCall && (
                  <>
                    <div className="dialpad">
                      {dialpadNumbers.map((row, i) => (
                        <div key={i} style={{ display: 'contents' }}>
                          {row.map(btn => (
                            <button
                              key={btn.key}
                              className="dial-button"
                              onClick={() => handleNumberClick(btn.key)}
                            >
                              <span>{btn.key}</span>
                              {btn.sub && <span className="dial-button-sub">{btn.sub}</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>

                    <button
                      className="dial-button"
                      onClick={handleBackspace}
                      style={{ gridColumn: '2 / 3' }}
                    >
                      ← Backspace
                    </button>

                    <div className="call-controls">
                      <button
                        className="call-button primary"
                        onClick={handleDial}
                        disabled={!phoneNumber.trim()}
                      >
                        <Phone size={16} />
                        Call
                      </button>
                    </div>
                  </>
                )}

                {isCallActive && (
                  <div className="call-controls">
                    <button
                      className="call-button"
                      onClick={handleMute}
                      style={{
                        background: isMuted ? 'var(--red)' : 'var(--surface2)',
                        borderColor: isMuted ? 'var(--red)' : 'var(--border)',
                        color: isMuted ? 'white' : 'var(--text)',
                      }}
                    >
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                      className="call-button"
                      onClick={handleSpeaker}
                      style={{
                        background: isSpeakerOn ? 'var(--accent)' : 'var(--surface2)',
                        borderColor: isSpeakerOn ? 'var(--accent)' : 'var(--border)',
                        color: isSpeakerOn ? 'white' : 'var(--text)',
                      }}
                    >
                      {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      Speaker
                    </button>
                    <button
                      className="call-button"
                      onClick={handleRecord}
                      style={{
                        background: isRecording ? 'var(--red)' : 'var(--surface2)',
                        borderColor: isRecording ? 'var(--red)' : 'var(--border)',
                        color: isRecording ? 'white' : 'var(--text)',
                      }}
                    >
                      <Radio size={16} />
                      {isRecording ? 'Recording' : 'Record'}
                    </button>
                    <button
                      className="call-button danger"
                      onClick={handleHangup}
                    >
                      <PhoneOff size={16} />
                      End
                    </button>
                  </div>
                )}

                {incomingCall && !isCallActive && (
                  <div className="incoming-call-box">
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                      Incoming Call
                    </div>
                    <div className="incoming-call-number">{incomingNumber}</div>
                    <div className="incoming-call-label">You have an incoming call</div>
                    <div className="incoming-call-actions">
                      <button className="accept-btn" onClick={handleAccept}>
                        <Phone size={16} />
                        Accept
                      </button>
                      <button className="reject-btn" onClick={handleReject}>
                        <PhoneOff size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Logs Tab */}
            <div className={`tab-pane ${activeTab === 'call-logs' ? 'active' : ''}`}>
              <div className="logs-section">
                <div className="logs-filter">
                  <div className="filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Search Number</label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                    />
                  </div>
                  <button
                    className="call-button primary"
                    onClick={fetchCallLogs}
                    disabled={isSearching}
                  >
                    {isSearching ? <Loader2 size={16} /> : <Search size={16} />}
                    {isSearching ? 'Loading' : 'Search'}
                  </button>
                </div>

                {calls.length > 0 ? (
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Number</th>
                        <th>Duration</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map(call => (
                        <tr key={call.sid}>
                          <td>
                            <span className={`call-type-badge ${call.direction === 'incoming' ? 'incoming-badge' : 'outgoing-badge'}`}>
                              {call.direction === 'incoming' ? (
                                <>
                                  <PhoneIncoming size={14} />
                                  Incoming
                                </>
                              ) : (
                                <>
                                  <PhoneOutgoing size={14} />
                                  Outgoing
                                </>
                              )}
                            </span>
                          </td>
                          <td>{call.direction === 'incoming' ? call.from : call.to}</td>
                          <td>{formatDuration(call.duration)}</td>
                          <td>{new Date(call.dateCreated).toLocaleString()}</td>
                          <td style={{ textTransform: 'capitalize' }}>{call.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text2)',
                    fontSize: '13px'
                  }}>
                    No call logs found. Search to retrieve call history.
                  </div>
                )}
              </div>
            </div>

            {/* Incoming Calls Tab */}
            <div className={`tab-pane ${activeTab === 'incoming' ? 'active' : ''}`}>
              <div className="logs-section">
                <div className="forwarding-config">
                  <div className="forwarding-header">
                    <h3>Call Forwarding Settings</h3>
                    <button
                      className={`forwarding-toggle ${forwardingEnabled ? 'enabled' : ''}`}
                      onClick={() => setForwardingEnabled(!forwardingEnabled)}
                      title={forwardingEnabled ? 'Disable call forwarding' : 'Enable call forwarding'}
                    />
                  </div>

                  <div className="forwarding-input-group">
                    <label>Forwarding Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      value={forwardingNumber}
                      onChange={(e) => setForwardingNumber(e.target.value)}
                      disabled={!forwardingEnabled}
                    />
                  </div>

                  {forwardingMessage && (
                    <div className="forwarding-message success">
                      <CheckCircle size={16} />
                      {forwardingMessage}
                    </div>
                  )}

                  <button
                    className="save-button"
                    onClick={saveForwardingConfig}
                    disabled={isSavingForwarding || !forwardingNumber.trim()}
                  >
                    {isSavingForwarding ? 'Saving...' : 'Save Configuration'}
                  </button>

                  <div style={{ marginTop: '20px', padding: '12px', background: 'var(--surface2)', borderRadius: '6px', fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5' }}>
                    <strong style={{ color: 'var(--text)' }}>How it works:</strong><br />
                    When call forwarding is enabled, all incoming calls will be automatically forwarded to the phone number you specify. This allows you to receive calls on a different device.
                  </div>
                </div>
              </div>
            </div>

            {/* Recordings Tab */}
            <div className={`tab-pane ${activeTab === 'recordings' ? 'active' : ''}`}>
              <div className="logs-section">
                <div className="logs-filter">
                  <div className="filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={recordingStartDate}
                      onChange={(e) => setRecordingStartDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={recordingEndDate}
                      onChange={(e) => setRecordingEndDate(e.target.value)}
                    />
                  </div>
                  <div style={{ height: '100%' }} />
                  <button
                    className="call-button primary"
                    onClick={fetchRecordings}
                    disabled={isLoadingRecordings}
                  >
                    {isLoadingRecordings ? <Loader2 size={16} /> : <Search size={16} />}
                    {isLoadingRecordings ? 'Loading' : 'Search'}
                  </button>
                </div>

                {recordings.length > 0 ? (
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Recording ID</th>
                        <th>Duration</th>
                        <th>Date Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordings.map(recording => (
                        <tr key={recording.sid}>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
                            {recording.sid.substring(0, 16)}...
                          </td>
                          <td>{formatDuration(recording.duration)}</td>
                          <td>{new Date(recording.dateCreated).toLocaleString()}</td>
                          <td>
                            <a
                              href={`/api/recording/${recording.sid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              Play
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text2)',
                    fontSize: '13px'
                  }}>
                    No recordings found. Search to retrieve recording history.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
