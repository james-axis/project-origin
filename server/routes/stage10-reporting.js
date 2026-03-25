/**
 * Stage 10: Call History & Reporting
 * 
 * Expose call data through CRM endpoints for UI display
 * and reporting.
 */

import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();

// =====================================================
// 10.1 CALL HISTORY ENDPOINTS
// =====================================================

/**
 * GET /api/calls
 * List calls with filters
 */
router.get('/calls', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      direction,
      status,
      phoneNumberId,
      callFlowId,
      startDate,
      endDate,
      hasRecording,
      hasTranscript,
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic query
    let query = `
      SELECT 
        cl.*,
        pn.friendly_name as phone_number_name,
        cf.name as call_flow_name
      FROM call_logs cl
      LEFT JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      LEFT JOIN call_flows cf ON cl.call_flow_id = cf.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (direction) {
      query += ` AND cl.direction = $${paramIndex++}`;
      params.push(direction);
    }

    if (status) {
      query += ` AND cl.call_status = $${paramIndex++}`;
      params.push(status);
    }

    if (phoneNumberId) {
      query += ` AND cl.phone_number_id = $${paramIndex++}`;
      params.push(phoneNumberId);
    }

    if (callFlowId) {
      query += ` AND cl.call_flow_id = $${paramIndex++}`;
      params.push(callFlowId);
    }

    if (startDate) {
      query += ` AND cl.created_at >= $${paramIndex++}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND cl.created_at <= $${paramIndex++}`;
      params.push(new Date(endDate));
    }

    if (hasRecording === 'true') {
      query += ` AND cl.recording_url IS NOT NULL`;
    }

    if (hasTranscript === 'true') {
      query += ` AND cl.transcript IS NOT NULL`;
    }

    if (search) {
      query += ` AND (cl.from_number ILIKE $${paramIndex} OR cl.to_number ILIKE $${paramIndex} OR cl.transcript ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count query (without pagination)
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
    
    // Add ordering and pagination
    query += ` ORDER BY cl.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)), // Remove limit/offset params
    ]);

    res.json({
      calls: result.rows.map(row => ({
        callSid: row.call_sid,
        parentCallSid: row.parent_call_sid,
        status: row.call_status,
        direction: row.direction,
        from: row.from_number,
        to: row.to_number,
        duration: row.duration,
        phoneNumberId: row.phone_number_id,
        phoneNumberName: row.phone_number_name,
        callFlowId: row.call_flow_id,
        callFlowName: row.call_flow_name,
        recordingUrl: row.recording_url,
        recordingDuration: row.recording_duration,
        hasRecording: !!row.recording_url,
        hasTranscript: !!row.transcript,
        digitsPressed: row.digits_pressed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List calls error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calls/:callSid
 * Get call details
 */
router.get('/calls/:callSid/details', async (req, res) => {
  try {
    const { callSid } = req.params;

    const result = await db.query(
      `SELECT 
        cl.*,
        pn.phone_number as twilio_number,
        pn.friendly_name as phone_number_name,
        cf.name as call_flow_name,
        cf.route_type
       FROM call_logs cl
       LEFT JOIN phone_numbers pn ON cl.phone_number_id = pn.id
       LEFT JOIN call_flows cf ON cl.call_flow_id = cf.id
       WHERE cl.call_sid = $1`,
      [callSid]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const row = result.rows[0];

    res.json({
      callSid: row.call_sid,
      parentCallSid: row.parent_call_sid,
      status: row.call_status,
      direction: row.direction,
      from: row.from_number,
      to: row.to_number,
      duration: row.duration,
      twilioNumber: row.twilio_number,
      phoneNumberName: row.phone_number_name,
      callFlowName: row.call_flow_name,
      routeType: row.route_type,
      recording: row.recording_url ? {
        url: row.recording_url,
        sid: row.recording_sid,
        duration: row.recording_duration,
        streamUrl: `/api/calls/${callSid}/recording/stream`,
      } : null,
      transcript: row.transcript,
      digitsPressed: row.digits_pressed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get call details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 10.2 REPORTING QUERIES
// =====================================================

/**
 * GET /api/reports/call-volume
 * Call volume by date
 */
router.get('/reports/call-volume', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    let query = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as period,
        direction,
        COUNT(*) as count
      FROM call_logs
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY period, direction ORDER BY period DESC`;

    const result = await db.query(query, params);

    // Restructure data
    const volumeByPeriod = {};
    result.rows.forEach(row => {
      if (!volumeByPeriod[row.period]) {
        volumeByPeriod[row.period] = { inbound: 0, outbound: 0, total: 0 };
      }
      if (row.direction?.includes('inbound')) {
        volumeByPeriod[row.period].inbound += parseInt(row.count);
      } else {
        volumeByPeriod[row.period].outbound += parseInt(row.count);
      }
      volumeByPeriod[row.period].total += parseInt(row.count);
    });

    res.json({
      groupBy,
      data: Object.entries(volumeByPeriod).map(([period, counts]) => ({
        period,
        ...counts,
      })),
    });
  } catch (error) {
    console.error('Call volume report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/call-duration
 * Average call duration statistics
 */
router.get('/reports/call-duration', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        direction,
        COUNT(*) as call_count,
        AVG(duration) as avg_duration,
        MIN(duration) as min_duration,
        MAX(duration) as max_duration,
        SUM(duration) as total_duration
      FROM call_logs
      WHERE duration IS NOT NULL
    `;
    const params = [];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY direction`;

    const result = await db.query(query, params);

    res.json({
      byDirection: result.rows.map(row => ({
        direction: row.direction,
        callCount: parseInt(row.call_count),
        avgDuration: Math.round(parseFloat(row.avg_duration) || 0),
        minDuration: parseInt(row.min_duration) || 0,
        maxDuration: parseInt(row.max_duration) || 0,
        totalDuration: parseInt(row.total_duration) || 0,
      })),
    });
  } catch (error) {
    console.error('Call duration report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/call-status
 * Calls by status (completed, missed, busy, etc)
 */
router.get('/reports/call-status', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        call_status,
        COUNT(*) as count
      FROM call_logs
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY call_status ORDER BY count DESC`;

    const result = await db.query(query, params);

    // Calculate missed call rate
    const totalCalls = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const missedCalls = result.rows
      .filter(row => ['no-answer', 'busy', 'failed', 'canceled'].includes(row.call_status))
      .reduce((sum, row) => sum + parseInt(row.count), 0);

    res.json({
      byStatus: result.rows.map(row => ({
        status: row.call_status,
        count: parseInt(row.count),
        percentage: totalCalls > 0 ? Math.round((parseInt(row.count) / totalCalls) * 100) : 0,
      })),
      summary: {
        total: totalCalls,
        missed: missedCalls,
        missedRate: totalCalls > 0 ? Math.round((missedCalls / totalCalls) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Call status report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/ivr-usage
 * IVR option distribution
 */
router.get('/reports/ivr-usage', async (req, res) => {
  try {
    const { startDate, endDate, callFlowId } = req.query;

    let query = `
      SELECT 
        digits_pressed,
        cf.name as call_flow_name,
        COUNT(*) as count
      FROM call_logs cl
      LEFT JOIN call_flows cf ON cl.call_flow_id = cf.id
      WHERE digits_pressed IS NOT NULL
    `;
    const params = [];

    if (startDate) {
      query += ` AND cl.created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND cl.created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    if (callFlowId) {
      query += ` AND cl.call_flow_id = $${params.length + 1}`;
      params.push(callFlowId);
    }

    query += ` GROUP BY digits_pressed, cf.name ORDER BY count DESC`;

    const result = await db.query(query, params);

    res.json({
      ivrUsage: result.rows.map(row => ({
        digit: row.digits_pressed,
        callFlowName: row.call_flow_name,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error('IVR usage report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/phone-numbers
 * Call volume by phone number
 */
router.get('/reports/phone-numbers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        pn.phone_number,
        pn.friendly_name,
        pn.number_type,
        COUNT(*) as total_calls,
        SUM(CASE WHEN cl.direction LIKE 'inbound%' THEN 1 ELSE 0 END) as inbound_calls,
        SUM(CASE WHEN cl.direction LIKE 'outbound%' THEN 1 ELSE 0 END) as outbound_calls,
        AVG(cl.duration) as avg_duration
      FROM phone_numbers pn
      LEFT JOIN call_logs cl ON pn.id = cl.phone_number_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND cl.created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND cl.created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    query += ` GROUP BY pn.id ORDER BY total_calls DESC`;

    const result = await db.query(query, params);

    res.json({
      phoneNumbers: result.rows.map(row => ({
        phoneNumber: row.phone_number,
        friendlyName: row.friendly_name,
        type: row.number_type,
        totalCalls: parseInt(row.total_calls) || 0,
        inboundCalls: parseInt(row.inbound_calls) || 0,
        outboundCalls: parseInt(row.outbound_calls) || 0,
        avgDuration: Math.round(parseFloat(row.avg_duration) || 0),
      })),
    });
  } catch (error) {
    console.error('Phone numbers report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/summary
 * Overall call summary dashboard
 */
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ` AND created_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      dateFilter += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(endDate));
    }

    // Total calls
    const totalResult = await db.query(
      `SELECT COUNT(*) FROM call_logs WHERE 1=1 ${dateFilter}`,
      params
    );

    // Inbound/Outbound
    const directionResult = await db.query(
      `SELECT 
        SUM(CASE WHEN direction LIKE 'inbound%' THEN 1 ELSE 0 END) as inbound,
        SUM(CASE WHEN direction LIKE 'outbound%' THEN 1 ELSE 0 END) as outbound
       FROM call_logs WHERE 1=1 ${dateFilter}`,
      params
    );

    // Average duration
    const durationResult = await db.query(
      `SELECT AVG(duration) as avg_duration, SUM(duration) as total_duration
       FROM call_logs WHERE duration IS NOT NULL ${dateFilter}`,
      params
    );

    // Missed calls
    const missedResult = await db.query(
      `SELECT COUNT(*) FROM call_logs 
       WHERE call_status IN ('no-answer', 'busy', 'failed') ${dateFilter}`,
      params
    );

    // Recordings
    const recordingsResult = await db.query(
      `SELECT COUNT(*) FROM call_logs WHERE recording_url IS NOT NULL ${dateFilter}`,
      params
    );

    // Transcripts
    const transcriptsResult = await db.query(
      `SELECT COUNT(*) FROM call_logs WHERE transcript IS NOT NULL ${dateFilter}`,
      params
    );

    res.json({
      totalCalls: parseInt(totalResult.rows[0].count),
      inboundCalls: parseInt(directionResult.rows[0].inbound) || 0,
      outboundCalls: parseInt(directionResult.rows[0].outbound) || 0,
      avgDuration: Math.round(parseFloat(durationResult.rows[0].avg_duration) || 0),
      totalDuration: parseInt(durationResult.rows[0].total_duration) || 0,
      missedCalls: parseInt(missedResult.rows[0].count),
      recordingsCount: parseInt(recordingsResult.rows[0].count),
      transcriptsCount: parseInt(transcriptsResult.rows[0].count),
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
