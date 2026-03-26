/**
 * Stage 3: Inbound Call Handling
 * 
 * Handle inbound calls using Telnyx Call Control commands.
 * The CRM receives webhook events and responds with commands to control the call.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// =====================================================
// POST /webhooks/telnyx/voice
// Main webhook handler for all Telnyx call events
// =====================================================
router.post('/telnyx/voice', async (req, res) => {
  const event = req.body?.data;
  
  if (!event) {
    return res.status(400).json({ error: 'No event data' });
  }
  
  const eventType = event.event_type;
  const payload = event.payload;
  
  console.log(`📞 Telnyx Event: ${eventType}`, JSON.stringify(payload, null, 2));
  
  try {
    switch (eventType) {
      case 'call.initiated':
        await handleCallInitiated(payload);
        break;
        
      case 'call.answered':
        await handleCallAnswered(payload);
        break;
        
      case 'call.hangup':
        await handleCallHangup(payload);
        break;
        
      case 'call.gather.ended':
        await handleGatherEnded(payload);
        break;
        
      case 'call.recording.saved':
        await handleRecordingSaved(payload);
        break;
        
      case 'call.transcription':
        await handleTranscription(payload);
        break;
        
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// Handle call.initiated event
// =====================================================
async function handleCallInitiated(payload) {
  const {
    call_control_id,
    call_leg_id,
    call_session_id,
    direction,
    from,
    to,
  } = payload;
  
  // Log the call
  await db.query(`
    INSERT INTO call_logs (call_control_id, call_leg_id, call_session_id, direction, from_number, to_number, state)
    VALUES ($1, $2, $3, $4, $5, $6, 'initiated')
    ON CONFLICT (call_control_id) DO UPDATE SET
      state = 'initiated',
      updated_at = NOW()
  `, [call_control_id, call_leg_id, call_session_id, direction, from, to]);
  
  // For inbound calls, answer immediately
  if (direction === 'incoming') {
    // Get call flow for this number
    const flowResult = await db.query(`
      SELECT cf.* FROM phone_numbers pn
      JOIN call_flows cf ON pn.call_flow_id = cf.id
      WHERE pn.phone_number = $1
    `, [to]);
    
    const callFlow = flowResult.rows[0];
    
    // Answer the call
    await telnyx.calls.answer(call_control_id);
    
    // Apply call flow if exists
    if (callFlow) {
      // Update call log with flow
      await db.query(`
        UPDATE call_logs SET call_flow_id = $1 WHERE call_control_id = $2
      `, [callFlow.id, call_control_id]);
      
      // Handle based on flow type
      await applyCallFlow(call_control_id, callFlow);
    } else {
      // Default greeting
      await telnyx.calls.speak(call_control_id, {
        payload: 'Welcome to Axis Insurance. Please hold while we connect you.',
        voice: 'female',
        language: 'en-AU',
      });
    }
  }
}

// =====================================================
// Apply call flow configuration
// =====================================================
async function applyCallFlow(callControlId, flow) {
  // Start recording if enabled
  if (flow.recording_enabled) {
    await telnyx.calls.recordStart(callControlId, {
      format: 'mp3',
      channels: 'single',
    });
  }
  
  // Start transcription if enabled
  if (flow.transcription_enabled) {
    await telnyx.calls.transcriptionStart(callControlId, {
      language: 'en-AU',
    });
  }
  
  // Handle based on route type
  switch (flow.route_type) {
    case 'direct':
      // Play greeting then transfer
      if (flow.greeting_text) {
        await telnyx.calls.speak(callControlId, {
          payload: flow.greeting_text,
          voice: 'female',
          language: 'en-AU',
        });
        // Wait for speak to finish then transfer
        // Transfer will be triggered after speak completes
      }
      if (flow.route_destination) {
        await telnyx.calls.transfer(callControlId, {
          to: flow.route_destination,
        });
      }
      break;
      
    case 'ivr':
      // Play IVR menu
      const ivrConfig = flow.ivr_config || {};
      const options = ivrConfig.options || [];
      
      let ivrPrompt = flow.greeting_text || 'Welcome.';
      options.forEach((opt, i) => {
        ivrPrompt += ` Press ${i + 1} for ${opt.label}.`;
      });
      
      await telnyx.calls.gatherUsingSpeak(callControlId, {
        payload: ivrPrompt,
        voice: 'female',
        language: 'en-AU',
        valid_digits: options.map((_, i) => String(i + 1)).join(''),
        max: options.length > 0 ? 1 : 4,
        timeout_millis: 10000,
      });
      break;
      
    case 'ring-group':
      // Ring multiple numbers simultaneously
      const destinations = flow.route_destination?.split(',') || [];
      if (destinations.length > 0) {
        // For simplicity, transfer to first number
        // Full ring-group would use dial command with multiple destinations
        await telnyx.calls.transfer(callControlId, {
          to: destinations[0].trim(),
        });
      }
      break;
      
    default:
      // Just play greeting
      if (flow.greeting_text) {
        await telnyx.calls.speak(callControlId, {
          payload: flow.greeting_text,
          voice: 'female',
          language: 'en-AU',
        });
      }
  }
}

// =====================================================
// Handle call.answered event
// =====================================================
async function handleCallAnswered(payload) {
  const { call_control_id } = payload;
  
  await db.query(`
    UPDATE call_logs SET state = 'answered', updated_at = NOW()
    WHERE call_control_id = $1
  `, [call_control_id]);
}

// =====================================================
// Handle call.hangup event
// =====================================================
async function handleCallHangup(payload) {
  const {
    call_control_id,
    hangup_cause,
    hangup_source,
    duration_seconds,
  } = payload;
  
  await db.query(`
    UPDATE call_logs 
    SET state = 'completed', hangup_cause = $2, duration_seconds = $3, updated_at = NOW()
    WHERE call_control_id = $1
  `, [call_control_id, hangup_cause, duration_seconds || 0]);
}

// =====================================================
// Handle call.gather.ended event (IVR digit input)
// =====================================================
async function handleGatherEnded(payload) {
  const {
    call_control_id,
    digits,
    status,
  } = payload;
  
  // Store digits pressed
  await db.query(`
    UPDATE call_logs SET digits_pressed = $2, updated_at = NOW()
    WHERE call_control_id = $1
  `, [call_control_id, digits]);
  
  if (status === 'valid' && digits) {
    // Get call flow config
    const result = await db.query(`
      SELECT cf.ivr_config FROM call_logs cl
      JOIN call_flows cf ON cl.call_flow_id = cf.id
      WHERE cl.call_control_id = $1
    `, [call_control_id]);
    
    const ivrConfig = result.rows[0]?.ivr_config || {};
    const options = ivrConfig.options || [];
    const selectedOption = options[parseInt(digits) - 1];
    
    if (selectedOption?.destination) {
      // Transfer to selected destination
      await telnyx.calls.transfer(call_control_id, {
        to: selectedOption.destination,
      });
    } else {
      await telnyx.calls.speak(call_control_id, {
        payload: 'Invalid selection. Goodbye.',
        voice: 'female',
        language: 'en-AU',
      });
      await telnyx.calls.hangup(call_control_id);
    }
  }
}

// =====================================================
// Handle call.recording.saved event
// =====================================================
async function handleRecordingSaved(payload) {
  const {
    call_control_id,
    recording_urls,
  } = payload;
  
  const recordingUrl = recording_urls?.mp3;
  
  if (recordingUrl) {
    await db.query(`
      UPDATE call_logs SET recording_url = $2, updated_at = NOW()
      WHERE call_control_id = $1
    `, [call_control_id, recordingUrl]);
  }
}

// =====================================================
// Handle call.transcription event
// =====================================================
async function handleTranscription(payload) {
  const {
    call_control_id,
    transcription_data,
  } = payload;
  
  if (transcription_data?.transcript) {
    // Store chunk
    const sequenceResult = await db.query(`
      SELECT COALESCE(MAX(sequence_id), 0) + 1 as next_seq
      FROM transcript_chunks WHERE call_control_id = $1
    `, [call_control_id]);
    
    const nextSeq = sequenceResult.rows[0].next_seq;
    
    await db.query(`
      INSERT INTO transcript_chunks (call_control_id, text, track, sequence_id)
      VALUES ($1, $2, $3, $4)
    `, [call_control_id, transcription_data.transcript, transcription_data.track || 'inbound', nextSeq]);
    
    // Assemble full transcript
    const chunksResult = await db.query(`
      SELECT text FROM transcript_chunks 
      WHERE call_control_id = $1 
      ORDER BY sequence_id
    `, [call_control_id]);
    
    const fullTranscript = chunksResult.rows.map(r => r.text).join(' ');
    
    await db.query(`
      UPDATE call_logs SET transcript = $2, updated_at = NOW()
      WHERE call_control_id = $1
    `, [call_control_id, fullTranscript]);
  }
}

export default router;
