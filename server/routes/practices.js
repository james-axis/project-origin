/**
 * Practices Routes
 * 
 * Practices are organizational units for phone system management.
 * Each practice can have its own phone numbers, call flows, and settings.
 */

import express from 'express';
import db from '../lib/db.js';
import Telnyx from 'telnyx';

const router = express.Router();
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/telnyx/practices - List all practices
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM phone_numbers WHERE practice_id = p.id) as phone_count
      FROM practices p
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching practices:', error);
    res.status(500).json({ error: 'Failed to fetch practices' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/telnyx/practices - Create a new practice
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  const {
    practiceName,
    contactName,
    contactEmail,
    abn,
    afslNumber,
    useSubaccount = false
  } = req.body;

  if (!practiceName) {
    return res.status(400).json({ error: 'Practice name is required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO practices (
        practice_name, contact_name, contact_email, abn, afsl_number, 
        is_subaccount, setup_complete, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      RETURNING *
    `, [practiceName, contactName, contactEmail, abn, afslNumber, useSubaccount]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating practice:', error);
    res.status(500).json({ error: 'Failed to create practice' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/telnyx/practices/:id - Get a specific practice
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM practices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching practice:', error);
    res.status(500).json({ error: 'Failed to fetch practice' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/telnyx/practices/:id - Update a practice
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    practiceName,
    contactName,
    contactEmail,
    abn,
    afslNumber,
    useSubaccount,
    setupComplete
  } = req.body;

  try {
    const result = await db.query(`
      UPDATE practices SET
        practice_name = COALESCE($1, practice_name),
        contact_name = COALESCE($2, contact_name),
        contact_email = COALESCE($3, contact_email),
        abn = COALESCE($4, abn),
        afsl_number = COALESCE($5, afsl_number),
        is_subaccount = COALESCE($6, is_subaccount),
        setup_complete = COALESCE($7, setup_complete),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [practiceName, contactName, contactEmail, abn, afslNumber, useSubaccount, setupComplete, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating practice:', error);
    res.status(500).json({ error: 'Failed to update practice' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/telnyx/practices/:id - Delete a practice
// ═══════════════════════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if practice has phone numbers
    const numbersResult = await db.query(
      'SELECT COUNT(*) FROM phone_numbers WHERE practice_id = $1',
      [id]
    );

    if (parseInt(numbersResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete practice with active phone numbers. Release numbers first.' 
      });
    }

    const result = await db.query('DELETE FROM practices WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting practice:', error);
    res.status(500).json({ error: 'Failed to delete practice' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/telnyx/practices/:id/available-numbers - Search available numbers
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:id/available-numbers', async (req, res) => {
  const { country = 'AU', type = 'local', city, contains, limit = 10 } = req.query;

  try {
    const searchParams = {
      filter: {
        country_code: country,
        phone_number_type: type === 'toll_free' ? 'toll_free' : 'local',
        limit: parseInt(limit),
      }
    };

    if (city) {
      searchParams.filter.locality = city;
    }

    if (contains) {
      searchParams.filter.phone_number = { contains };
    }

    const response = await telnyx.availablePhoneNumbers.list(searchParams);

    const numbers = response.data.map(n => ({
      phone_number: n.phone_number,
      friendly_name: n.phone_number,
      region: n.region_information?.[0]?.region_name || country,
      capabilities: {
        voice: true,
        sms: n.features?.includes('sms') || false,
      },
      monthly_cost: n.cost_information?.monthly_cost || '1.00',
    }));

    res.json(numbers);
  } catch (error) {
    console.error('Error searching numbers:', error);
    res.status(500).json({ error: 'Failed to search available numbers' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/telnyx/practices/:id/phone-numbers - Purchase a number for practice
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/:id/phone-numbers', async (req, res) => {
  const { id } = req.params;
  const { phoneNumber, friendlyName } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Get Call Control App for webhooks
    const appResult = await db.query('SELECT app_id FROM call_control_apps LIMIT 1');
    const connectionId = appResult.rows[0]?.app_id;

    if (!connectionId) {
      return res.status(400).json({ error: 'No Call Control App configured. Run setup first.' });
    }

    // Purchase number via Telnyx
    const order = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }],
      connection_id: connectionId,
    });

    // Store in database
    const result = await db.query(`
      INSERT INTO phone_numbers (
        telnyx_id, phone_number, friendly_name, connection_id, 
        number_type, practice_id, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *
    `, [
      order.data.phone_numbers[0]?.id || phoneNumber,
      phoneNumber,
      friendlyName || phoneNumber,
      connectionId,
      'local',
      id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error purchasing number:', error);
    res.status(500).json({ error: error.message || 'Failed to purchase number' });
  }
});

export default router;
