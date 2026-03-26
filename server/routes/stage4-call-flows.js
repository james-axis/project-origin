/**
 * Stage 4: Call Flow & IVR Configuration
 * 
 * Create and configure call flows (routing rules) in the CRM.
 * Users can set greetings, IVR menus, recording preferences,
 * and routing destinations without touching TwiML directly.
 */

import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import db from '../lib/db.js';

const router = Router();

// Configure multer for audio uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 and WAV files are allowed'));
    }
  },
});

// =====================================================
// 4.1 CREATE CALL FLOW
// =====================================================

/**
 * POST /api/call-flows
 * Create a new call flow
 */
router.post('/call-flows', async (req, res) => {
  try {
    const {
      practiceId,
      name,
      greetingText,
      greetingAudioId,
      routeType = 'direct',
      routeDestination,
      ivrConfig = {},
      recordingEnabled = true,
      transcriptionEnabled = false,
      timeoutSeconds = 30,
      fallbackAction = 'voicemail',
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await db.query(
      `INSERT INTO call_flows 
        (practice_id, name, greeting_text, greeting_audio_id, route_type, route_destination,
         ivr_config, recording_enabled, transcription_enabled, timeout_seconds, fallback_action)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        practiceId || null,
        name,
        greetingText,
        greetingAudioId,
        routeType,
        routeDestination,
        JSON.stringify(ivrConfig),
        recordingEnabled,
        transcriptionEnabled,
        timeoutSeconds,
        fallbackAction,
      ]
    );

    const flow = result.rows[0];

    // If practiceId is provided, mark the practice setup as complete
    if (practiceId) {
      await db.query(
        `UPDATE twilio_practices 
         SET setup_step = 'complete', setup_status = 'complete'
         WHERE id = $1`,
        [practiceId]
      );
      console.log(`✅ Practice ${practiceId} setup marked complete`);
    }

    res.status(201).json({
      id: flow.id,
      practiceId: flow.practice_id,
      name: flow.name,
      greetingText: flow.greeting_text,
      greetingAudioId: flow.greeting_audio_id,
      routeType: flow.route_type,
      routeDestination: flow.route_destination,
      ivrConfig: flow.ivr_config,
      recordingEnabled: flow.recording_enabled,
      transcriptionEnabled: flow.transcription_enabled,
      timeoutSeconds: flow.timeout_seconds,
      fallbackAction: flow.fallback_action,
      createdAt: flow.created_at,
    });
  } catch (error) {
    console.error('Error creating call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/call-flows
 * List all call flows
 */
router.get('/call-flows', async (req, res) => {
  try {
    const { practiceId } = req.query;
    
    let query = `SELECT cf.*, af.name as greeting_audio_name, af.file_url as greeting_audio_url
       FROM call_flows cf
       LEFT JOIN audio_files af ON cf.greeting_audio_id = af.id`;
    const values = [];
    
    if (practiceId) {
      query += ' WHERE cf.practice_id = $1';
      values.push(practiceId);
    }
    
    query += ' ORDER BY cf.created_at DESC';

    const result = await db.query(query, values);

    res.json(result.rows.map(row => ({
      id: row.id,
      practiceId: row.practice_id,
      name: row.name,
      greetingText: row.greeting_text,
      greetingAudioId: row.greeting_audio_id,
      greetingAudioName: row.greeting_audio_name,
      greetingAudioUrl: row.greeting_audio_url,
      routeType: row.route_type,
      routeDestination: row.route_destination,
      ivrConfig: row.ivr_config,
      recordingEnabled: row.recording_enabled,
      transcriptionEnabled: row.transcription_enabled,
      timeoutSeconds: row.timeout_seconds,
      fallbackAction: row.fallback_action,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error listing call flows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/call-flows/:id
 * Get call flow details
 */
router.get('/call-flows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT cf.*, af.name as greeting_audio_name, af.file_url as greeting_audio_url
       FROM call_flows cf
       LEFT JOIN audio_files af ON cf.greeting_audio_id = af.id
       WHERE cf.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call flow not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      greetingText: row.greeting_text,
      greetingAudioId: row.greeting_audio_id,
      greetingAudioName: row.greeting_audio_name,
      greetingAudioUrl: row.greeting_audio_url,
      routeType: row.route_type,
      routeDestination: row.route_destination,
      ivrConfig: row.ivr_config,
      recordingEnabled: row.recording_enabled,
      transcriptionEnabled: row.transcription_enabled,
      timeoutSeconds: row.timeout_seconds,
      fallbackAction: row.fallback_action,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('Error fetching call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/call-flows/:id
 * Update a call flow
 */
router.patch('/call-flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'greeting_text', 'greeting_audio_id', 'route_type',
      'route_destination', 'ivr_config', 'recording_enabled',
      'transcription_enabled', 'timeout_seconds', 'fallback_action',
    ];

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    // Convert camelCase to snake_case and build query
    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramCount++}`);
        values.push(snakeKey === 'ivr_config' ? JSON.stringify(value) : value);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(id);

    await db.query(
      `UPDATE call_flows SET ${setClauses.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error updating call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/call-flows/:id
 * Delete a call flow
 */
router.delete('/call-flows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any phone numbers use this flow
    const check = await db.query(
      'SELECT COUNT(*) as count FROM phone_numbers WHERE call_flow_id = $1',
      [id]
    );

    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete call flow: it is assigned to phone numbers',
      });
    }

    await db.query('DELETE FROM call_flows WHERE id = $1', [id]);

    res.json({ success: true, message: 'Call flow deleted' });
  } catch (error) {
    console.error('Error deleting call flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 4.3 UPLOAD AUDIO FILES
// =====================================================

/**
 * POST /api/audio-files
 * Upload an audio file for greetings, IVR prompts, or hold music
 */
router.post('/audio-files', upload.single('file'), async (req, res) => {
  try {
    const { name, type = 'greeting' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // For now, store as base64 data URL (in production, upload to S3)
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    // Estimate duration (rough: 1 second per 16KB for MP3)
    const durationSeconds = Math.round(file.size / 16000);

    const result = await db.query(
      `INSERT INTO audio_files (name, file_type, mime_type, file_url, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, file.mimetype, dataUrl, durationSeconds]
    );

    const audio = result.rows[0];

    res.status(201).json({
      id: audio.id,
      name: audio.name,
      fileType: audio.file_type,
      mimeType: audio.mime_type,
      durationSeconds: audio.duration_seconds,
      createdAt: audio.created_at,
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/audio-files
 * List all audio files
 */
router.get('/audio-files', async (req, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM audio_files';
    const values = [];

    if (type) {
      query += ' WHERE file_type = $1';
      values.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, values);

    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      fileType: row.file_type,
      mimeType: row.mime_type,
      fileUrl: row.file_url,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error listing audio files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/audio-files/:id
 * Delete an audio file
 */
router.delete('/audio-files/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if used by any call flow
    const check = await db.query(
      'SELECT COUNT(*) as count FROM call_flows WHERE greeting_audio_id = $1',
      [id]
    );

    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete: audio file is used by call flows',
      });
    }

    await db.query('DELETE FROM audio_files WHERE id = $1', [id]);

    res.json({ success: true, message: 'Audio file deleted' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
