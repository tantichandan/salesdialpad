'use client';

import { useState, useRef, useEffect } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Plus, MessageSquare, Radio, ChevronLeft, Delete,
  PhoneIncoming, PhoneMissed, PhoneOutgoing
} from 'lucide-react';

interface CallLog {
  id: string;
  number: string;
  type: 'incoming' | 'outgoing';
  duration: number;
  timestamp: Date;
}

interface Message {
  id: string;
  number: string;
  text: string;
  isSent: boolean;
  timestamp: Date;
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

export default function DialpadPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [callStatus, setCallStatus] = useState('Ready');
  const [callDuration, setCallDuration] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'calls' | 'messages'>('calls');
  const [recordings, setRecordings] = useState<any[]>([]);
  const [twilioCalls, setTwilioCalls] = useState<any[]>([]);
  const [twilioMessages, setTwilioMessages] = useState<any[]>([]);

  const deviceRef = useRef<Device | null>(null);
  const activeConnectionRef = useRef<Call | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneNumberRef = useRef(phoneNumber);
  const callDurationRef = useRef(callDuration);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => { phoneNumberRef.current = phoneNumber; }, [phoneNumber]);
  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);

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
        device.on('error', (error) => { console.error('Twilio Device Error:', error); if (isMounted) setCallStatus(`Error: ${error.message}`); });

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
          const currentDuration = callDurationRef.current;
          if (currentNumber) {
            setCallLogs(prev => [{ id: Date.now().toString(), number: currentNumber, type: 'outgoing', duration: currentDuration, timestamp: new Date() }, ...prev]);
          }
          setPhoneNumber('');
          activeConnectionRef.current = null;
        });

        device.on('incoming', (call: Call) => {
          if (!isMounted) return;
          setIncomingCall(call);
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

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await fetch('/api/recording');
        if (!response.ok) throw new Error('Failed to fetch recordings');
        const data = await response.json();
        setRecordings(data);
      } catch (error) { console.error('Recording fetch error:', error); }
    };
    fetchRecordings();
  }, []);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls');
        if (!response.ok) throw new Error('Failed to fetch calls');
        const data = await response.json();
        setTwilioCalls(data);
      } catch (error) { console.error('Call fetch error:', error); }
    };
    fetchCalls();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('/api/message');
      const data = await res.json();
      setTwilioMessages(data);
    };
    fetchMessages();
  }, []);

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
      await fetch('/api/recording', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, callSid }) });
      setIsRecording(!isRecording);
    } catch { }
  };

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
    });
  };

  const handleReject = () => {
    if (!incomingCall) return;
    incomingCall.reject();
    setIncomingCall(null);
    setCallStatus('Ready');
    activeConnectionRef.current = null;
  };

  const handleNumberClick = (num: string) => { if (!isCallActive) setPhoneNumber(phoneNumber + num); };
  const handleBackspace = () => { setPhoneNumber(phoneNumber.slice(0, -1)); };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact) return;
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedContact, body: messageInput }),
      });
      const newMessage = await res.json();
      setTwilioMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
    } catch (error) { console.error(error); }
  };

  const handleAddContact = (number: string) => { setPhoneNumber(number); setShowPlusMenu(false); };

  const dialpadNumbers = [
    [{ key: '1', sub: '' }, { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' }],
    [{ key: '4', sub: 'GHI' }, { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' }],
    [{ key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' }],
    [{ key: '*', sub: '' }, { key: '0', sub: '+' }, { key: '#', sub: '' }],
  ];

  const uniqueContacts = Array.from(
    new Set([...twilioMessages.map(msg => msg.from), ...twilioMessages.map(msg => msg.to)])
  ).filter((num) => num !== process.env.NEXT_PUBLIC_TWILIO_NUMBER);

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
          --purple: #a78bfa;
          --mono: 'DM Mono', monospace;
          --sans: 'DM Sans', sans-serif;
        }

        body { background: var(--bg); }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes ring {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .vl-root {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--sans);
          color: var(--text);
          padding: 24px 20px 48px;
        }

        .vl-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .vl-logo {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), #6366f1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .vl-title { font-size: 22px; font-weight: 600; letter-spacing: -0.4px; }
        .vl-subtitle { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }

        .vl-grid {
          max-width: 1040px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 16px;
        }

        @media (max-width: 780px) {
          .vl-grid { grid-template-columns: 1fr; }
        }

        /* ── LEFT PANEL ── */
        .vl-left { display: flex; flex-direction: column; gap: 12px; }

        .vl-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
        }

        /* Status pill */
        .vl-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 500;
          font-family: var(--mono);
          letter-spacing: 0.02em;
          border: 1px solid;
          transition: all 0.3s;
        }
        .vl-status.ready    { background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.25);  color: #4ade80; }
        .vl-status.connected{ background: rgba(79,142,247,0.1);  border-color: rgba(79,142,247,0.3);  color: #93c5fd; }
        .vl-status.calling  { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); color: #fbbf24; }
        .vl-status.incoming { background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.3);   color: #4ade80; }
        .vl-status.error    { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.25);  color: #fca5a5; }
        .vl-status.init     { background: rgba(90,95,110,0.15);  border-color: rgba(90,95,110,0.3);   color: var(--text2); }

        .vl-status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .vl-status.ready .vl-status-dot    { background: #22c55e; box-shadow: 0 0 5px #22c55e; }
        .vl-status.connected .vl-status-dot{ background: var(--accent); box-shadow: 0 0 5px var(--accent); animation: pulse-dot 1.5s infinite; }
        .vl-status.calling .vl-status-dot  { background: var(--amber); box-shadow: 0 0 5px var(--amber); animation: pulse-dot 0.8s infinite; }
        .vl-status.incoming .vl-status-dot { background: #22c55e; box-shadow: 0 0 5px #22c55e; animation: pulse-dot 0.6s infinite; }
        .vl-status.error .vl-status-dot    { background: var(--red); }
        .vl-status.init .vl-status-dot     { background: var(--text3); }

        /* Number input */
        .vl-number-wrap {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 12px;
          padding: 4px 12px 10px;
          margin: 12px 0;
        }
        .vl-number-label {
          font-size: 10px;
          font-family: var(--mono);
          color: var(--text3);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          padding-top: 8px;
          margin-bottom: 2px;
        }
        .vl-number-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--mono);
          font-size: 26px;
          font-weight: 400;
          color: var(--text);
          letter-spacing: 2px;
          padding: 0;
        }
        .vl-number-input::placeholder { color: var(--text3); font-size: 16px; letter-spacing: 0; }
        .vl-number-input:disabled { opacity: 0.5; }

        /* Duration badge */
        .vl-duration {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--green);
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 8px;
          padding: 6px 12px;
          text-align: center;
          letter-spacing: 2px;
        }

        /* Dialpad grid */
        .vl-dialpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 4px 0;
        }
        .vl-key {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          height: 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s, transform 0.08s;
          user-select: none;
          gap: 1px;
        }
        .vl-key:hover:not(:disabled) { background: var(--surface3); border-color: var(--border2); }
        .vl-key:active:not(:disabled) { transform: scale(0.94); background: var(--accent2); }
        .vl-key:disabled { opacity: 0.35; cursor: not-allowed; }
        .vl-key-num { font-size: 18px; font-weight: 500; font-family: var(--mono); color: var(--text); line-height: 1; }
        .vl-key-sub { font-size: 9px; font-family: var(--mono); color: var(--text3); letter-spacing: 0.1em; line-height: 1; }

        /* Utility row */
        .vl-util-row { display: flex; gap: 8px; margin-top: 4px; align-items: stretch; }
        .vl-util-btn {
          flex: 1;
          height: 40px;
          border-radius: 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text2);
          font-size: 13px;
          font-family: var(--sans);
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .vl-util-btn:hover:not(:disabled) { background: var(--surface3); border-color: var(--border2); color: var(--text); }
        .vl-util-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Plus dropdown */
        .vl-plus-wrap { position: relative; flex-shrink: 0; }
        .vl-plus-btn {
          width: 40px; height: 40px;
          border-radius: 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.12s;
        }
        .vl-plus-btn:hover { background: var(--surface3); border-color: var(--border2); color: var(--text); }
        .vl-dropdown {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 8px;
          min-width: 180px;
          z-index: 20;
          animation: fadeSlide 0.15s ease;
        }
        .vl-dropdown-label { font-size: 10px; color: var(--text3); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 6px 8px; display: block; }
        .vl-dropdown-item {
          display: block;
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 13px;
          font-family: var(--mono);
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .vl-dropdown-item:hover { background: var(--surface3); }

        /* Call action row */
        .vl-action-row { display: flex; gap: 8px; margin-top: 4px; }

        .vl-btn-call {
          flex: 1; height: 52px; border-radius: 12px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none; color: #fff;
          font-size: 14px; font-weight: 600; font-family: var(--sans);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 4px 20px rgba(34,197,94,0.25);
        }
        .vl-btn-call:hover:not(:disabled) { opacity: 0.92; }
        .vl-btn-call:active:not(:disabled) { transform: scale(0.97); }
        .vl-btn-call:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

        .vl-btn-hangup {
          flex: 1; height: 52px; border-radius: 12px;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: none; color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 4px 20px rgba(239,68,68,0.25);
        }
        .vl-btn-hangup:hover { opacity: 0.9; }
        .vl-btn-hangup:active { transform: scale(0.97); }

        .vl-ctrl-btn {
          flex: 1; height: 44px; border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
          font-size: 13px; gap: 5px;
        }
        .vl-ctrl-btn:hover { background: var(--surface3); border-color: var(--border2); color: var(--text); }
        .vl-ctrl-btn.active-red   { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.4); color: #fca5a5; }
        .vl-ctrl-btn.active-blue  { background: rgba(79,142,247,0.12); border-color: rgba(79,142,247,0.4); color: #93c5fd; }
        .vl-ctrl-btn.active-amber { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.4); color: #fcd34d; }

        /* Incoming */
        .vl-incoming {
          background: rgba(34,197,94,0.06);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fadeSlide 0.2s ease;
        }
        .vl-incoming-icon {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(34,197,94,0.15);
          display: flex; align-items: center; justify-content: center;
          animation: ring 0.4s ease-in-out infinite alternate;
          flex-shrink: 0;
        }
        .vl-incoming-text { flex: 1; }
        .vl-incoming-label { font-size: 11px; color: var(--text3); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em; }
        .vl-incoming-num { font-size: 14px; font-weight: 600; margin-top: 2px; color: var(--text); }
        .vl-btn-accept {
          padding: 8px 16px; border-radius: 8px;
          background: #22c55e; border: none; color: #fff;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: opacity 0.15s;
        }
        .vl-btn-accept:hover { opacity: 0.88; }
        .vl-btn-reject {
          padding: 8px 14px; border-radius: 8px;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; font-size: 13px; cursor: pointer;
          transition: background 0.15s;
        }
        .vl-btn-reject:hover { background: rgba(239,68,68,0.2); }

        /* Message this number btn */
        .vl-msg-btn {
          width: 100%; height: 40px; border-radius: 10px;
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.25);
          color: var(--purple);
          font-size: 13px; font-weight: 500; font-family: var(--sans);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background 0.15s, border-color 0.15s;
        }
        .vl-msg-btn:hover { background: rgba(167,139,250,0.16); border-color: rgba(167,139,250,0.4); }

        /* ── RIGHT PANEL ── */
        .vl-right {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          min-height: 520px;
          overflow: hidden;
        }

        .vl-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          padding: 0 20px;
          flex-shrink: 0;
        }
        .vl-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 4px;
          margin-right: 24px;
          border: none; background: transparent;
          font-size: 13.5px; font-weight: 500;
          color: var(--text3);
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .vl-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .vl-tab:hover:not(.active) { color: var(--text2); }

        .vl-panel { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; }

        /* Call log items */
        .vl-call-item {
          display: flex; align-items: center;
          padding: 12px 14px;
          border-radius: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          margin-bottom: 8px;
          transition: border-color 0.12s;
          animation: fadeSlide 0.2s ease;
        }
        .vl-call-item:hover { border-color: var(--border2); }
        .vl-call-icon {
          width: 34px; height: 34px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-right: 12px;
        }
        .vl-call-icon.out { background: rgba(79,142,247,0.1); color: var(--accent); }
        .vl-call-icon.in  { background: rgba(34,197,94,0.1);  color: #4ade80; }
        .vl-call-icon.miss{ background: rgba(239,68,68,0.1);  color: #fca5a5; }
        .vl-call-num { font-size: 14px; font-weight: 500; font-family: var(--mono); }
        .vl-call-status { font-size: 11px; color: var(--text3); margin-top: 3px; }
        .vl-call-meta { margin-left: auto; text-align: right; }
        .vl-call-dur { font-size: 12px; font-family: var(--mono); color: var(--text2); }
        .vl-call-dir { font-size: 11px; color: var(--text3); margin-top: 3px; }

        /* Empty state */
        .vl-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: var(--text3); gap: 10px;
          padding: 40px;
          text-align: center;
        }
        .vl-empty-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--surface2); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
        .vl-empty-text { font-size: 13px; }

        /* Contact list */
        .vl-contact {
          padding: 12px 14px;
          border-radius: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          margin-bottom: 8px;
          cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          transition: border-color 0.12s, background 0.12s;
        }
        .vl-contact:hover { background: var(--surface3); border-color: var(--border2); }
        .vl-contact-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--surface3);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-family: var(--mono); color: var(--text2);
          flex-shrink: 0;
        }
        .vl-contact-num { font-size: 13.5px; font-weight: 500; font-family: var(--mono); }

        /* Chat thread */
        .vl-chat { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
        .vl-bubble-row { display: flex; }
        .vl-bubble-row.sent { justify-content: flex-end; }
        .vl-bubble {
          max-width: 72%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.5;
          animation: fadeSlide 0.2s ease;
        }
        .vl-bubble.sent {
          background: var(--accent2);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .vl-bubble.recv {
          background: var(--surface3);
          color: var(--text);
          border-bottom-left-radius: 4px;
        }
        .vl-bubble-time { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 5px; font-family: var(--mono); }
        .vl-bubble.recv .vl-bubble-time { color: var(--text3); }

        /* Chat input */
        .vl-chat-input-row { display: flex; gap: 8px; flex-shrink: 0; }
        .vl-chat-input {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text);
          font-size: 13.5px;
          font-family: var(--sans);
          outline: none;
          transition: border-color 0.15s;
        }
        .vl-chat-input:focus { border-color: var(--accent); }
        .vl-chat-input::placeholder { color: var(--text3); }
        .vl-send-btn {
          padding: 0 18px; border-radius: 10px;
          background: var(--accent); border: none; color: #fff;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
        }
        .vl-send-btn:hover:not(:disabled) { background: var(--accent2); }
        .vl-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Back btn */
        .vl-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px 6px 8px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text2);
          font-size: 12.5px;
          cursor: pointer;
          margin-bottom: 14px;
          transition: background 0.12s, color 0.12s;
        }
        .vl-back-btn:hover { background: var(--surface2); color: var(--text); }

        /* Divider */
        .vl-section-label {
          font-size: 10px; font-family: var(--mono);
          color: var(--text3); text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
        }

        /* Recordings panel */
        .vl-rec-section { max-width: 1040px; margin: 16px auto 0; }
        .vl-rec-title { font-size: 16px; font-weight: 600; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .vl-rec-title-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 6px var(--red); }
        .vl-rec-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 10px;
        }
        .vl-rec-meta { font-size: 11.5px; color: var(--text3); font-family: var(--mono); margin-bottom: 8px; }
        audio { width: 100%; height: 36px; filter: invert(0.85) hue-rotate(180deg); }

        /* Ctrl row when call active */
        .vl-ctrl-row { display: flex; gap: 7px; margin-top: 6px; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 999px; }
      `}</style>

      <div className="vl-root">
        {/* Header */}
        <div className="vl-header">
          <div className="vl-logo">
            <Phone size={18} color="#fff" />
          </div>
          <div>
            <div className="vl-title">VoiceLink</div>
            <div className="vl-subtitle">Professional Communication Hub</div>
          </div>
        </div>

        <div className="vl-grid">
          {/* ── LEFT: DIALPAD ── */}
          <div className="vl-left">
            {/* Incoming call banner */}
            {incomingCall && (
              <div className="vl-incoming">
                <div className="vl-incoming-icon">
                  <Phone size={16} color="#22c55e" />
                </div>
                <div className="vl-incoming-text">
                  <div className="vl-incoming-label">Incoming Call</div>
                  <div className="vl-incoming-num">Unknown</div>
                </div>
                <button className="vl-btn-accept" onClick={handleAccept}>Accept</button>
                <button className="vl-btn-reject" onClick={handleReject}>Decline</button>
              </div>
            )}

            <div className="vl-card">
              {/* Status */}
              <div className={`vl-status ${
                callStatus === 'Ready' ? 'ready' :
                callStatus === 'Connected' ? 'connected' :
                callStatus === 'Calling...' ? 'calling' :
                callStatus === 'Incoming call...' ? 'incoming' :
                callStatus.startsWith('Error') || callStatus.startsWith('Init failed') ? 'error' :
                'init'
              }`}>
                <span className="vl-status-dot" />
                {callStatus}
              </div>

              {/* Number display */}
              <div className="vl-number-wrap">
                <span className="vl-number-label">Phone Number</span>
                <input
                  type="tel"
                  className="vl-number-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555 000 0000"
                  maxLength={20}
                  disabled={isCallActive}
                />
              </div>

              {/* Duration */}
              {isCallActive && (
                <div className="vl-duration">{formatDuration(callDuration)}</div>
              )}

              {/* Dialpad */}
              {!isCallActive && (
                <div className="vl-dialpad">
                  {dialpadNumbers.map((row, ri) =>
                    row.map(({ key, sub }) => (
                      <button
                        key={key}
                        className="vl-key"
                        onClick={() => handleNumberClick(key)}
                        disabled={isCallActive}
                      >
                        <span className="vl-key-num">{key}</span>
                        {sub && <span className="vl-key-sub">{sub}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Call controls when active */}
              {isCallActive && (
                <div className="vl-ctrl-row">
                  <button
                    className={`vl-ctrl-btn ${isMuted ? 'active-red' : ''}`}
                    onClick={handleMute}
                    title="Mute"
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button
                    className={`vl-ctrl-btn ${isRecording ? 'active-amber' : ''}`}
                    onClick={handleRecord}
                    title="Record"
                  >
                    <Radio size={16} />
                  </button>
                  <button
                    className={`vl-ctrl-btn ${!isSpeakerOn ? 'active-blue' : ''}`}
                    onClick={handleSpeaker}
                    title="Speaker"
                  >
                    {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>
              )}

              {/* Utility row */}
              {!isCallActive && (
                <div className="vl-util-row">
                  <button
                    className="vl-util-btn"
                    onClick={handleBackspace}
                    disabled={phoneNumber.length === 0}
                  >
                    <Delete size={14} /> Backspace
                  </button>
                  <div className="vl-plus-wrap">
                    <button className="vl-plus-btn" onClick={() => setShowPlusMenu(!showPlusMenu)}>
                      <Plus size={16} />
                    </button>
                    {showPlusMenu && (
                      <div className="vl-dropdown">
                        <span className="vl-dropdown-label">Recent</span>
                        {uniqueContacts.slice(0, 3).map(contact => (
                          <button key={contact} className="vl-dropdown-item" onClick={() => handleAddContact(contact)}>
                            {contact}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main call action */}
              <div className="vl-action-row" style={{ marginTop: 10 }}>
                {!incomingCall && !isCallActive ? (
                  <button
                    className="vl-btn-call"
                    onClick={handleDial}
                    disabled={!phoneNumber.trim()}
                  >
                    <Phone size={16} />
                    Call
                  </button>
                ) : isCallActive ? (
                  <button className="vl-btn-hangup" onClick={handleHangup}>
                    <PhoneOff size={18} />
                  </button>
                ) : null}
              </div>

              {/* Message this number */}
              <div style={{ marginTop: 10 }}>
                <button
                  className="vl-msg-btn"
                  onClick={() => {
                    if (!phoneNumber.trim()) return;
                    setSelectedContact(phoneNumber.trim());
                    setActiveTab('messages');
                  }}
                >
                  <MessageSquare size={14} />
                  Message This Number
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: LOGS + MESSAGES ── */}
          <div className="vl-right">
            <div className="vl-tabs">
              <button
                className={`vl-tab ${activeTab === 'calls' ? 'active' : ''}`}
                onClick={() => { setActiveTab('calls'); setSelectedContact(null); }}
              >
                <Phone size={14} />
                Recent Calls
              </button>
              <button
                className={`vl-tab ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => { setActiveTab('messages'); setSelectedContact(null); }}
              >
                <MessageSquare size={14} />
                Messages
              </button>
            </div>

            {/* Calls panel */}
            {activeTab === 'calls' && (
              <div className="vl-panel">
                {twilioCalls.length === 0 ? (
                  <div className="vl-empty">
                    <div className="vl-empty-icon"><Phone size={20} /></div>
                    <div className="vl-empty-text">No call history yet</div>
                  </div>
                ) : (
                  twilioCalls.map((call) => {
                    const isOutbound = call.direction?.includes('outbound');
                    const number = isOutbound ? call.to : call.from;
                    return (
                      <div key={call.sid} className="vl-call-item">
                        <div className={`vl-call-icon ${isOutbound ? 'out' : call.status === 'no-answer' ? 'miss' : 'in'}`}>
                          {isOutbound
                            ? <PhoneOutgoing size={14} />
                            : call.status === 'no-answer'
                              ? <PhoneMissed size={14} />
                              : <PhoneIncoming size={14} />
                          }
                        </div>
                        <div>
                          <div className="vl-call-num">{number}</div>
                          <div className="vl-call-status">{call.status}</div>
                        </div>
                        <div className="vl-call-meta">
                          <div className="vl-call-dur">{call.duration || 0}s</div>
                          <div className="vl-call-dir">{isOutbound ? 'Outbound' : 'Inbound'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Messages panel */}
            {activeTab === 'messages' && (
              <div className="vl-panel">
                {!selectedContact ? (
                  <>
                    <div className="vl-section-label">Contacts</div>
                    {uniqueContacts.length === 0 ? (
                      <div className="vl-empty">
                        <div className="vl-empty-icon"><MessageSquare size={20} /></div>
                        <div className="vl-empty-text">No messages yet</div>
                      </div>
                    ) : (
                      uniqueContacts.map((contact) => (
                        <div key={contact} className="vl-contact" onClick={() => setSelectedContact(contact)}>
                          <div className="vl-contact-avatar">{contact.slice(-2)}</div>
                          <div className="vl-contact-num">{contact}</div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <button className="vl-back-btn" onClick={() => setSelectedContact(null)}>
                      <ChevronLeft size={14} /> Back
                    </button>
                    <div className="vl-section-label">{selectedContact}</div>
                    <div className="vl-chat">
                      {twilioMessages
                        .filter(msg => msg.from === selectedContact || msg.to === selectedContact)
                        .sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime())
                        .map((msg) => {
                          const sent = msg.direction?.includes('outbound');
                          return (
                            <div key={msg.sid} className={`vl-bubble-row ${sent ? 'sent' : ''}`}>
                              <div className={`vl-bubble ${sent ? 'sent' : 'recv'}`}>
                                <div>{msg.body}</div>
                                <div className="vl-bubble-time">
                                  {new Date(msg.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="vl-chat-input-row">
                      <input
                        type="text"
                        className="vl-chat-input"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                      />
                      <button
                        className="vl-send-btn"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recordings */}
        <div className="vl-rec-section">
          <div className="vl-rec-title">
            <span className="vl-rec-title-dot" />
            Recordings
          </div>
          {recordings.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>No recordings found.</p>
          ) : (
            recordings.map((rec) => (
              <div key={rec.sid} className="vl-rec-card">
                <div className="vl-rec-meta">Duration: {rec.duration}s · {rec.sid}</div>
                <audio controls src={`/api/recording/stream/${rec.sid}`} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}