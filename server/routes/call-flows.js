/**
 * Call Flows Route
 * 
 * Manage call routing configuration - defines what happens when a number receives a call.
 */

import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();

// =====================================================
// GET /api/call-flows
// List all call flows
// =====================================================
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM call_flows 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching call flows:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/call-flows/:id
// Get a single call flow
// =====================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM call_flows WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call flow not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/call-flows
// Create a new call flow
// =====================================================
router.post('/', async (req, res) => {
  const {
    name,
    greeting_audio_id,
    greeting_text,
    route_type = 'direct',
    route_destination,
    ivr_config,
    recording_enabled = true,
    transcription_enabled = false,
    timeout_seconds = 30,
    fallback_action = 'voicemail',
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Flow name is required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO call_flows (
        name, greeting_audio_id, greeting_text, route_type, 
        route_destination, ivr_config, recording_enabled, 
        transcription_enabled, timeout_seconds, fallback_action
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name,
      greeting_audio_id || null,
      greeting_text || null,
      route_type,
      route_destination || null,
      ivr_config ? JSON.stringify(ivr_config) : null,
      recording_enabled,
      transcription_enabled,
      timeout_seconds,
      fallback_action,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PUT /api/call-flows/:id
// Update a call flow
// =====================================================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    greeting_audio_id,
    greeting_text,
    route_type,
    route_destination,
    ivr_config,
    recording_enabled,
    transcription_enabled,
    timeout_seconds,
    fallback_action,
  } = req.body;

  try {
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (greeting_audio_id !== undefined) {
      updates.push(`greeting_audio_id = $${paramCount++}`);
      values.push(greeting_audio_id);
    }
    if (greeting_text !== undefined) {
      updates.push(`greeting_text = $${paramCount++}`);
      values.push(greeting_text);
    }
    if (route_type !== undefined) {
      updates.push(`route_type = $${paramCount++}`);
      values.push(route_type);
    }
    if (route_destination !== undefined) {
      updates.push(`route_destination = $${paramCount++}`);
      values.push(route_destination);
    }
    if (ivr_config !== undefined) {
      updates.push(`ivr_config = $${paramCount++}`);
      values.push(ivr_config ? JSON.stringify(ivr_config) : null);
    }
    if (recording_enabled !== undefined) {
      updates.push(`recording_enabled = $${paramCount++}`);
      values.push(recording_enabled);
    }
    if (transcription_enabled !== undefined) {
      updates.push(`transcription_enabled = $${paramCount++}`);
      values.push(transcription_enabled);
    }
    if (timeout_seconds !== undefined) {
      updates.push(`timeout_seconds = $${paramCount++}`);
      values.push(timeout_seconds);
    }
    if (fallback_action !== undefined) {
      updates.push(`fallback_action = $${paramCount++}`);
      values.push(fallback_action);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(`
      UPDATE call_flows 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call flow not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DELETE /api/call-flows/:id
// Delete a call flow
// =====================================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // First unassign from any phone numbers using this flow
    await db.query(`
      UPDATE phone_numbers 
      SET call_flow_id = NULL 
      WHERE call_flow_id = $1
    `, [id]);

    // Then delete the flow
    const result = await db.query(`
      DELETE FROM call_flows WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call flow not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
