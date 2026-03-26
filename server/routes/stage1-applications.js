/**
 * Stage 1: Call Control Application Setup
 * 
 * Telnyx uses Call Control Applications as a central configuration
 * that multiple numbers can share. This replaces Twilio's TwiML App concept.
 */

import { Router } from 'express';
import Telnyx from 'telnyx';
import db from '../lib/db.js';

const router = Router();

// Initialize Telnyx client
const telnyx = Telnyx(process.env.TELNYX_API_KEY);
const BASE_URL = process.env.BASE_URL || 'https://api.axiscrm.com.au';

// =====================================================
// GET /api/telnyx/applications
// List all Call Control Applications
// =====================================================
router.get('/applications', async (req, res) => {
  try {
    // Get from database
    const result = await db.query(`
      SELECT * FROM call_control_apps ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      applications: result.rows,
    });
  } catch (error) {
    console.error('Error listing applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/telnyx/applications
// Create a new Call Control Application
// =====================================================
router.post('/applications', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Application name is required' });
  }
  
  try {
    // Create in Telnyx
    const webhookUrl = `${BASE_URL}/webhooks/telnyx/voice`;
    
    const telnyxApp = await telnyx.callControlApplications.create({
      application_name: name,
      webhook_event_url: webhookUrl,
      webhook_api_version: '2',
    });
    
    // Store in database
    const result = await db.query(`
      INSERT INTO call_control_apps (app_id, name, webhook_url, webhook_api_version)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [telnyxApp.data.id, name, webhookUrl, '2']);
    
    res.json({
      success: true,
      application: result.rows[0],
      telnyx: telnyxApp.data,
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// GET /api/telnyx/applications/:id
// Get a specific application
// =====================================================
router.get('/applications/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT * FROM call_control_apps WHERE id = $1 OR app_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({
      success: true,
      application: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DELETE /api/telnyx/applications/:id
// Delete an application
// =====================================================
router.delete('/applications/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the app first
    const appResult = await db.query(`
      SELECT * FROM call_control_apps WHERE id = $1 OR app_id = $1
    `, [id]);
    
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const app = appResult.rows[0];
    
    // Delete from Telnyx
    if (app.app_id) {
      try {
        await telnyx.callControlApplications.del(app.app_id);
      } catch (e) {
        console.warn('Telnyx delete failed (may already be deleted):', e.message);
      }
    }
    
    // Delete from database
    await db.query(`DELETE FROM call_control_apps WHERE id = $1`, [app.id]);
    
    res.json({
      success: true,
      message: 'Application deleted',
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/telnyx/applications/setup
// Auto-setup: Create default application if none exists
// =====================================================
router.post('/applications/setup', async (req, res) => {
  try {
    // Check if we already have an application
    const existing = await db.query(`SELECT * FROM call_control_apps LIMIT 1`);
    
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Application already exists',
        application: existing.rows[0],
        created: false,
      });
    }
    
    // Create new application
    const webhookUrl = `${BASE_URL}/webhooks/telnyx/voice`;
    
    const telnyxApp = await telnyx.callControlApplications.create({
      application_name: 'Axis CRM Inbound',
      webhook_event_url: webhookUrl,
      webhook_api_version: '2',
    });
    
    // Store in database
    const result = await db.query(`
      INSERT INTO call_control_apps (app_id, name, webhook_url, webhook_api_version)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [telnyxApp.data.id, 'Axis CRM Inbound', webhookUrl, '2']);
    
    res.json({
      success: true,
      message: 'Application created',
      application: result.rows[0],
      created: true,
    });
  } catch (error) {
    console.error('Error in auto-setup:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
