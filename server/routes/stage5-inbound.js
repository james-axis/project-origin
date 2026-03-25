/**
 * Stage 5: Inbound Call Handling
 * 
 * Handle inbound calls using call flow configuration.
 * TwiML is generated dynamically based on the phone number's
 * assigned call flow.
 */

import { Router } from 'express';
import { twiml as TwiML } from 'twilio';
import db from '../lib/db.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

// =====================================================
// 5.1 TWIML HANDLER (INBOUND)
// =====================================================

/**
 * POST /webhooks/twiml
 * Main TwiML handler for inbound calls
 */
router.post('/twiml', async (req, res) => {
  try {
    const { To, From, CallSid } = req.body;
    console.log(`📞 Inbound call: ${From} → ${To} (${CallSid})`);

    // Look up phone number and its call flow
    const result = await db.query(
      `SELECT pn.*, cf.*, af.file_url as greeting_audio_url
       FROM phone_numbers pn
       LEFT JOIN call_flows cf ON pn.call_flow_id = cf.id
       LEFT JOIN audio_files af ON cf.greeting_audio_id = af.id
       WHERE pn.phone_number = $1`,
      [To]
    );

    const phoneConfig = result.rows[0];
    const response = new TwiML.VoiceResponse();

    // Log call to database
    await db.query(
      `INSERT INTO call_logs 
        (call_sid, call_status, direction, from_number, to_number, phone_number_id, call_flow_id)
       VALUES ($1, 'ringing', 'inbound', $2, $3, $4, $5)
       ON CONFLICT (call_sid) DO UPDATE SET call_status = 'ringing'`,
      [CallSid, From, To, phoneConfig?.id, phoneConfig?.call_flow_id]
    );

    // No call flow assigned - default handling
    if (!phoneConfig || !phoneConfig.call_flow_id) {
      response.say({ voice: 'alice' }, 'Thank you for calling. No call flow has been configured for this number. Please try again later.');
      response.hangup();
      res.type('text/xml').send(response.toString());
      return;
    }

    // Generate TwiML based on route type
    const routeType = phoneConfig.route_type || 'direct';

    switch (routeType) {
      case 'ivr':
        await generateIvrTwiml(response, phoneConfig);
        break;
      case 'ring-group':
        await generateRingGroupTwiml(response, phoneConfig);
        break;
      case 'direct':
      default:
        await generateDirectTwiml(response, phoneConfig);
        break;
    }

    res.type('text/xml').send(response.toString());
  } catch (error) {
    console.error('TwiML error:', error);
    const response = new TwiML.VoiceResponse();
    response.say({ voice: 'alice' }, 'We apologize, but an error occurred. Please try again later.');
    response.hangup();
    res.type('text/xml').send(response.toString());
  }
});

// =====================================================
// TWIML GENERATORS
// =====================================================

async function generateDirectTwiml(response, config) {
  // Play greeting
  if (config.greeting_audio_url) {
    response.play(config.greeting_audio_url);
  } else if (config.greeting_text) {
    response.say({ voice: 'alice' }, config.greeting_text);
  }

  // Build dial options
  const dialOptions = {
    callerId: config.phone_number,
    timeout: config.timeout_seconds || 30,
    action: `${BASE_URL}/webhooks/dial-complete`,
  };

  // Add recording if enabled
  if (config.recording_enabled) {
    dialOptions.record = 'record-from-answer-dual';
    dialOptions.recordingStatusCallback = `${BASE_URL}/webhooks/recording-status`;
    dialOptions.recordingStatusCallbackEvent = 'completed';
  }

  // Start transcription if enabled
  if (config.transcription_enabled) {
    const start = response.start();
    start.transcription({
      statusCallbackUrl: `${BASE_URL}/webhooks/transcription-status`,
    });
  }

  // Dial destination
  const dial = response.dial(dialOptions);
  const destination = config.route_destination;

  if (destination.startsWith('+') || destination.match(/^\d/)) {
    // Phone number
    dial.number({ statusCallbackEvent: 'initiated ringing answered completed' }, destination);
  } else {
    // Client identity (browser softphone)
    dial.client(destination);
  }

  // Handle no answer
  handleFallback(response, config);
}

