import { useState, useEffect, useCallback } from 'react';
import { Phone01, PhoneHangUp, Microphone01, MicrophoneOff01, VolumeMax, VolumeX, X, Minimize02, Clock, ChevronUp, User01 } from '@untitledui/icons';

// Types
type CallStatus = 'idle' | 'connecting' | 'ringing' | 'in-progress' | 'ended';
type CallDirection = 'inbound' | 'outbound';

interface ActiveCall {
  sid: string;
  status: CallStatus;
  direction: CallDirection;
  remoteNumber: string;
  remoteName?: string;
  startTime: number;
  isMuted: boolean;
}

interface RecentCall {
  id: string;
  number: string;
  name?: string;
  direction: CallDirection;
  duration: number;
  timestamp: number;
}

// Mock recent calls
const mockRecentCalls: RecentCall[] = [
  { id: '1', number: '+61 412 345 678', name: 'Sophie Hartley', direction: 'outbound', duration: 342, timestamp: Date.now() - 3600000 },
  { id: '2', number: '+61 423 456 789', name: 'Ryan Castellano', direction: 'inbound', duration: 128, timestamp: Date.now() - 7200000 },
  { id: '3', number: '+61 434 567 890', direction: 'outbound', duration: 0, timestamp: Date.now() - 10800000 },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
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
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Timer for active call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall?.status === 'in-progress') {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleDial = useCallback((digit: string) => {
    if (!activeCall) {
      setDialedNumber(prev => prev + digit);
    }
  }, [activeCall]);

  const handleBackspace = useCallback(() => {
    setDialedNumber(prev => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (!dialedNumber) return;
    
    // Simulate call connection
    setActiveCall({
      sid: `CA${Date.now()}`,
      status: 'connecting',
      direction: 'outbound',
      remoteNumber: dialedNumber,
      startTime: Date.now(),
      isMuted: false,
    });

    // Simulate connection after 2s
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
    }, 1000);

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'in-progress', startTime: Date.now() } : null);
    }, 3000);
  }, [dialedNumber]);

  const handleHangup = useCallback(() => {
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
  }, []);

  const handleCallRecent = useCallback((call: RecentCall) => {
    setDialedNumber(call.number);
    setView('dialpad');
  }, []);

  // Active Call UI
  if (activeCall) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-primary rounded-2xl shadow-2xl border border-secondary overflow-hidden z-50">
        {/* Header */}
        <div className="bg-[#D34108] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <Phone01 className="size-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {activeCall.status === 'connecting' ? 'Connecting...' : 
                   activeCall.status === 'ringing' ? 'Ringing...' : 
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
            <p className="text-sm text-tertiary capitalize">{activeCall.status.replace('-', ' ')}</p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-secondary_alt text-secondary hover:bg-secondary'
              }`}
            >
              {isMuted ? <MicrophoneOff01 className="size-5" /> : <Microphone01 className="size-5" />}
            </button>
            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                isSpeaker ? 'bg-[#D34108]/10 text-[#D34108]' : 'bg-secondary_alt text-secondary hover:bg-secondary'
              }`}
            >
              {isSpeaker ? <VolumeMax className="size-5" /> : <VolumeX className="size-5" />}
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
          <span className="font-semibold text-primary text-sm">Softphone</span>
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
          onClick={() => setView('recents')}
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
            disabled={!dialedNumber}
            className="w-full py-3 rounded-xl bg-[#D34108] hover:bg-[#B33607] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Phone01 className="size-5" />
            Call
          </button>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {mockRecentCalls.length === 0 ? (
            <div className="py-12 text-center text-sm text-quaternary">No recent calls</div>
          ) : (
            <ul className="divide-y divide-secondary">
              {mockRecentCalls.map(call => (
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
                      <p className="text-xs text-quaternary">{formatTime(call.timestamp)}</p>
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
