/**
 * Twilio API Service
 * 
 * This service wraps all Twilio API calls for the Axis CRM.
 * Admins configure settings via the Settings > Phone System page.
 * Advisers use the Softphone component for calls.
 * 
 * Environment variables required:
 * - VITE_TWILIO_ACCOUNT_SID: Twilio Account SID
 * - VITE_TWILIO_AUTH_TOKEN: Twilio Auth Token (stored securely)
 * - VITE_TWILIO_API_KEY: Twilio API Key SID (for client tokens)
 * - VITE_TWILIO_API_SECRET: Twilio API Secret (for client tokens)
 * - VITE_TWILIO_TWIML_APP_SID: TwiML App SID for voice
 */

// Types
export interface TwilioConfig {
  accountSid: string;
  region: 'au1' | 'us1' | 'ie1';
  twimlAppSid: string;
}

export interface PhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  country: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  voiceUrl: string | null;
  smsUrl: string | null;
}

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  country: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  price: number;
  priceUnit: string;
}

export interface CallRecord {
  sid: string;
  from: string;
  to: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  duration: number;
  startTime: string;
  endTime: string | null;
  recordingUrl: string | null;
  transcriptionText: string | null;
  price: number | null;
}

export interface Recording {
  sid: string;
  callSid: string;
  duration: number;
  channels: number;
  source: 'RecordVerb' | 'DialVerb' | 'Conference' | 'OutboundAPI' | 'Trunking';
  status: 'processing' | 'completed' | 'absent' | 'deleted';
  mediaUrl: string;
  createdAt: string;
}

export interface Transcription {
  sid: string;
  recordingSid: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  transcriptionText: string | null;
  duration: number;
  price: number | null;
}

export interface UsageRecord {
  category: string;
  description: string;
  count: number;
  countUnit: string;
  usage: number;
  usageUnit: string;
  price: number;
  priceUnit: string;
  startDate: string;
  endDate: string;
}

export interface ClientToken {
  token: string;
  identity: string;
  expiresAt: number;
}

// API Error
export class TwilioApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public moreInfo?: string
  ) {
    super(message);
    this.name = 'TwilioApiError';
  }
}

// Base API URL (proxied through backend)
const API_BASE = '/api/twilio';

// Helper for API calls
async function twilioFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error', code: response.status }));
    throw new TwilioApiError(error.message, error.code, error.more_info);
  }

  return response.json();
}

// ===== PHONE NUMBERS =====

/**
 * List all phone numbers owned by the account
 */
export async function listPhoneNumbers(): Promise<PhoneNumber[]> {
  return twilioFetch<PhoneNumber[]>('/phone-numbers');
}

/**
 * Get details for a specific phone number
 */
export async function getPhoneNumber(sid: string): Promise<PhoneNumber> {
  return twilioFetch<PhoneNumber>(`/phone-numbers/${sid}`);
}

/**
 * Search for available phone numbers to purchase
 */
export async function searchAvailableNumbers(params: {
  country: string;
  type?: 'local' | 'mobile' | 'tollFree';
  areaCode?: string;
  contains?: string;
  voiceEnabled?: boolean;
  smsEnabled?: boolean;
  limit?: number;
}): Promise<AvailableNumber[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });
  return twilioFetch<AvailableNumber[]>(`/phone-numbers/available?${query}`);
}

/**
 * Purchase a phone number
 */
export async function purchasePhoneNumber(phoneNumber: string, friendlyName?: string): Promise<PhoneNumber> {
  return twilioFetch<PhoneNumber>('/phone-numbers/purchase', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, friendlyName }),
  });
}

/**
 * Update a phone number (friendly name, webhooks, etc.)
 */
