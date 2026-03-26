import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone01, PhoneHangUp, Microphone01, MicrophoneOff01, VolumeMax, VolumeX, X, Minimize02, Clock, ChevronUp, User01, PhoneIncoming01, Pause, Play } from '@untitledui/icons';
import { TelnyxRTC } from '@telnyx/webrtc';

const API_BASE = 'https://project-origin-production-1216.up.railway.app';

// Types
type CallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'held' | 'ended';
type CallDirection = 'inbound' | 'outbound';

interface ActiveCall {
  id: string;
  status: CallStatus;
  direction: CallDirection;
  remoteNumber: string;
  remoteName?: string;
  startTime: number;
  telnyxCall?: any;
}

interface RecentCall {
  id: string;
  number: string;
  name?: string;
  direction: CallDirection;
  duration: number;
  timestamp: number;
  recording_url?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

// Dialpad Button
function DialButton({ digit, letters, onClick }: { digit: string; letters?: string; onClick: (d: string) => void }) {
  return (
    <button
      onClick={() => onClick(digit)}
      className="flex flex-col items-center justify-center size-14 rounded-full bg-secondary_alt hover:bg-secondary active:bg-tertiary transition-colors"
    >
      <span className="text-lg font-semibold text-primary">{digit}</span>
      {letters && <span className="text-[9px] text-quaternary tracking-wider">{letters}</span>}
    </button>
  );
}

// Main Softphone Component
export function Softphone({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'dialpad' | 'recents'>('dialpad');
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(false);
  
  // Telnyx WebRTC client
  const clientRef = useRef<TelnyxRTC | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize Telnyx WebRTC client
  useEffect(() => {
    let mounted = true;
    
    const initClient = async () => {
      try {
        // Fetch WebRTC token from backend
        const res = await fetch(`${API_BASE}/api/telnyx/webrtc-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) {
          throw new Error('Failed to get WebRTC token');
        }
        
        const { token } = await res.json();
        
        if (!mounted) return;
        
        // Initialize Telnyx client
        const client = new TelnyxRTC({
          login_token: token,
        });
        
        client.on('telnyx.ready', () => {
          if (mounted) {
            setClientReady(true);
            setConnectionError(null);
          }
        });
        
        client.on('telnyx.error', (error: any) => {
          console.error('Telnyx error:', error);
          if (mounted) {
            setConnectionError(error.message || 'Connection error');
          }
        });
        
        client.on('telnyx.notification', (notification: any) => {
          if (!mounted) return;
          
          if (notification.type === 'callUpdate') {
            const call = notification.call;
            
            switch (call.state) {
              case 'new':
              case 'trying':
                if (call.direction === 'inbound') {
                  setActiveCall({
                    id: call.id,
                    status: 'ringing',
                    direction: 'inbound',
                    remoteNumber: call.remoteCallerNumber || 'Unknown',
                    remoteName: call.remoteCallerName,
                    startTime: Date.now(),
                    telnyxCall: call,
                  });
                }
                break;
              case 'early':
              case 'ringing':
                setActiveCall(prev => prev ? { ...prev, status: 'ringing', telnyxCall: call } : null);
                break;
              case 'active':
                setActiveCall(prev => prev ? { 
                  ...prev, 
                  status: 'active', 
                  startTime: prev.status !== 'active' ? Date.now() : prev.startTime,
                  telnyxCall: call 
                } : null);
                break;
              case 'held':
                setActiveCall(prev => prev ? { ...prev, status: 'held', telnyxCall: call } : null);
                break;
              case 'hangup':
              case 'destroy':
                setActiveCall(null);
                setCallDuration(0);
                setIsMuted(false);
                setIsHeld(false);
                // Refresh recent calls
                fetchRecentCalls();
                break;
            }
          }
        });
        
        await client.connect();
        clientRef.current = client;
        
      } catch (err: any) {
        console.error('Failed to initialize Telnyx:', err);
        if (mounted) {
          setConnectionError(err.message || 'Failed to connect');
        }
      }
    };
    
    initClient();
    
    return () => {
      mounted = false;
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  // Fetch recent calls
  const fetchRecentCalls = useCallback(async () => {
    setLoadingRecents(true);
    try {
      const res = await fetch(`${API_BASE}/api/reporting/calls?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setRecentCalls(data.map((call: any) => ({
          id: call.id,
          number: call.direction === 'inbound' ? call.from_number : call.to_number,
          direction: call.direction,
          duration: call.duration_seconds || 0,
          timestamp: new Date(call.created_at).getTime(),
          recording_url: call.recording_url,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch recent calls:', err);
    } finally {
      setLoadingRecents(false);
    }
  }, []);

  // Load recent calls on mount
  useEffect(() => {
    fetchRecentCalls();
  }, [fetchRecentCalls]);

  // Timer for active call
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCall?.status === 'active') {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleDial = useCallback((digit: string) => {
    if (!activeCall) {
      setDialedNumber(prev => prev + digit);
    } else if (activeCall.telnyxCall) {
      // Send DTMF during active call
      activeCall.telnyxCall.dtmf(digit);
    }
  }, [activeCall]);

  const handleBackspace = useCallback(() => {
    setDialedNumber(prev => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(async () => {
    if (!dialedNumber || !clientRef.current || !clientReady) return;
    
    try {
      // Get caller ID from backend
      const numbersRes = await fetch(`${API_BASE}/api/telnyx/phone-numbers`);
      const numbers = await numbersRes.json();
      const callerNumber = numbers[0]?.phone_number || '';
      
      const call = clientRef.current.newCall({
        destinationNumber: dialedNumber,
        callerNumber: callerNumber,
      });
      
      setActiveCall({
        id: call.id,
        status: 'connecting',
        direction: 'outbound',
        remoteNumber: dialedNumber,
        startTime: Date.now(),
        telnyxCall: call,
      });
      
    } catch (err) {
      console.error('Failed to initiate call:', err);
    }
  }, [dialedNumber, clientReady]);

  const handleAnswer = useCallback(() => {
    if (activeCall?.telnyxCall && activeCall.status === 'ringing' && activeCall.direction === 'inbound') {
      activeCall.telnyxCall.answer();
    }
  }, [activeCall]);

  const handleHangup = useCallback(() => {
    if (activeCall?.telnyxCall) {
      activeCall.telnyxCall.hangup();
    }
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsHeld(false);
  }, [activeCall]);

  const handleMute = useCallback(() => {
    if (activeCall?.telnyxCall) {
      if (isMuted) {
        activeCall.telnyxCall.unmuteAudio();
      } else {
        activeCall.telnyxCall.muteAudio();
      }
      setIsMuted(!isMuted);
    }
  }, [activeCall, isMuted]);

  const handleHold = useCallback(() => {
    if (activeCall?.telnyxCall) {
      if (isHeld) {
        activeCall.telnyxCall.unhold();
      } else {
        activeCall.telnyxCall.hold();
      }
      setIsHeld(!isHeld);
    }
  }, [activeCall, isHeld]);

  const handleCallRecent = useCallback((call: RecentCall) => {
    setDialedNumber(call.number);
    setView('dialpad');
  }, []);

  // Inbound ringing UI
  if (activeCall && activeCall.status === 'ringing' && activeCall.direction === 'inbound') {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-primary rounded-2xl shadow-2xl border border-secondary overflow-hidden z-50">
        <div className="bg-green-500 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <PhoneIncoming01 className="size-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Incoming Call</p>
                <p className="text-white/70 text-xs">{activeCall.remoteNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <Minimize02 className="size-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="size-16 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
              <User01 className="size-8 text-green-600" />
            </div>
            <p className="font-semibold text-primary">{activeCall.remoteName || activeCall.remoteNumber}</p>
            <p className="text-sm text-tertiary">Incoming call...</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleHangup}
              className="size-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            >
              <PhoneHangUp className="size-6" />
            </button>
            <button
              onClick={handleAnswer}
              className="size-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
            >
              <Phone01 className="size-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Call UI (connecting, ringing outbound, active, held)
  if (activeCall) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-primary rounded-2xl shadow-2xl border border-secondary overflow-hidden z-50">
        {/* Header */}
        <div className={`px-4 py-3 ${activeCall.status === 'held' ? 'bg-yellow-500' : 'bg-[#D34108]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <Phone01 className="size-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {activeCall.status === 'connecting' ? 'Connecting...' : 
                   activeCall.status === 'ringing' ? 'Ringing...' : 
                   activeCall.status === 'held' ? 'On Hold' :
                   formatDuration(callDuration)}
                </p>
                <p className="text-white/70 text-xs">{activeCall.remoteNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <Minimize02 className="size-4" />
            </button>
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="size-16 rounded-full bg-secondary_alt mx-auto mb-3 flex items-center justify-center">
              <User01 className="size-8 text-quaternary" />
            </div>
            <p className="font-semibold text-primary">{activeCall.remoteName || activeCall.remoteNumber}</p>
            <p className="text-sm text-tertiary capitalize">{activeCall.status === 'active' ? 'Connected' : activeCall.status}</p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={handleMute}
              className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-secondary_alt text-secondary hover:bg-secondary'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicrophoneOff01 className="size-5" /> : <Microphone01 className="size-5" />}
            </button>
            <button
              onClick={handleHold}
              className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                isHeld ? 'bg-yellow-100 text-yellow-600' : 'bg-secondary_alt text-secondary hover:bg-secondary'
              }`}
              title={isHeld ? 'Resume' : 'Hold'}
            >
              {isHeld ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
          </div>

          <button
            onClick={handleHangup}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneHangUp className="size-5" />
            End Call
          </button>
        </div>
      </div>
    );
  }

  // Dialpad / Recents UI
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-primary rounded-2xl shadow-2xl border border-secondary overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#FEF6F3] flex items-center justify-center">
            <Phone01 className="size-4 text-[#D34108]" />
          </div>
          <div>
            <span className="font-semibold text-primary text-sm">Softphone</span>
            {clientReady ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                <span className="size-1.5 rounded-full bg-green-500" />
                Ready
              </span>
            ) : connectionError ? (
              <span className="ml-2 text-xs text-red-500">{connectionError}</span>
            ) : (
              <span className="ml-2 text-xs text-tertiary">Connecting...</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-quaternary hover:text-secondary">
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary">
        <button
          onClick={() => setView('dialpad')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            view === 'dialpad' ? 'text-[#D34108] border-b-2 border-[#D34108] -mb-px' : 'text-tertiary hover:text-secondary'
          }`}
        >
          Dialpad
        </button>
        <button
          onClick={() => { setView('recents'); fetchRecentCalls(); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            view === 'recents' ? 'text-[#D34108] border-b-2 border-[#D34108] -mb-px' : 'text-tertiary hover:text-secondary'
          }`}
        >
          Recents
        </button>
      </div>

      {view === 'dialpad' ? (
        <div className="p-4">
          {/* Number Display */}
          <div className="h-14 flex items-center justify-between px-3 mb-4 bg-secondary_alt rounded-xl">
            <span className="text-xl font-mono text-primary tracking-wide">
              {dialedNumber || <span className="text-quaternary">Enter number...</span>}
            </span>
            {dialedNumber && (
              <button onClick={handleBackspace} className="text-quaternary hover:text-secondary p-1">
                <ChevronUp className="size-4 rotate-90" />
              </button>
            )}
          </div>

          {/* Dialpad Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <DialButton digit="1" onClick={handleDial} />
            <DialButton digit="2" letters="ABC" onClick={handleDial} />
            <DialButton digit="3" letters="DEF" onClick={handleDial} />
            <DialButton digit="4" letters="GHI" onClick={handleDial} />
            <DialButton digit="5" letters="JKL" onClick={handleDial} />
            <DialButton digit="6" letters="MNO" onClick={handleDial} />
            <DialButton digit="7" letters="PQRS" onClick={handleDial} />
            <DialButton digit="8" letters="TUV" onClick={handleDial} />
            <DialButton digit="9" letters="WXYZ" onClick={handleDial} />
            <DialButton digit="*" onClick={handleDial} />
            <DialButton digit="0" letters="+" onClick={handleDial} />
            <DialButton digit="#" onClick={handleDial} />
          </div>

          {/* Call Button */}
          <button
            onClick={handleCall}
            disabled={!dialedNumber || !clientReady}
            className="w-full py-3 rounded-xl bg-[#D34108] hover:bg-[#B33607] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Phone01 className="size-5" />
            Call
          </button>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {loadingRecents ? (
            <div className="py-12 text-center text-sm text-quaternary">Loading...</div>
          ) : recentCalls.length === 0 ? (
            <div className="py-12 text-center text-sm text-quaternary">No recent calls</div>
          ) : (
            <ul className="divide-y divide-secondary">
              {recentCalls.map(call => (
                <li
                  key={call.id}
                  onClick={() => handleCallRecent(call)}
                  className="px-4 py-3 hover:bg-secondary_alt cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center ${
                        call.direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <Phone01 className={`size-4 ${
                          call.direction === 'inbound' ? 'text-green-600 rotate-[135deg]' : 'text-blue-600 -rotate-45'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-primary text-sm">{call.name || call.number}</p>
                        <p className="text-xs text-tertiary">{call.number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-quaternary">{formatDate(call.timestamp)}</p>
                      <p className="text-xs text-tertiary flex items-center gap-1 justify-end">
                        <Clock className="size-3" />
                        {call.duration > 0 ? formatDuration(call.duration) : 'Missed'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Floating Softphone Button (to be placed in app shell)
export function SoftphoneButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 size-14 rounded-full bg-[#D34108] hover:bg-[#B33607] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
      title="Open Softphone"
    >
      <Phone01 className="size-6" />
    </button>
  );
}
