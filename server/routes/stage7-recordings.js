/**
 * Stage 7: Call Recording Storage
 * 
 * Receive recording webhooks from Twilio, store MP3 URLs,
 * and provide playback endpoints.
 */

import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// =====================================================
// 7.1 RECORDING STATUS CALLBACK
// =====================================================

/**
 * POST /webhooks/recording-status
 * Handle recording completion webhook from Twilio
 */
router.post('/webhooks/recording-status', async (req, res) => {
  try {
    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingDuration,
      RecordingStatus,
      RecordingChannels,
      RecordingSource,
    } = req.body;

    console.log(`🎙️ Recording: ${RecordingSid} (${RecordingDuration}s) - ${RecordingStatus}`);

    if (RecordingStatus === 'completed') {
      // Store recording URL (add .mp3 extension for playback)
      const recordingUrlMp3 = RecordingUrl + '.mp3';

      await db.query(
        `UPDATE call_logs 
         SET recording_url = $1, 
             recording_sid = $2, 
             recording_duration = $3,
             updated_at = NOW()
         WHERE call_sid = $4`,
        [recordingUrlMp3, RecordingSid, parseInt(RecordingDuration), CallSid]
      );

      console.log(`✅ Recording saved for call ${CallSid}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Recording status error:', error);
    res.sendStatus(500);
  }
});

// =====================================================
// 7.2 RECORDING PLAYBACK
// =====================================================

/**
 * GET /api/calls/:callSid/recording
 * Get recording metadata for a call
 */
router.get('/calls/:callSid/recording', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT recording_url, recording_sid, recording_duration
       FROM call_logs
       WHERE call_sid = $1`,
      [callSid]
    );

    if (!result.rows[0] || !result.rows[0].recording_url) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const row = result.rows[0];

    res.json({
      callSid,
      recordingSid: row.recording_sid,
      recordingUrl: row.recording_url,
      duration: row.recording_duration,
      // Secure URL for playback (goes through our proxy)
      streamUrl: `/api/calls/${callSid}/recording/stream`,
    });
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calls/:callSid/recording/stream
 * Stream recording audio (proxies through server to protect credentials)
 */
router.get('/calls/:callSid/recording/stream', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT recording_url FROM call_logs WHERE call_sid = $1`,
      [callSid]
    );

    if (!result.rows[0] || !result.rows[0].recording_url) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const recordingUrl = result.rows[0].recording_url;

    // Proxy the recording through our server
    // This hides Twilio credentials from the browser
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recording: ${response.status}`);
    }

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${callSid}.mp3"`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Pipe the audio stream
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Stream recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calls/:callSid/recording/download
 * Download recording as file
 */
router.get('/calls/:callSid/recording/download', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT recording_url FROM call_logs WHERE call_sid = $1`,
      [callSid]
    );

    if (!result.rows[0] || !result.rows[0].recording_url) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const recordingUrl = result.rows[0].recording_url;
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recording: ${response.status}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${callSid}.mp3"`);

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Download recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// RECORDINGS LIST
// =====================================================

/**
 * GET /api/recordings
 * List all recordings with pagination
 */
router.get('/recordings', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT 
         call_sid, recording_sid, recording_url, recording_duration,
         from_number, to_number, direction, created_at
       FROM call_logs
       WHERE recording_url IS NOT NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM call_logs WHERE recording_url IS NOT NULL`
    );

    res.json({
      recordings: result.rows.map(row => ({
        callSid: row.call_sid,
        recordingSid: row.recording_sid,
        duration: row.recording_duration,
        from: row.from_number,
        to: row.to_number,
        direction: row.direction,
        createdAt: row.created_at,
        streamUrl: `/api/calls/${row.call_sid}/recording/stream`,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List recordings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/recordings/:recordingSid
 * Delete a recording
 */
router.delete('/recordings/:recordingSid', async (req, res) => {
  try {
    const { recordingSid } = req.params;

    // Delete from Twilio
    const { client } = await import('../lib/twilio.js');
    await client.recordings(recordingSid).remove();

    // Update database
    await db.query(
      `UPDATE call_logs 
       SET recording_url = NULL, recording_sid = NULL, recording_duration = NULL
       WHERE recording_sid = $1`,
      [recordingSid]
    );

    res.json({ success: true, message: 'Recording deleted' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