export async function updatePhoneNumber(
  sid: string,
  updates: {
    friendlyName?: string;
    voiceUrl?: string;
    smsUrl?: string;
    voiceMethod?: 'GET' | 'POST';
    smsMethod?: 'GET' | 'POST';
  }
): Promise<PhoneNumber> {
  return twilioFetch<PhoneNumber>(`/phone-numbers/${sid}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Release (delete) a phone number
 */
export async function releasePhoneNumber(sid: string): Promise<void> {
  await twilioFetch(`/phone-numbers/${sid}`, { method: 'DELETE' });
}

// ===== CALLS =====

/**
 * Initiate an outbound call
 */
export async function makeCall(params: {
  to: string;
  from: string;
  url?: string;
  twiml?: string;
  record?: boolean;
  recordingStatusCallback?: string;
  transcribe?: boolean;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
}): Promise<CallRecord> {
  return twilioFetch<CallRecord>('/calls', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get call details
 */
export async function getCall(sid: string): Promise<CallRecord> {
  return twilioFetch<CallRecord>(`/calls/${sid}`);
}

/**
 * List calls with optional filters
 */
export async function listCalls(params?: {
  to?: string;
  from?: string;
  status?: CallRecord['status'];
  startTimeAfter?: string;
  startTimeBefore?: string;
  limit?: number;
}): Promise<CallRecord[]> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return twilioFetch<CallRecord[]>(`/calls?${query}`);
}

/**
 * Update an in-progress call (transfer, hang up, etc.)
 */
export async function updateCall(
  sid: string,
  updates: {
    url?: string;
    twiml?: string;
    status?: 'canceled' | 'completed';
  }
): Promise<CallRecord> {
  return twilioFetch<CallRecord>(`/calls/${sid}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ===== RECORDINGS =====

/**
 * List recordings for a call
 */
export async function listRecordings(callSid?: string): Promise<Recording[]> {
  const query = callSid ? `?callSid=${callSid}` : '';
  return twilioFetch<Recording[]>(`/recordings${query}`);
}

/**
 * Get a specific recording
 */
export async function getRecording(sid: string): Promise<Recording> {
  return twilioFetch<Recording>(`/recordings/${sid}`);
}

/**
 * Delete a recording
 */
export async function deleteRecording(sid: string): Promise<void> {
  await twilioFetch(`/recordings/${sid}`, { method: 'DELETE' });
}

/**
 * Get recording media URL (signed, time-limited)
 */
export async function getRecordingMediaUrl(sid: string): Promise<{ url: string; expiresAt: number }> {
  return twilioFetch(`/recordings/${sid}/media`);
}

// ===== TRANSCRIPTIONS =====

/**
 * Request transcription for a recording
 */
export async function createTranscription(recordingSid: string): Promise<Transcription> {
  return twilioFetch<Transcription>('/transcriptions', {
    method: 'POST',
    body: JSON.stringify({ recordingSid }),
  });
}

/**
 * Get transcription status and text
 */
export async function getTranscription(sid: string): Promise<Transcription> {
  return twilioFetch<Transcription>(`/transcriptions/${sid}`);
}

/**
 * List transcriptions
 */
export async function listTranscriptions(recordingSid?: string): Promise<Transcription[]> {
  const query = recordingSid ? `?recordingSid=${recordingSid}` : '';
  return twilioFetch<Transcription[]>(`/transcriptions${query}`);
}

// ===== USAGE =====

/**
 * Get usage records for billing
 */
export async function getUsageRecords(params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<UsageRecord[]> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return twilioFetch<UsageRecord[]>(`/usage/records?${query}`);
}

/**
 * Get usage summary (total cost, minutes, etc.)
 */
export async function getUsageSummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalCost: number;
  voiceMinutes: { inbound: number; outbound: number };
  smsCount: { inbound: number; outbound: number };
  transcriptionMinutes: number;
  recordingMinutes: number;
}> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return twilioFetch(`/usage/summary?${query}`);
}

// ===== CLIENT TOKENS (for Browser Softphone) =====

/**
 * Generate a client capability token for browser-based calling
 * This token allows the browser to make/receive calls via Twilio.js
 */
export async function generateClientToken(identity: string): Promise<ClientToken> {
  return twilioFetch<ClientToken>('/tokens/client', {
    method: 'POST',
    body: JSON.stringify({ identity }),
  });
}

/**
 * Refresh an expiring client token
 */
export async function refreshClientToken(identity: string): Promise<ClientToken> {
  return generateClientToken(identity);
}

// ===== SETTINGS =====

/**
 * Get current phone system settings
 */
export async function getPhoneSettings(): Promise<{
  recording: {
    enabled: boolean;
    retentionDays: number;
  };
  transcription: {
    enabled: boolean;
    aiSummary: boolean;
    language: string;
  };
  webhooks: {
    voiceUrl: string;
    statusCallbackUrl: string;
  };
}> {
  return twilioFetch('/settings');
}

/**
 * Update phone system settings
 */
export async function updatePhoneSettings(settings: {
  recording?: {
    enabled?: boolean;
    retentionDays?: number;
  };
  transcription?: {
    enabled?: boolean;
    aiSummary?: boolean;
    language?: string;
  };
}): Promise<void> {
  await twilioFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

// ===== USER ACCESS =====

/**
 * Get users with softphone access
 */
export async function getUsersWithSoftphoneAccess(): Promise<
  Array<{
    userId: string;
    name: string;
    email: string;
    callerId: string | null;
    enabled: boolean;
  }>
> {
  return twilioFetch('/users/softphone');
}

/**
 * Update user softphone access
 */
export async function updateUserSoftphoneAccess(
  userId: string,
  updates: {
    enabled?: boolean;
    callerId?: string | null;
  }
): Promise<void> {
  await twilioFetch(`/users/softphone/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ===== WEBHOOKS (for backend integration) =====

/**
 * Types for webhook payloads from Twilio
 */
export interface VoiceWebhookPayload {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: CallRecord['status'];
  Direction: CallRecord['direction'];
  ApiVersion: string;
  CallerName?: string;
  ForwardedFrom?: string;
}

export interface StatusCallbackPayload extends VoiceWebhookPayload {
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  RecordingDuration?: string;
}

export interface RecordingStatusPayload {
  AccountSid: string;
  CallSid: string;
  RecordingSid: string;
  RecordingUrl: string;
  RecordingStatus: Recording['status'];
  RecordingDuration: string;
  RecordingChannels: string;
  RecordingSource: Recording['source'];
}

export interface TranscriptionCallbackPayload {
  AccountSid: string;
  TranscriptionSid: string;
  RecordingSid: string;
  TranscriptionStatus: Transcription['status'];
  TranscriptionText?: string;
  TranscriptionUrl?: string;
}

// Export all types for use elsewhere
export type {
  TwilioConfig,
  PhoneNumber,
  AvailableNumber,
  CallRecord,
  Recording,
  Transcription,
  UsageRecord,
  ClientToken,
};
