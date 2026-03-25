/**
 * Stage 2: Phone Number Purchase
 * 
 * Search for and purchase phone numbers (local, mobile, toll-free)
 * directly from the CRM. Numbers are linked to regulatory bundles
 * and configured with webhook URLs.
 */

import { Router } from 'express';
import { client } from '../lib/twilio.js';
import db from '../lib/db.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

// =====================================================
// 2.1 SEARCH AVAILABLE NUMBERS
// =====================================================

/**
 * GET /api/twilio/available-numbers
 * Search for available phone numbers
 */
router.get('/available-numbers', async (req, res) => {
  try {
    const { country = 'AU', type = 'local', areaCode, contains } = req.query;

    // Map type to Twilio endpoint
    const typeMap = {
      local: 'local',
      mobile: 'mobile',
      tollFree: 'tollFree',
      'toll-free': 'tollFree',
    };

    const twilioType = typeMap[type] || 'local';
    
    // Build search options
    const options = {};
    if (areaCode) options.areaCode = areaCode;
    if (contains) options.contains = contains;

    // Search Twilio
    const numbers = await client.availablePhoneNumbers(country)[twilioType].list({
      ...options,
      limit: 20,
    });

    res.json(numbers.map(n => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      region: n.region,
      locality: n.locality,
      capabilities: {
        voice: n.capabilities.voice,
        sms: n.capabilities.sms,
        mms: n.capabilities.mms,
      },
    })));
  } catch (error) {
    console.error('Error searching numbers:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// =====================================================
// 2.2 PURCHASE NUMBER
// =====================================================

/**
 * POST /api/twilio/phone-numbers
 * Purchase a phone number
 */
router.post('/phone-numbers', async (req, res) => {
  try {
    const {
      phoneNumber,
      friendlyName,
      bundleSid,
      region = 'au1',
    } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    // Purchase from Twilio
    const purchaseOptions = {
      phoneNumber,
      friendlyName: friendlyName || phoneNumber,
      voiceUrl: `${BASE_URL}/webhooks/twiml`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/webhooks/status-callback`,
      statusCallbackMethod: 'POST',
    };

    // Add bundle SID if provided (required for AU)
    if (bundleSid) {
      purchaseOptions.bundleSid = bundleSid;
    }

    const number = await client.incomingPhoneNumbers.create(purchaseOptions);

    // Determine number type
    let numberType = 'local';
    if (number.phoneNumber.startsWith('+614')) numberType = 'mobile';
    if (number.phoneNumber.includes('1800') || number.phoneNumber.includes('1300')) numberType = 'toll-free';

    // Store in database
    await db.query(
      `INSERT INTO phone_numbers 
        (phone_number_sid, phone_number, friendly_name, number_type, capabilities, 
         region, voice_url, status_callback, bundle_sid, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (phone_number_sid) DO UPDATE SET
        friendly_name = EXCLUDED.friendly_name,
        voice_url = EXCLUDED.voice_url,
        status_callback = EXCLUDED.status_callback,
        updated_at = NOW()`,
      [
        number.sid,
        number.phoneNumber,
        number.friendlyName,
        numberType,
        JSON.stringify(number.capabilities),
        region,
        number.voiceUrl,
        number.statusCallback,
        bundleSid,
        true,
      ]
    );

    res.status(201).json({
      phoneNumberSid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      numberType,
      capabilities: number.capabilities,
      voiceUrl: number.voiceUrl,
      statusCallback: number.statusCallback,
    });
  } catch (error) {
    console.error('Error purchasing number:', error);
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});

// =====================================================
// 2.3 LIST & MANAGE NUMBERS
// =====================================================

/**
 * GET /api/twilio/phone-numbers
 * List all purchased numbers
 */
router.get('/phone-numbers', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pn.*, cf.name as call_flow_name
       FROM phone_numbers pn
       LEFT JOIN call_flows cf ON pn.call_flow_id = cf.id
       ORDER BY pn.created_at DESC`
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      phoneNumberSid: row.phone_number_sid,
      phoneNumber: row.phone_number,
      friendlyName: row.friendly_name,
      numberType: row.number_type,
      capabilities: row.capabilities,
      region: row.region,
      callFlowId: row.call_flow_id,
      callFlowName: row.call_flow_name,
      isActive: row.is_active,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error listing numbers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/phone-numbers/:sid
 * Get number details
 */
router.get('/phone-numbers/:sid', async (req, res) => {
  try {
    const { sid } = req.params;

    // Fetch from Twilio for latest config
    const number = await client.incomingPhoneNumbers(sid).fetch();

    res.json({
      phoneNumberSid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      voiceUrl: number.voiceUrl,
      statusCallback: number.statusCallback,
      capabilities: number.capabilities,
    });
  } catch (error) {
    console.error('Error fetching number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * PATCH /api/twilio/phone-numbers/:sid
 * Update number configuration (assign call flow)
 */
router.patch('/phone-numbers/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    const { callFlowId, friendlyName, isActive } = req.body;

    // Update local database
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (callFlowId !== undefined) {
      updates.push(`call_flow_id = $${paramCount++}`);
      values.push(callFlowId);
    }
    if (friendlyName !== undefined) {
      updates.push(`friendly_name = $${paramCount++}`);
      values.push(friendlyName);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    updates.push(`updated_at = NOW()`);

    values.push(sid);

    await db.query(
      `UPDATE phone_numbers SET ${updates.join(', ')} WHERE phone_number_sid = $${paramCount}`,
      values
    );

    // Update Twilio if friendlyName changed
    if (friendlyName) {
      await client.incomingPhoneNumbers(sid).update({ friendlyName });
    }

    res.json({ success: true, updated: { callFlowId, friendlyName, isActive } });
  } catch (error) {
    console.error('Error updating number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * DELETE /api/twilio/phone-numbers/:sid
 * Release a phone number
 */
router.delete('/phone-numbers/:sid', async (req, res) => {
  try {
    const { sid } = req.params;

    // Delete from Twilio
    await client.incomingPhoneNumbers(sid).remove();

    // Remove from database
    await db.query('DELETE FROM phone_numbers WHERE phone_number_sid = $1', [sid]);

    res.json({ success: true, message: 'Number released' });
  } catch (error) {
    console.error('Error releasing number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
