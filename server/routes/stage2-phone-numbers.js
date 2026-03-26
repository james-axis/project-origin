/**
 * Stage 2: Phone Number Purchase
 * 
 * Search for and purchase Australian phone numbers directly from the CRM.
 * No separate regulatory bundle setup required — Telnyx handles AU compliance internally.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// =====================================================
// GET /api/telnyx/available-numbers
// Search available phone numbers
// =====================================================
router.get('/available-numbers', async (req, res) => {
  const {
    country_code = 'AU',
    number_type = 'local',
    city,
    contains,
    limit = 20,
  } = req.query;
  
  try {
    const searchParams = {
      'filter[country_code]': country_code,
      'filter[phone_number_type]': number_type,
      'filter[limit]': parseInt(limit),
    };
    
    if (city) {
      searchParams['filter[locality]'] = city;
    }
    
    if (contains) {
      searchParams['filter[phone_number][contains]'] = contains;
    }
    
    const response = await telnyx.availablePhoneNumbers.list(searchParams);
    
    // Map to simpler format
    const numbers = response.data.map(n => ({
      phoneNumber: n.phone_number,
      phoneNumberType: n.phone_number_type,
      region: n.region_information?.[0]?.region_name || null,
      locality: n.region_information?.[0]?.locality || null,
      rateCenter: n.rate_center || null,
      features: n.features || [],
      monthlyRate: n.cost_information?.monthly_cost || null,
      upfrontCost: n.cost_information?.upfront_cost || null,
      reservable: n.reservable || false,
    }));
    
    res.json({
      success: true,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    console.error('Error searching numbers:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/telnyx/phone-numbers
// Purchase a phone number
// =====================================================
router.post('/phone-numbers', async (req, res) => {
  const { phoneNumber, connectionId } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  try {
    // Get connection ID from existing app or use provided
    let connId = connectionId;
    if (!connId) {
      const appResult = await db.query(`SELECT app_id FROM call_control_apps LIMIT 1`);
      if (appResult.rows.length > 0) {
        connId = appResult.rows[0].app_id;
      } else {
        return res.status(400).json({ 
          error: 'No Call Control Application found. Create one first via POST /api/telnyx/applications/setup' 
        });
      }
    }
    
    // Purchase number from Telnyx
    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }],
      connection_id: connId,
    });
    
    // Wait a moment for the order to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store in database
    const result = await db.query(`
      INSERT INTO phone_numbers (telnyx_id, phone_number, connection_id, number_type, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [
      order.data.phone_numbers?.[0]?.id || order.data.id,
      phoneNumber,
      connId,
      phoneNumber.includes('1800') || phoneNumber.includes('1300') ? 'toll_free' : 'local',
    ]);
    
    res.json({
      success: true,
      phoneNumber: result.rows[0],
      order: order.data,
    });
  } catch (error) {
    console.error('Error purchasing number:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/telnyx/phone-numbers
// List all purchased phone numbers
// =====================================================
router.get('/phone-numbers', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pn.*,
        cf.name as call_flow_name
      FROM phone_numbers pn
      LEFT JOIN call_flows cf ON pn.call_flow_id = cf.id
      ORDER BY pn.created_at DESC
    `);
    
    res.json({
      success: true,
      phoneNumbers: result.rows,
    });
  } catch (error) {
    console.error('Error listing numbers:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/telnyx/phone-numbers/:id
// Get a specific phone number
// =====================================================
router.get('/phone-numbers/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pn.*,
        cf.name as call_flow_name
      FROM phone_numbers pn
      LEFT JOIN call_flows cf ON pn.call_flow_id = cf.id
      WHERE pn.id = $1 OR pn.telnyx_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }
    
    res.json({
      success: true,
      phoneNumber: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting number:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PATCH /api/telnyx/phone-numbers/:id
// Update phone number (assign call flow)
// =====================================================
router.patch('/phone-numbers/:id', async (req, res) => {
  const { id } = req.params;
  const { callFlowId, isActive } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (callFlowId !== undefined) {
      updates.push(`call_flow_id = $${paramCount++}`);
      values.push(callFlowId);
    }
    
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(id);
    
    const result = await db.query(`
      UPDATE phone_numbers 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} OR telnyx_id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }
    
    res.json({
      success: true,
      phoneNumber: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating number:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DELETE /api/telnyx/phone-numbers/:id
// Release a phone number
// =====================================================
router.delete('/phone-numbers/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the number first
    const numResult = await db.query(`
      SELECT * FROM phone_numbers WHERE id = $1 OR telnyx_id = $1
    `, [id]);
    
    if (numResult.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }
    
    const phoneNum = numResult.rows[0];
    
    // Release from Telnyx
    if (phoneNum.telnyx_id) {
      try {
        await telnyx.phoneNumbers.del(phoneNum.telnyx_id);
      } catch (e) {
        console.warn('Telnyx release failed (may already be released):', e.message);
      }
    }
    
    // Delete from database
    await db.query(`DELETE FROM phone_numbers WHERE id = $1`, [phoneNum.id]);
    
    res.json({
      success: true,
      message: 'Phone number released',
    });
  } catch (error) {
    console.error('Error releasing number:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PUT /api/telnyx/phone-numbers/:id/assign-flow
// Assign a call flow to a phone number
// =====================================================
router.put('/phone-numbers/:id/assign-flow', async (req, res) => {
  const { id } = req.params;
  const { call_flow_id } = req.body;
  
  try {
    const result = await db.query(`
      UPDATE phone_numbers 
      SET call_flow_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [call_flow_id || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning flow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
