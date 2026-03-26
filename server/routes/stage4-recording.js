/**
 * Stage 4: Call Recording & Transcription
 * 
 * Enable call recording and real-time transcription.
 * Telnyx defaults to dual-channel recording (each party on separate channel).
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = new Telnyx(process.env.TELNYX_API_KEY);

// =====================================================
// GET /api/recordings
// List all recordings
// =====================================================
router.get('/recordings', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    const result = await db.query(`
      SELECT 
        cl.id,
        cl.call_control_id,
        cl.from_number,
        cl.to_number,
        cl.direction,
        cl.duration_seconds,
        cl.recording_url,
        cl.created_at
      FROM call_logs cl
      WHERE cl.recording_url IS NOT NULL
      ORDER BY cl.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    const countResult = await db.query(`
      SELECT COUNT(*) FROM call_logs WHERE recording_url IS NOT NULL
    `);
    
    res.json({
      success: true,
      recordings: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error listing recordings:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/recordings/:callId
// Get recording for a specific call
// =====================================================
router.get('/recordings/:callId', async (req, res) => {
  const { callId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cl.id,
        cl.call_control_id,
        cl.from_number,
        cl.to_number,
        cl.direction,
        cl.duration_seconds,
        cl.recording_url,
        cl.created_at
      FROM call_logs cl
      WHERE cl.id = $1 OR cl.call_control_id = $1
    `, [callId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const call = result.rows[0];
    
    if (!call.recording_url) {
      return res.status(404).json({ error: 'No recording available for this call' });
    }
    
    res.json({
      success: true,
      recording: {
        callId: call.id,
        callControlId: call.call_control_id,
        from: call.from_number,
        to: call.to_number,
        direction: call.direction,
        duration: call.duration_seconds,
        url: call.recording_url,
        recordedAt: call.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting recording:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DELETE /api/recordings/:callId
// Delete a recording
// =====================================================
router.delete('/recordings/:callId', async (req, res) => {
  const { callId } = req.params;
  
  try {
    // Clear recording URL from database
    const result = await db.query(`
      UPDATE call_logs 
      SET recording_url = NULL, updated_at = NOW()
      WHERE id = $1 OR call_control_id = $1
      RETURNING id
    `, [callId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json({
      success: true,
      message: 'Recording deleted',
    });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/transcripts
// List all transcripts
// =====================================================
router.get('/transcripts', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    const result = await db.query(`
      SELECT 
        cl.id,
        cl.call_control_id,
        cl.from_number,
        cl.to_number,
        cl.direction,
        cl.duration_seconds,
        cl.transcript,
        cl.created_at
      FROM call_logs cl
      WHERE cl.transcript IS NOT NULL AND cl.transcript != ''
      ORDER BY cl.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    const countResult = await db.query(`
      SELECT COUNT(*) FROM call_logs WHERE transcript IS NOT NULL AND transcript != ''
    `);
    
    res.json({
      success: true,
      transcripts: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error listing transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/transcripts/:callId
// Get transcript for a specific call
// =====================================================
router.get('/transcripts/:callId', async (req, res) => {
  const { callId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cl.id,
        cl.call_control_id,
        cl.from_number,
        cl.to_number,
        cl.direction,
        cl.duration_seconds,
        cl.transcript,
        cl.created_at
      FROM call_logs cl
      WHERE cl.id = $1 OR cl.call_control_id = $1
    `, [callId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const call = result.rows[0];
    
    // Get individual chunks for detailed view
    const chunksResult = await db.query(`
      SELECT text, track, sequence_id, created_at
      FROM transcript_chunks
      WHERE call_control_id = $1
      ORDER BY sequence_id
    `, [call.call_control_id]);
    
    res.json({
      success: true,
      transcript: {
        callId: call.id,
        callControlId: call.call_control_id,
        from: call.from_number,
        to: call.to_number,
        direction: call.direction,
        duration: call.duration_seconds,
        fullText: call.transcript,
        chunks: chunksResult.rows,
        recordedAt: call.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting transcript:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/settings/recording
// Get recording settings
// =====================================================
router.get('/settings/recording', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT value FROM phone_settings WHERE key = 'recording'
    `);
    
    const settings = result.rows[0]?.value || {
      enabled: true,
      retentionDays: 90,
      format: 'mp3',
      channels: 'single',
    };
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PUT /api/settings/recording
// Update recording settings
// =====================================================
router.put('/settings/recording', async (req, res) => {
  const { enabled, retentionDays, format, channels } = req.body;
  
  try {
    const settings = {
      enabled: enabled !== undefined ? enabled : true,
      retentionDays: retentionDays || 90,
      format: format || 'mp3',
      channels: channels || 'single',
    };
    
    await db.query(`
      INSERT INTO phone_settings (key, value, updated_at)
      VALUES ('recording', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `, [JSON.stringify(settings)]);
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/settings/transcription
// Get transcription settings
// =====================================================
router.get('/settings/transcription', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT value FROM phone_settings WHERE key = 'transcription'
    `);
    
    const settings = result.rows[0]?.value || {
      enabled: false,
      language: 'en-AU',
      engine: 'A',
    };
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PUT /api/settings/transcription
// Update transcription settings
// =====================================================
router.put('/settings/transcription', async (req, res) => {
  const { enabled, language, engine } = req.body;
  
  try {
    const settings = {
      enabled: enabled !== undefined ? enabled : false,
      language: language || 'en-AU',
      engine: engine || 'A',
    };
    
    await db.query(`
      INSERT INTO phone_settings (key, value, updated_at)
      VALUES ('transcription', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `, [JSON.stringify(settings)]);
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
