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