async function generateIvrTwiml(response, config) {
  // Play greeting
  if (config.greeting_audio_url) {
    response.play(config.greeting_audio_url);
  } else if (config.greeting_text) {
    response.say({ voice: 'alice' }, config.greeting_text);
  }

  // Gather digits
  const gather = response.gather({
    action: `${BASE_URL}/webhooks/gather`,
    numDigits: 1,
    timeout: 10,
    input: 'dtmf',
  });

  // Build IVR menu from config
  const ivrConfig = config.ivr_config || {};
  const menuOptions = Object.entries(ivrConfig)
    .map(([digit, action]) => `Press ${digit} for ${action.label || action.destination}`)
    .join('. ');

  if (menuOptions) {
    gather.say({ voice: 'alice' }, menuOptions);
  } else {
    gather.say({ voice: 'alice' }, 'Please enter your selection.');
  }

  // No input fallback
  response.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  response.hangup();
}

async function generateRingGroupTwiml(response, config) {
  // Play greeting
  if (config.greeting_audio_url) {
    response.play(config.greeting_audio_url);
  } else if (config.greeting_text) {
    response.say({ voice: 'alice' }, config.greeting_text);
  }

  // Ring all destinations simultaneously
  const destinations = (config.route_destination || '').split(',').map(d => d.trim());

  const dialOptions = {
    callerId: config.phone_number,
    timeout: config.timeout_seconds || 30,
    action: `${BASE_URL}/webhooks/dial-complete`,
  };

  if (config.recording_enabled) {
    dialOptions.record = 'record-from-answer-dual';
    dialOptions.recordingStatusCallback = `${BASE_URL}/webhooks/recording-status`;
  }

  const dial = response.dial(dialOptions);
  
  destinations.forEach(dest => {
    if (dest.startsWith('+') || dest.match(/^\d/)) {
      dial.number(dest);
    } else {
      dial.client(dest);
    }
  });

  handleFallback(response, config);
}

function handleFallback(response, config) {
  const fallback = config.fallback_action || 'hangup';
  
  switch (fallback) {
    case 'voicemail':
      response.say({ voice: 'alice' }, 'Please leave a message after the tone.');
      response.record({
        maxLength: 120,
        transcribe: true,
        transcribeCallback: `${BASE_URL}/webhooks/transcription-status`,
        action: `${BASE_URL}/webhooks/voicemail-complete`,
      });
      break;
    case 'forward':
      // Forward to another number if configured
      break;
    case 'hangup':
    default:
      // Do nothing - call ends naturally
      break;
  }
}

// =====================================================
// 5.4 GATHER HANDLER (IVR)
// =====================================================

/**
 * POST /webhooks/gather
 * Handle IVR digit input
 */
router.post('/gather', async (req, res) => {
  try {
    const { CallSid, Digits, From, To } = req.body;
    console.log(`🔢 IVR input: ${Digits} (${CallSid})`);

    // Store digits pressed
    await db.query(
      `UPDATE call_logs SET digits_pressed = $1, updated_at = NOW() WHERE call_sid = $2`,
      [Digits, CallSid]
    );

    // Look up call flow
    const result = await db.query(
      `SELECT cf.* FROM call_logs cl
       JOIN call_flows cf ON cl.call_flow_id = cf.id
       WHERE cl.call_sid = $1`,
      [CallSid]
    );

    const config = result.rows[0];
    const response = new TwiML.VoiceResponse();

    if (!config) {
      response.say({ voice: 'alice' }, 'Configuration error. Goodbye.');
      response.hangup();
      res.type('text/xml').send(response.toString());
      return;
    }

    // Get action for pressed digit
    const ivrConfig = config.ivr_config || {};
    const action = ivrConfig[Digits];

    if (!action) {
      response.say({ voice: 'alice' }, 'Invalid selection. Please try again.');
      response.redirect(`${BASE_URL}/webhooks/twiml`);
      res.type('text/xml').send(response.toString());
      return;
    }

    // Execute action
    switch (action.action) {
      case 'dial':
        const dial = response.dial({
          callerId: To,
          timeout: 30,
          action: `${BASE_URL}/webhooks/dial-complete`,
        });
        if (action.destination.startsWith('+') || action.destination.match(/^\d/)) {
          dial.number(action.destination);
        } else {
          dial.client(action.destination);
        }
        break;
      
      case 'play':
        // Look up audio file
        const audioResult = await db.query(
          'SELECT file_url FROM audio_files WHERE id = $1',
          [action.audioFileId]
        );
        if (audioResult.rows[0]) {
          response.play(audioResult.rows[0].file_url);
        }
        response.redirect(`${BASE_URL}/webhooks/twiml`);
        break;
      
      case 'repeat':
        response.redirect(`${BASE_URL}/webhooks/twiml`);
        break;
      
      case 'transfer':
        const transfer = response.dial({
          callerId: To,
          timeout: 30,
        });
        transfer.number(action.destination);
        break;
      
      default:
        response.say({ voice: 'alice' }, 'Invalid action configured.');
        response.hangup();
    }

    res.type('text/xml').send(response.toString());
  } catch (error) {
    console.error('Gather error:', error);
    const response = new TwiML.VoiceResponse();
    response.say({ voice: 'alice' }, 'An error occurred. Goodbye.');
    response.hangup();
    res.type('text/xml').send(response.toString());
  }
});

