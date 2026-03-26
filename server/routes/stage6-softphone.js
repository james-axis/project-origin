/**
 * Stage 6: In-Browser Softphone (WebRTC)
 * 
 * Agents can answer and make calls directly from the browser
 * using the Telnyx WebRTC SDK.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = Telnyx(process.env.TELNYX_API_KEY);

// =====================================================
// POST /api/telnyx/webrtc-token
// Generate JWT token for WebRTC connection
// =====================================================
router.post('/webrtc-token', async (req, res) => {
  const { userId, identity } = req.body;
  
  try {
    // Get or create user softphone access
    let userAccess;
    
    if (userId) {
      const result = await db.query(`
        SELECT * FROM user_softphone_access WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length > 0) {
        userAccess = result.rows[0];
      }
    }
    
    // Get connection ID for token generation
    const appResult = await db.query(`SELECT app_id FROM call_control_apps LIMIT 1`);
    
    if (appResult.rows.length === 0) {
      return res.status(400).json({
        error: 'No Call Control Application found. Set up the phone system first.',
      });
    }
    
    const connectionId = appResult.rows[0].app_id;
    
    // Generate WebRTC token from Telnyx
    // Note: This requires a Telnyx Credential to be set up in Mission Control
    // The token is generated using the Telnyx SDK
    const token = await telnyx.telephonyCredentials.token({
      connection_id: connectionId,
    });
    
    res.json({
      success: true,
      token: token.data,
      identity: userAccess?.identity || identity || `user_${Date.now()}`,
      connectionId,
    });
  } catch (error) {
    console.error('Error generating WebRTC token:', error);
    
    // If token generation fails, it might be because Telnyx Credentials
    // haven't been set up yet. Provide helpful error message.
    if (error.message?.includes('credential')) {
      return res.status(400).json({
        error: 'WebRTC credentials not configured. Please create a SIP Credential in Telnyx Mission Control.',
        hint: 'Go to Telnyx Portal > Voice > SIP Credentials to create one.',
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/telnyx/softphone/users
// List all softphone users
// =====================================================
router.get('/softphone/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        usa.*,
        pn.phone_number as caller_id_number
      FROM user_softphone_access usa
      LEFT JOIN phone_numbers pn ON usa.caller_id = pn.id
      ORDER BY usa.created_at DESC
    `);
    
    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error('Error listing softphone users:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/telnyx/softphone/users
// Create or update softphone user access
// =====================================================
router.post('/softphone/users', async (req, res) => {
  const { userId, identity, callerId, enabled = true } = req.body;
  
  if (!userId || !identity) {
    return res.status(400).json({ error: 'userId and identity are required' });
  }
  
  try {
    const result = await db.query(`
      INSERT INTO user_softphone_access (user_id, identity, caller_id, enabled)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        identity = EXCLUDED.identity,
        caller_id = EXCLUDED.caller_id,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
      RETURNING *
    `, [userId, identity, callerId, enabled]);
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating softphone user:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/telnyx/softphone/users/:userId
// Get softphone user
// =====================================================
router.get('/softphone/users/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        usa.*,
        pn.phone_number as caller_id_number
      FROM user_softphone_access usa
      LEFT JOIN phone_numbers pn ON usa.caller_id = pn.id
      WHERE usa.user_id = $1 OR usa.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting softphone user:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PATCH /api/telnyx/softphone/users/:userId
// Update softphone user
// =====================================================
router.patch('/softphone/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { identity, callerId, enabled } = req.body;
  
  const updates = [];
  const values = [];
  let i = 1;
  
  if (identity !== undefined) {
    updates.push(`identity = $${i++}`);
    values.push(identity);
  }
  if (callerId !== undefined) {
    updates.push(`caller_id = $${i++}`);
    values.push(callerId);
  }
  if (enabled !== undefined) {
    updates.push(`enabled = $${i++}`);
    values.push(enabled);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(userId);
  
  try {
    const result = await db.query(`
      UPDATE user_softphone_access 
      SET ${updates.join(', ')}
      WHERE user_id = $${i} OR id = $${i}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating softphone user:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DELETE /api/telnyx/softphone/users/:userId
// Delete softphone user
// =====================================================
router.delete('/softphone/users/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await db.query(`
      DELETE FROM user_softphone_access 
      WHERE user_id = $1 OR id = $1
      RETURNING id
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Softphone user deleted',
    });
  } catch (error) {
    console.error('Error deleting softphone user:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// WebRTC call webhook for softphone
// POST /webhooks/telnyx/softphone
// =====================================================
router.post('/softphone', async (req, res) => {
  const event = req.body?.data;
  
  if (!event) {
    return res.status(400).json({ error: 'No event data' });
  }
  
  const eventType = event.event_type;
  const payload = event.payload;
  
  console.log(`📱 Softphone Event: ${eventType}`, JSON.stringify(payload, null, 2));
  
  // Handle softphone-specific events
  // Most events are handled by the main voice webhook
  
  res.json({ received: true });
});

export default router;
