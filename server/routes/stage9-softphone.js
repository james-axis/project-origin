/**
 * Stage 9: In-Browser Softphone
 * 
 * Agents can answer/make calls directly from the browser
 * using Twilio Voice SDK.
 */

import { Router } from 'express';
import twilio from 'twilio';
import { twiml as TwiML } from 'twilio';
import db from '../lib/db.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const API_KEY = process.env.TWILIO_API_KEY;
const API_SECRET = process.env.TWILIO_API_SECRET;

// TwiML App SID - create this in Twilio Console
// Voice Request URL should point to: ${BASE_URL}/webhooks/softphone-twiml
const TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;

// =====================================================
// 9.2 GENERATE ACCESS TOKEN
// =====================================================

/**
 * POST /api/twilio/token
 * Generate Twilio Access Token for browser softphone
 */
router.post('/token', async (req, res) => {
  try {
    const { identity } = req.body;

    if (!identity) {
      return res.status(400).json({ error: 'identity is required' });
    }

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ 
        error: 'Twilio API Key not configured. Set TWILIO_API_KEY and TWILIO_API_SECRET environment variables.' 
      });
    }

    console.log(`🎫 Generating token for: ${identity}`);

    // Create Access Token
    const token = new twilio.jwt.AccessToken(
      ACCOUNT_SID,
      API_KEY,
      API_SECRET,
      { 
        identity,
        ttl: 3600, // 1 hour
      }
    );

    // Create Voice Grant
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: TWIML_APP_SID,
      incomingAllow: true, // Allow incoming calls to this identity
    });

    token.addGrant(voiceGrant);

    res.json({
      token: token.toJwt(),
      identity,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/token
 * Alternative GET endpoint for token generation
 */
router.get('/token', async (req, res) => {
  try {
    const { identity } = req.query;

    if (!identity) {
      return res.status(400).json({ error: 'identity query parameter is required' });
    }

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ 
        error: 'Twilio API Key not configured' 
      });
    }

    const token = new twilio.jwt.AccessToken(
      ACCOUNT_SID,
      API_KEY,
      API_SECRET,
      { identity, ttl: 3600 }
    );

    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: TWIML_APP_SID,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    res.json({
      token: token.toJwt(),
      identity,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 9.4 BROWSER OUTBOUND CALLS
// =====================================================

/**
 * POST /webhooks/softphone-twiml
 * TwiML handler for browser-initiated calls
 * This is called by Twilio when device.connect() is used
 */
router.post('/softphone-twiml', async (req, res) => {
  try {
    const { To, From, CallSid } = req.body;
    console.log(`📱 Softphone call: ${From} → ${To} (${CallSid})`);

    const response = new TwiML.VoiceResponse();

    // If To is provided, this is an outbound call
    if (To) {
      // Get caller ID from request or use first available number
      let callerId = req.body.CallerId;
      
      if (!callerId) {
        const result = await db.query(
          `SELECT phone_number FROM phone_numbers WHERE is_active = true LIMIT 1`
        );
        callerId = result.rows[0]?.phone_number;
      }

      if (!callerId) {
        response.say({ voice: 'alice' }, 'No caller ID configured. Please set up a phone number first.');
        response.hangup();
        res.type('text/xml').send(response.toString());
        return;
      }

      // Log the call
      await db.query(
        `INSERT INTO call_logs 
          (call_sid, call_status, direction, from_number, to_number)
         VALUES ($1, 'initiated', 'outbound-browser', $2, $3)`,
        [CallSid, callerId, To]
      );

      // Build dial options
      const dialOptions = {
        callerId,
        timeout: 30,
        action: `${BASE_URL}/webhooks/dial-complete`,
        edge: 'sydney',
      };

      // Check if recording is enabled (could be passed as parameter)
      if (req.body.Record === 'true') {
        dialOptions.record = 'record-from-answer-dual';
        dialOptions.recordingStatusCallback = `${BASE_URL}/webhooks/recording-status`;
      }

      // Dial the destination
      const dial = response.dial(dialOptions);

      if (To.startsWith('client:')) {
        // Calling another browser client
        dial.client(To.replace('client:', ''));
      } else {
        // Calling a phone number
        dial.number(To);
      }
    } else {
      // No destination - this might be an incoming call to the browser
      response.say({ voice: 'alice' }, 'Welcome to the Axis CRM softphone.');
    }

    res.type('text/xml').send(response.toString());
  } catch (error) {
    console.error('Softphone TwiML error:', error);
    const response = new TwiML.VoiceResponse();
    response.say({ voice: 'alice' }, 'An error occurred. Please try again.');
    response.hangup();
    res.type('text/xml').send(response.toString());
  }
});

// =====================================================
// SOFTPHONE CONFIGURATION
// =====================================================

/**
 * GET /api/twilio/softphone/config
 * Get softphone configuration for the frontend
 */
router.get('/softphone/config', async (req, res) => {
  try {
    // Get available phone numbers for caller ID selection
    const numbersResult = await db.query(
      `SELECT id, phone_number, friendly_name, number_type
       FROM phone_numbers
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    res.json({
      region: 'au1',
      edge: 'sydney',
      availableNumbers: numbersResult.rows.map(row => ({
        id: row.id,
        phoneNumber: row.phone_number,
        friendlyName: row.friendly_name,
        type: row.number_type,
      })),
      features: {
        recording: true,
        transcription: true,
        voicemail: true,
      },
      twimlAppConfigured: !!TWIML_APP_SID,
    });
  } catch (error) {
    console.error('Get softphone config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/twiml-app
 * Create or update TwiML App for softphone
 */
router.post('/twiml-app', async (req, res) => {
  try {
    const { client } = await import('../lib/twilio.js');

    // Check if app already exists
    const apps = await client.applications.list({ friendlyName: 'Axis CRM Softphone' });

    let app;
    if (apps.length > 0) {
      // Update existing
      app = await client.applications(apps[0].sid).update({
        voiceUrl: `${BASE_URL}/webhooks/softphone-twiml`,
        voiceMethod: 'POST',
        statusCallback: `${BASE_URL}/webhooks/status-callback`,
        statusCallbackMethod: 'POST',
      });
    } else {
      // Create new
      app = await client.applications.create({
        friendlyName: 'Axis CRM Softphone',
        voiceUrl: `${BASE_URL}/webhooks/softphone-twiml`,
        voiceMethod: 'POST',
        statusCallback: `${BASE_URL}/webhooks/status-callback`,
        statusCallbackMethod: 'POST',
      });
    }

    res.json({
      success: true,
      appSid: app.sid,
      friendlyName: app.friendlyName,
      voiceUrl: app.voiceUrl,
      message: 'Add this SID to your environment as TWILIO_TWIML_APP_SID',
    });
  } catch (error) {
    console.error('TwiML App error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// =====================================================
// ACTIVE CALLS
// =====================================================

/**
 * GET /api/twilio/softphone/active-calls
 * Get list of active calls for the current user
 */
router.get('/softphone/active-calls', async (req, res) => {
  try {
    const { identity } = req.query;

    const result = await db.query(
      `SELECT call_sid, call_status, direction, from_number, to_number, created_at
       FROM call_logs
       WHERE call_status IN ('initiated', 'ringing', 'in-progress', 'queued')
       ORDER BY created_at DESC
       LIMIT 10`
    );

    res.json({
      calls: result.rows.map(row => ({
        callSid: row.call_sid,
        status: row.call_status,
        direction: row.direction,
        from: row.from_number,
        to: row.to_number,
        startedAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