// =====================================================
// 5.5 STATUS CALLBACK HANDLER
// =====================================================

/**
 * POST /webhooks/status-callback
 * Handle call status updates
 */
router.post('/status-callback', async (req, res) => {
  try {
    const {
      CallSid,
      ParentCallSid,
      CallStatus,
      Direction,
      From,
      To,
      CallDuration,
    } = req.body;

    console.log(`📊 Status: ${CallSid} → ${CallStatus} (${CallDuration}s)`);

    // Upsert call log
    await db.query(
      `INSERT INTO call_logs 
        (call_sid, parent_call_sid, call_status, direction, from_number, to_number, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (call_sid) DO UPDATE SET
        call_status = EXCLUDED.call_status,
        duration = COALESCE(EXCLUDED.duration, call_logs.duration),
        updated_at = NOW()`,
      [CallSid, ParentCallSid, CallStatus, Direction, From, To, CallDuration ? parseInt(CallDuration) : null]
    );

    res.sendStatus(200);
  } catch (error) {
    console.error('Status callback error:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /webhooks/dial-complete
 * Handle dial completion
 */
router.post('/dial-complete', async (req, res) => {
  const { DialCallStatus, CallSid } = req.body;
  console.log(`☎️ Dial complete: ${CallSid} → ${DialCallStatus}`);

  const response = new TwiML.VoiceResponse();

  if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy' || DialCallStatus === 'failed') {
    // Look up fallback action
    const result = await db.query(
      `SELECT cf.fallback_action FROM call_logs cl
       JOIN call_flows cf ON cl.call_flow_id = cf.id
       WHERE cl.call_sid = $1`,
      [CallSid]
    );

    const fallback = result.rows[0]?.fallback_action || 'hangup';

    if (fallback === 'voicemail') {
      response.say({ voice: 'alice' }, 'The party you are trying to reach is unavailable. Please leave a message after the tone.');
      response.record({
        maxLength: 120,
        action: `${BASE_URL}/webhooks/voicemail-complete`,
      });
    }
  }

  res.type('text/xml').send(response.toString());
});

/**
 * POST /webhooks/voicemail-complete
 * Handle voicemail recording
 */
router.post('/voicemail-complete', async (req, res) => {
  const { CallSid, RecordingUrl, RecordingDuration } = req.body;
  console.log(`📬 Voicemail: ${CallSid} (${RecordingDuration}s)`);

  // Store voicemail
  if (RecordingUrl) {
    await db.query(
      `UPDATE call_logs SET recording_url = $1, recording_duration = $2, updated_at = NOW()
       WHERE call_sid = $3`,
      [RecordingUrl + '.mp3', parseInt(RecordingDuration), CallSid]
    );
  }

  const response = new TwiML.VoiceResponse();
  response.say({ voice: 'alice' }, 'Your message has been recorded. Goodbye.');
  response.hangup();
  res.type('text/xml').send(response.toString());
});

export default router;
