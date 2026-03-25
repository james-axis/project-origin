import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone01, PhoneHangUp, Microphone01, MicrophoneOff01, VolumeMax, VolumeX, Users01, Clock, X, Maximize02, Minimize02 } from '@untitledui/icons';
import * as TwilioService from '../services/twilio';

// Types
type CallStatus = 'idle' | 'connecting' | 'ringing' | 'in-progress' | 'on-hold' | 'ended';
type CallDirection = 'inbound' | 'outbound';

interface ActiveCall {
  sid: string;
  status: CallStatus;
  direction: CallDirection;
  remoteNumber: string;
  remoteName?: string;
  startTime: number;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
}

interface CallHistoryEntry {
  id: string;
  remoteNumber: string;
  remoteName?: string;
  direction: CallDirection;
  status: 'completed' | 'missed' | 'failed';
  duration: number;
  timestamp: number;
  recordingUrl?: string;
  transcription?: string;
}

interface SoftphoneProps {
  userId: string;
  userName: string;
  callerId: string;
  onCallStart?: (call: ActiveCall) => void;
  onCallEnd?: (call: ActiveCall) => void;
  onMinimize?: () => void;
  minimized?: boolean;
  className?: string;
}
