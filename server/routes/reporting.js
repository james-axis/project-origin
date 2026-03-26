/**
 * Call History & Reporting
 * 
 * View call logs, generate reports, and analyze call data.
 */

import { Router } from 'express';
import db from '../lib/db.js';

const router = Router();

// =====================================================
// GET /api/call-history
// List all calls with pagination and filters
// =====================================================
router.get('/call-history', async (req, res) => {
  const {
    limit = 50,
    offset = 0,
    direction,
    state,
    from,
    to,
    startDate,
    endDate,
  } = req.query;
  
  try {
    let query = `
      SELECT 
        cl.*,
        pn.phone_number as phone_number_display,
        cf.name as call_flow_name
      FROM call_logs cl
      LEFT JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      LEFT JOIN call_flows cf ON cl.call_flow_id = cf.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;
    
    if (direction) {
      query += ` AND cl.direction = $${paramIndex++}`;
      values.push(direction);
    }
    
    if (state) {
      query += ` AND cl.state = $${paramIndex++}`;
      values.push(state);
    }
    
    if (from) {
      query += ` AND cl.from_number LIKE $${paramIndex++}`;
      values.push(`%${from}%`);
    }
    
    if (to) {
      query += ` AND cl.to_number LIKE $${paramIndex++}`;
      values.push(`%${to}%`);
    }
    
    if (startDate) {
      query += ` AND cl.created_at >= $${paramIndex++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND cl.created_at <= $${paramIndex++}`;
      values.push(endDate);
    }
    
    query += ` ORDER BY cl.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, values);
    
    // Count total (reuse filters except limit/offset)
    let countQuery = `SELECT COUNT(*) FROM call_logs cl WHERE 1=1`;
    const countValues = values.slice(0, -2); // Remove limit and offset
    let countParamIndex = 1;
    
    if (direction) {
      countQuery += ` AND cl.direction = $${countParamIndex++}`;
    }
    if (state) {
      countQuery += ` AND cl.state = $${countParamIndex++}`;
    }
    if (from) {
      countQuery += ` AND cl.from_number LIKE $${countParamIndex++}`;
    }
    if (to) {
      countQuery += ` AND cl.to_number LIKE $${countParamIndex++}`;
    }
    if (startDate) {
      countQuery += ` AND cl.created_at >= $${countParamIndex++}`;
    }
    if (endDate) {
      countQuery += ` AND cl.created_at <= $${countParamIndex++}`;
    }
    
    const countResult = await db.query(countQuery, countValues);
    
    res.json({
      success: true,
      calls: result.rows,
      total: parseInt(countResult.rows[0].count),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error listing call history:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/call-history/:id
// Get specific call details
// =====================================================
router.get('/call-history/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cl.*,
        pn.phone_number as phone_number_display,
        cf.name as call_flow_name
      FROM call_logs cl
      LEFT JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      LEFT JOIN call_flows cf ON cl.call_flow_id = cf.id
      WHERE cl.id = $1 OR cl.call_control_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json({
      success: true,
      call: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/reports/summary
// Get call summary statistics
// =====================================================
router.get('/reports/summary', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let dateFilter = '';
    const values = [];
    
    if (startDate) {
      dateFilter += ` AND created_at >= $1`;
      values.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${values.length + 1}`;
      values.push(endDate);
    }
    
    // Total calls
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM call_logs WHERE 1=1 ${dateFilter}
    `, values);
    
    // By direction
    const directionResult = await db.query(`
      SELECT direction, COUNT(*) as count 
      FROM call_logs WHERE 1=1 ${dateFilter}
      GROUP BY direction
    `, values);
    
    // By state
    const stateResult = await db.query(`
      SELECT state, COUNT(*) as count 
      FROM call_logs WHERE 1=1 ${dateFilter}
      GROUP BY state
    `, values);
    
    // Average duration
    const durationResult = await db.query(`
      SELECT 
        AVG(duration_seconds) as avg_duration,
        SUM(duration_seconds) as total_duration,
        MAX(duration_seconds) as max_duration
      FROM call_logs WHERE 1=1 ${dateFilter}
    `, values);
    
    // Calls with recordings
    const recordingResult = await db.query(`
      SELECT COUNT(*) as count FROM call_logs 
      WHERE recording_url IS NOT NULL ${dateFilter}
    `, values);
    
    // Calls with transcripts
    const transcriptResult = await db.query(`
      SELECT COUNT(*) as count FROM call_logs 
      WHERE transcript IS NOT NULL AND transcript != '' ${dateFilter}
    `, values);
    
    res.json({
      success: true,
      summary: {
        totalCalls: parseInt(totalResult.rows[0].total),
        byDirection: directionResult.rows.reduce((acc, row) => {
          acc[row.direction] = parseInt(row.count);
          return acc;
        }, {}),
        byState: stateResult.rows.reduce((acc, row) => {
          acc[row.state] = parseInt(row.count);
          return acc;
        }, {}),
        duration: {
          average: parseFloat(durationResult.rows[0].avg_duration) || 0,
          total: parseInt(durationResult.rows[0].total_duration) || 0,
          max: parseInt(durationResult.rows[0].max_duration) || 0,
        },
        withRecording: parseInt(recordingResult.rows[0].count),
        withTranscript: parseInt(transcriptResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/reports/daily
// Get daily call statistics
// =====================================================
router.get('/reports/daily', async (req, res) => {
  const { days = 30 } = req.query;
  
  try {
    const result = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound,
        AVG(duration_seconds) as avg_duration,
        SUM(duration_seconds) as total_duration
      FROM call_logs
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      daily: result.rows.map(row => ({
        date: row.date,
        totalCalls: parseInt(row.total_calls),
        inbound: parseInt(row.inbound),
        outbound: parseInt(row.outbound),
        avgDuration: parseFloat(row.avg_duration) || 0,
        totalDuration: parseInt(row.total_duration) || 0,
      })),
    });
  } catch (error) {
    console.error('Error getting daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/reports/hourly
// Get hourly call distribution
// =====================================================
router.get('/reports/hourly', async (req, res) => {
  const { days = 7 } = req.query;
  
  try {
    const result = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM call_logs
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `);
    
    // Fill in missing hours with 0
    const hourly = Array(24).fill(0);
    result.rows.forEach(row => {
      hourly[parseInt(row.hour)] = parseInt(row.count);
    });
    
    res.json({
      success: true,
      hourly: hourly.map((count, hour) => ({ hour, count })),
    });
  } catch (error) {
    console.error('Error getting hourly report:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
