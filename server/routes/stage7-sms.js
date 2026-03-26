/**
 * Stage 7: SMS Integration
 * 
 * Send and receive SMS messages via the Telnyx Messaging API.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = Telnyx(process.env.TELNYX_API_KEY);

// =====================================================
// POST /api/sms/send
// Send an SMS message
// =====================================================
router.post('/sms/send', async (req, res) => {
  const { to, from, body } = req.body;
  
  if (!to || !body) {
    return res.status(400).json({ error: 'to and body are required' });
  }
  
  try {
    // Get sender number from database if not provided
    let senderNumber = from;
    if (!senderNumber) {
      const numResult = await db.query(`
        SELECT id, phone_number FROM phone_numbers WHERE is_active = true LIMIT 1
      `);
      if (numResult.rows.length === 0) {
        return res.status(400).json({
          error: 'No active phone number found. Purchase a number first.',
        });
      }
      senderNumber = numResult.rows[0].phone_number;
    }
    
    // Send via Telnyx
    const message = await telnyx.messages.create({
      from: senderNumber,
      to: to,
      text: body,
    });
    
    // Find phone number ID
    const phoneNumResult = await db.query(`
      SELECT id FROM phone_numbers WHERE phone_number = $1
    `, [senderNumber]);
    
    // Log the message
    await db.query(`
      INSERT INTO sms_messages (telnyx_id, direction, from_number, to_number, body, status, phone_number_id)
      VALUES ($1, 'outbound', $2, $3, $4, $5, $6)
    `, [
      message.data.id,
      senderNumber,
      to,
      body,
      'sent',
      phoneNumResult.rows[0]?.id || null,
    ]);
    
    res.json({
      success: true,
      message: {
        id: message.data.id,
        from: senderNumber,
        to: to,
        body: body,
        status: 'sent',
      },
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/sms
// List SMS messages
// =====================================================
router.get('/sms', async (req, res) => {
  const { limit = 50, offset = 0, direction } = req.query;
  
  try {
    let query = `
      SELECT 
        sm.*,
        pn.phone_number as phone_number_display
      FROM sms_messages sm
      LEFT JOIN phone_numbers pn ON sm.phone_number_id = pn.id
    `;
    const values = [];
    let paramIndex = 1;
    
    if (direction) {
      query += ` WHERE sm.direction = $${paramIndex++}`;
      values.push(direction);
    }
    
    query += ` ORDER BY sm.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, values);
    
    // Count total
    let countQuery = `SELECT COUNT(*) FROM sms_messages`;
    const countValues = [];
    if (direction) {
      countQuery += ` WHERE direction = $1`;
      countValues.push(direction);
    }
    const countResult = await db.query(countQuery, countValues);
    
    res.json({
      success: true,
      messages: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error listing SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/sms/:id
// Get specific SMS message
// =====================================================
router.get('/sms/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        sm.*,
        pn.phone_number as phone_number_display
      FROM sms_messages sm
      LEFT JOIN phone_numbers pn ON sm.phone_number_id = pn.id
      WHERE sm.id = $1 OR sm.telnyx_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /webhooks/telnyx/sms
// Receive inbound SMS webhook
// =====================================================
router.post('/telnyx/sms', async (req, res) => {
  const event = req.body?.data;
  
  if (!event) {
    return res.status(400).json({ error: 'No event data' });
  }
  
  const eventType = event.event_type;
  const payload = event.payload;
  
  console.log(`📨 SMS Event: ${eventType}`, JSON.stringify(payload, null, 2));
  
  try {
    switch (eventType) {
      case 'message.received':
        await handleInboundSMS(payload);
        break;
        
      case 'message.sent':
      case 'message.finalized':
        await handleSMSStatusUpdate(payload);
        break;
        
      default:
        console.log(`Unhandled SMS event: ${eventType}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// Handle inbound SMS
// =====================================================
async function handleInboundSMS(payload) {
  const {
    id,
    from,
    to,
    text,
  } = payload;
  
  // Find which of our numbers received this
  const phoneNumResult = await db.query(`
    SELECT id FROM phone_numbers WHERE phone_number = $1
  `, [to?.phone_number || to]);
  
  // Log the inbound message
  await db.query(`
    INSERT INTO sms_messages (telnyx_id, direction, from_number, to_number, body, status, phone_number_id)
    VALUES ($1, 'inbound', $2, $3, $4, 'received', $5)
    ON CONFLICT (telnyx_id) DO NOTHING
  `, [
    id,
    from?.phone_number || from,
    to?.phone_number || to,
    text,
    phoneNumResult.rows[0]?.id || null,
  ]);
}

// =====================================================
// Handle SMS status update
// =====================================================
async function handleSMSStatusUpdate(payload) {
  const { id, to } = payload;
  
  // Update message status
  await db.query(`
    UPDATE sms_messages 
    SET status = 'delivered', updated_at = NOW()
    WHERE telnyx_id = $1
  `, [id]);
}

// =====================================================
// DELETE /api/sms/:id
// Delete SMS message
// =====================================================
router.delete('/sms/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      DELETE FROM sms_messages 
      WHERE id = $1 OR telnyx_id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({
      success: true,
      message: 'SMS deleted',
    });
  } catch (error) {
    console.error('Error deleting SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
