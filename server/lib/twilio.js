/**
 * Twilio Client Library
 * Configured for Australian region (AU1/Sydney) for low latency
 */

import twilio from 'twilio';

// Environment variables
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  BASE_URL,
} = process.env;

// Validate required env vars
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn('⚠️  Missing Twilio credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
}

/**
 * Create Twilio client
 * Note: region/edge options are for Voice SDK calls, not REST API
 * Stage 3: Region Configuration
 */
export const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Generate TwiML with Sydney edge routing
 * All <Dial> verbs should include edge="sydney"
 */
export function createTwimlResponse() {
  return new twilio.twiml.VoiceResponse();
}

/**
 * Get webhook URLs for phone number configuration
 */
export function getWebhookUrls() {
  const baseUrl = BASE_URL || 'https://your-api-domain.com';
  return {
    voiceUrl: `${baseUrl}/webhooks/twiml`,
    statusCallback: `${baseUrl}/webhooks/status-callback`,
    recordingStatusCallback: `${baseUrl}/webhooks/recording-status`,
    transcriptionCallback: `${baseUrl}/webhooks/transcription-status`,
  };
}

/**
 * Get API credentials for client token generation (Stage 9)
 */
export function getApiCredentials() {
  return {
    accountSid: TWILIO_ACCOUNT_SID,
    apiKey: TWILIO_API_KEY,
    apiSecret: TWILIO_API_SECRET,
  };
}

export default client;
