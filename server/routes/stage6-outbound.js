/**
 * Stage 6: Outbound Calls (Click-to-Call)
 * 
 * Initiate outbound calls from the CRM via the Twilio REST API.
 * Agent's phone rings first, then connects to the destination.
 */

import { Router } from 'express';
import twilio from 'twilio';
import { client } from '../lib/twilio.js';
import db from '../lib/db.js';

const TwiML = twilio.twiml;

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

// =====================================================
// 6.1 INITIATE OUTBOUND CALL
// =====================================================

/**
 * POST /api/calls/outbound
 * Start an outbound click-to-call
 */
router.post('/calls/outbound', async (req, res) => {
  try {
    const {
      to,              // Destination number
      agentNumber,     // Agent's phone (or client identity)
      callerId,        // Twilio number to show
      recordingEnabled = true,
      callFlowId,      // Optional: apply call flow settings
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'to (destination number) is required' });
    }
    if (!agentNumber) {
      return res.status(400).json({ error: 'agentNumber is required' });
    }
    if (!callerId) {
      return res.status(400).json({ error: 'callerId (Twilio number) is required' });
    }

    console.log(`📤 Outbound: Agent ${agentNumber} → ${to} (Caller ID: ${callerId})`);

    // Two-leg call pattern:
    // Leg 1: Call the agent first
    // Leg 2: When agent answers, TwiML dials the destination

    const call = await client.calls.create({
      to: agentNumber,
      from: callerId,
      url: `${BASE_URL}/webhooks/outbound-twiml?to=${encodeURIComponent(to)}&callerId=${encodeURIComponent(callerId)}&recording=${recordingEnabled}`,
      statusCallback: `${BASE_URL}/webhooks/status-callback`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    // Log the outbound call
    await db.query(
      `INSERT INTO call_logs 
        (call_sid, call_status, direction, from_number, to_number, call_flow_id)
       VALUES ($1, 'initiated', 'outbound-api', $2, $3, $4)`,
      [call.sid, callerId, to, callFlowId]
    );

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to,
      from: callerId,
    });
  } catch (error) {
    console.error('Outbound call error:', error);
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});

// =====================================================
// 6.4 OUTBOUND TWIML HANDLER
// =====================================================

/**
 * POST /webhooks/outbound-twiml
 * Generate TwiML for outbound call (called when agent answers)
 */
router.post('/outbound-twiml', async (req, res) => {
  try {
    const { to, callerId, recording } = req.query;
    console.log(`🔗 Agent answered, connecting to: ${to}`);

    const response = new TwiML.VoiceResponse();

    // Optional: Play a prompt to the agent
    response.say({ voice: 'alice' }, 'Connecting your call. Please hold.');

    // Build dial options
    const dialOptions = {
      callerId,
      timeout: 30,
      action: `${BASE_URL}/webhooks/dial-complete`,
    };

    // Add recording if enabled
    if (recording === 'true') {
      dialOptions.record = 'record-from-answer-dual';
      dialOptions.recordingStatusCallback = `${BASE_URL}/webhooks/recording-status`;
      dialOptions.recordingStatusCallbackEvent = 'completed';
    }

    // Add Sydney edge for AU region
    dialOptions.edge = 'sydney';

    // Dial the destination
    const dial = response.dial(dialOptions);
    dial.number({ statusCallbackEvent: 'initiated ringing answered completed' }, to);

    res.type('text/xml').send(response.toString());
  } catch (error) {
    console.error('Outbound TwiML error:', error);
    const response = new TwiML.VoiceResponse();
    response.say({ voice: 'alice' }, 'An error occurred. Please try again.');
    response.hangup();
    res.type('text/xml').send(response.toString());
  }
});

// =====================================================
// CALL CONTROL
// =====================================================

/**
 * POST /api/calls/:callSid/hangup
 * End an active call
 */
router.post('/calls/:callSid/hangup', async (req, res) => {
  try {
    const { callSid } = req.params;

    await client.calls(callSid).update({ status: 'completed' });

    res.json({ success: true, message: 'Call ended' });
  } catch (error) {
    console.error('Hangup error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:callSid/hold
 * Put call on hold
 */
router.post('/calls/:callSid/hold', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { holdMusicUrl } = req.body;

    // Update to play hold music
    await client.calls(callSid).update({
      twiml: `<Response><Play loop="0">${holdMusicUrl || 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B7.mp3'}</Play></Response>`,
    });

    res.json({ success: true, message: 'Call on hold' });
  } catch (error) {
    console.error('Hold error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:callSid/resume
 * Resume call from hold
 */
router.post('/calls/:callSid/resume', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { conferenceId } = req.body;

    // Return to conference or normal call flow
    if (conferenceId) {
      await client.calls(callSid).update({
        twiml: `<Response><Dial><Conference>${conferenceId}</Conference></Dial></Response>`,
      });
    }

    res.json({ success: true, message: 'Call resumed' });
  } catch (error) {
    console.error('Resume error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:callSid/transfer
 * Transfer call to another number
 */
router.post('/calls/:callSid/transfer', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { to, callerId } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'to (transfer destination) is required' });
    }

    // Update call to dial new destination
    await client.calls(callSid).update({
      twiml: `<Response><Dial callerId="${callerId}"><Number>${to}</Number></Dial></Response>`,
    });

    res.json({ success: true, message: 'Call transferred', to });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/calls/:callSid
 * Get call status
 */
router.get('/calls/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;

    const call = await client.calls(callSid).fetch();

    res.json({
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
      from: call.from,
      to: call.to,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
    });
  } catch (error) {
    console.error('Get call error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
