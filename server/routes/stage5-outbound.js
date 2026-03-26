/**
 * Stage 5: Outbound Calls (Click-to-Call)
 * 
 * Initiate outbound calls from the CRM via the Telnyx REST API.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = Telnyx(process.env.TELNYX_API_KEY);
const BASE_URL = process.env.BASE_URL || 'https://api.axiscrm.com.au';

// =====================================================
// POST /api/calls/outbound
// Initiate an outbound call
// =====================================================
router.post('/calls/outbound', async (req, res) => {
  const { to, from, connectionId } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Destination number (to) is required' });
  }
  
  try {
    // Get caller ID from database if not provided
    let callerNumber = from;
    if (!callerNumber) {
      const numResult = await db.query(`
        SELECT phone_number FROM phone_numbers WHERE is_active = true LIMIT 1
      `);
      if (numResult.rows.length === 0) {
        return res.status(400).json({ 
          error: 'No active phone number found. Purchase a number first.' 
        });
      }
      callerNumber = numResult.rows[0].phone_number;
    }
    
    // Get connection ID from database if not provided
    let connId = connectionId;
    if (!connId) {
      const appResult = await db.query(`SELECT app_id FROM call_control_apps LIMIT 1`);
      if (appResult.rows.length > 0) {
        connId = appResult.rows[0].app_id;
      }
    }
    
    // Initiate call via Telnyx
    const call = await telnyx.calls.create({
      connection_id: connId,
      to: to,
      from: callerNumber,
      webhook_url: `${BASE_URL}/webhooks/telnyx/voice`,
    });
    
    // Log the call
    await db.query(`
      INSERT INTO call_logs (call_control_id, call_leg_id, call_session_id, direction, from_number, to_number, state)
      VALUES ($1, $2, $3, 'outbound', $4, $5, 'initiated')
    `, [
      call.data.call_control_id,
      call.data.call_leg_id,
      call.data.call_session_id,
      callerNumber,
      to,
    ]);
    
    res.json({
      success: true,
      call: {
        callControlId: call.data.call_control_id,
        callLegId: call.data.call_leg_id,
        callSessionId: call.data.call_session_id,
        from: callerNumber,
        to: to,
        state: 'initiated',
      },
    });
  } catch (error) {
    console.error('Error initiating outbound call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/hangup
// Hang up a call
// =====================================================
router.post('/calls/:callControlId/hangup', async (req, res) => {
  const { callControlId } = req.params;
  
  try {
    await telnyx.calls.hangup(callControlId);
    
    res.json({
      success: true,
      message: 'Call hung up',
    });
  } catch (error) {
    console.error('Error hanging up call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/transfer
// Transfer a call
// =====================================================
router.post('/calls/:callControlId/transfer', async (req, res) => {
  const { callControlId } = req.params;
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Destination number (to) is required' });
  }
  
  try {
    await telnyx.calls.transfer(callControlId, { to });
    
    res.json({
      success: true,
      message: 'Call transferred',
      to,
    });
  } catch (error) {
    console.error('Error transferring call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/hold
// Put a call on hold
// =====================================================
router.post('/calls/:callControlId/hold', async (req, res) => {
  const { callControlId } = req.params;
  const { audioUrl } = req.body;
  
  try {
    await telnyx.calls.hold(callControlId, {
      audio_url: audioUrl, // Optional hold music
    });
    
    res.json({
      success: true,
      message: 'Call on hold',
    });
  } catch (error) {
    console.error('Error holding call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/unhold
// Resume a held call
// =====================================================
router.post('/calls/:callControlId/unhold', async (req, res) => {
  const { callControlId } = req.params;
  
  try {
    await telnyx.calls.unhold(callControlId);
    
    res.json({
      success: true,
      message: 'Call resumed',
    });
  } catch (error) {
    console.error('Error resuming call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/mute
// Mute a call
// =====================================================
router.post('/calls/:callControlId/mute', async (req, res) => {
  const { callControlId } = req.params;
  
  try {
    await telnyx.calls.mute(callControlId);
    
    res.json({
      success: true,
      message: 'Call muted',
    });
  } catch (error) {
    console.error('Error muting call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/unmute
// Unmute a call
// =====================================================
router.post('/calls/:callControlId/unmute', async (req, res) => {
  const { callControlId } = req.params;
  
  try {
    await telnyx.calls.unmute(callControlId);
    
    res.json({
      success: true,
      message: 'Call unmuted',
    });
  } catch (error) {
    console.error('Error unmuting call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/calls/:callControlId/dtmf
// Send DTMF tones
// =====================================================
router.post('/calls/:callControlId/dtmf', async (req, res) => {
  const { callControlId } = req.params;
  const { digits } = req.body;
  
  if (!digits) {
    return res.status(400).json({ error: 'Digits are required' });
  }
  
  try {
    await telnyx.calls.sendDtmf(callControlId, { digits });
    
    res.json({
      success: true,
      message: 'DTMF sent',
      digits,
    });
  } catch (error) {
    console.error('Error sending DTMF:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/calls/:callControlId
// Get call status
// =====================================================
router.get('/calls/:callControlId', async (req, res) => {
  const { callControlId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT * FROM call_logs WHERE call_control_id = $1
    `, [callControlId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json({
      success: true,
      call: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting call status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
