/**
 * Stage 8: Call Transcription
 * 
 * Receive transcription chunks from Twilio, assemble into
 * full transcript, store in call_logs.
 */

import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();

// =====================================================
// 8.1 TRANSCRIPTION WEBHOOK
// =====================================================

/**
 * POST /webhooks/transcription-status
 * Handle transcription updates from Twilio
 */
router.post('/webhooks/transcription-status', async (req, res) => {
  try {
    const {
      CallSid,
      TranscriptionSid,
      TranscriptionStatus,
      TranscriptionText,
      Track,           // 'inbound' or 'outbound'
      SequenceId,
      Final,           // true when transcription is complete
    } = req.body;

    console.log(`📝 Transcription [${Track}]: ${TranscriptionText?.substring(0, 50)}...`);

    if (TranscriptionText) {
      // Store chunk in transcript_chunks table
      await db.query(
        `INSERT INTO transcript_chunks 
          (call_sid, text, track, sequence_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [CallSid, TranscriptionText, Track, SequenceId ? parseInt(SequenceId) : 0]
      );
    }

    // When transcription is complete, assemble full transcript
    if (TranscriptionStatus === 'completed' || Final === 'true') {
      await assembleTranscript(CallSid);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Transcription webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * Assemble chunks into full transcript
 */
async function assembleTranscript(callSid) {
  try {
    // Get all chunks ordered by track and sequence
    const result = await db.query(
      `SELECT text, track, sequence_id
       FROM transcript_chunks
       WHERE call_sid = $1
       ORDER BY sequence_id ASC`,
      [callSid]
    );

    if (result.rows.length === 0) return;

    // Format transcript with speaker labels
    const formattedLines = result.rows.map(row => {
      const speaker = row.track === 'inbound' ? 'Customer' : 'Agent';
      return `[${speaker}]: ${row.text}`;
    });

    const fullTranscript = formattedLines.join('\n');

    // Update call_logs with assembled transcript
    await db.query(
      `UPDATE call_logs 
       SET transcript = $1, updated_at = NOW()
       WHERE call_sid = $2`,
      [fullTranscript, callSid]
    );

    console.log(`✅ Transcript assembled for call ${callSid} (${result.rows.length} chunks)`);
  } catch (error) {
    console.error('Assemble transcript error:', error);
  }
}

// =====================================================
// 8.2 TRANSCRIPT ENDPOINT
// =====================================================

/**
 * GET /api/calls/:callSid/transcript
 * Get full transcript for a call
 */
router.get('/calls/:callSid/transcript', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT transcript, from_number, to_number, direction, created_at
       FROM call_logs
       WHERE call_sid = $1`,
      [callSid]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const row = result.rows[0];

    if (!row.transcript) {
      // Check if chunks exist but haven't been assembled
      const chunksResult = await db.query(
        `SELECT COUNT(*) FROM transcript_chunks WHERE call_sid = $1`,
        [callSid]
      );

      if (parseInt(chunksResult.rows[0].count) > 0) {
        await assembleTranscript(callSid);
        // Fetch again
        const updated = await db.query(
          `SELECT transcript FROM call_logs WHERE call_sid = $1`,
          [callSid]
        );
        return res.json({
          callSid,
          transcript: updated.rows[0]?.transcript || null,
          status: 'assembled',
        });
      }

      return res.json({
        callSid,
        transcript: null,
        status: 'no_transcript',
      });
    }

    res.json({
      callSid,
      transcript: row.transcript,
      from: row.from_number,
      to: row.to_number,
      direction: row.direction,
      createdAt: row.created_at,
      status: 'available',
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calls/:callSid/transcript/chunks
 * Get raw transcript chunks (for debugging)
 */
router.get('/calls/:callSid/transcript/chunks', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT text, track, sequence_id, created_at
       FROM transcript_chunks
       WHERE call_sid = $1
       ORDER BY sequence_id ASC`,
      [callSid]
    );

    res.json({
      callSid,
      chunks: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get chunks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TRANSCRIPTS LIST
// =====================================================

/**
 * GET /api/transcripts
 * List all calls with transcripts
 */
router.get('/transcripts', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        call_sid, transcript, from_number, to_number, direction, 
        duration, created_at
      FROM call_logs
      WHERE transcript IS NOT NULL
    `;
    const params = [];

    // Add search filter
    if (search) {
      query += ` AND transcript ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) FROM call_logs WHERE transcript IS NOT NULL`;
    const countParams = [];
    if (search) {
      countQuery += ` AND transcript ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      transcripts: result.rows.map(row => ({
        callSid: row.call_sid,
        transcript: row.transcript,
        from: row.from_number,
        to: row.to_number,
        direction: row.direction,
        duration: row.duration,
        createdAt: row.created_at,
        // Preview (first 200 chars)
        preview: row.transcript?.substring(0, 200) + (row.transcript?.length > 200 ? '...' : ''),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List transcripts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:callSid/transcript/regenerate
 * Force regenerate transcript from chunks
 */
router.post('/calls/:callSid/transcript/regenerate', async (req, res) => {
  try {
    const { callSid } = req.params;

    await assembleTranscript(callSid);

    const result = await db.query(
      `SELECT transcript FROM call_logs WHERE call_sid = $1`,
      [callSid]
    );

    res.json({
      success: true,
      callSid,
      transcript: result.rows[0]?.transcript || null,
    });
  } catch (error) {
    console.error('Regenerate transcript error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
