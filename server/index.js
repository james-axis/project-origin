/**
 * Axis CRM Backend Server
 * Telnyx Integration - Complete Self-Service Platform
 * 
 * Tech Stack:
 * - Express.js
 * - PostgreSQL
 * - Telnyx Node SDK
 * - Telnyx WebRTC SDK (frontend)
 * 
 * Telnyx offers 30-50% cost savings over Twilio with full feature parity
 * and a Sydney Point of Presence for low-latency Australian calls.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './lib/db.js';

// Route imports - all stages
import stage1Routes from './routes/stage1-applications.js';  // Call Control Apps
import stage2Routes from './routes/stage2-phone-numbers.js'; // Phone Number Purchase
import stage3Routes from './routes/stage3-inbound.js';       // Inbound Call Handling + Call Flows
import stage4Routes from './routes/stage4-recording.js';     // Recording & Transcription
import stage5Routes from './routes/stage5-outbound.js';      // Outbound Calls
import stage6Routes from './routes/stage6-softphone.js';     // WebRTC Softphone
import stage7Routes from './routes/stage7-sms.js';           // SMS Integration
import reportingRoutes from './routes/reporting.js';         // Call History & Reports
import practicesRoutes from './routes/practices.js';         // Practices Management
import callFlowsRoutes from './routes/call-flows.js';        // Call Flows Configuration

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// AUTO-MIGRATE DATABASE ON STARTUP
// =====================================================

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    const schemaPath = join(__dirname, 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('✅ Database migrations complete');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't exit - tables may already exist
  }
}

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS - allow frontend and any origin for webhooks
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// JSON body parser
app.use(express.json());

// URL-encoded body parser (for webhooks)
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    provider: 'telnyx',
    stages: {
      stage1: 'call-control-apps',
      stage2: 'phone-numbers',
      stage3: 'inbound-calls',
      stage4: 'recording-transcription',
      stage5: 'outbound-calls',
      stage6: 'webrtc-softphone',
      stage7: 'sms',
    },
    env: {
      telnyxConfigured: !!process.env.TELNYX_API_KEY,
      databaseConfigured: !!process.env.DATABASE_URL,
    },
  });
});

// =====================================================
// DATABASE MIGRATION ENDPOINT (for manual trigger)
// =====================================================

app.post('/migrate', async (req, res) => {
  try {
    console.log('🔄 Manual migration triggered...');
    const schemaPath = join(__dirname, 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('✅ Manual migration complete');
    
    // Verify tables exist
    const tablesResult = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      message: 'Database migration complete',
      tables: tablesResult.rows.map(r => r.table_name),
    });
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail || null,
    });
  }
});

app.get('/tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// API ROUTES - ALL STAGES
// =====================================================

// Stage 1: Call Control Applications
app.use('/api/telnyx', stage1Routes);

// Stage 2: Phone Number Purchase
app.use('/api/telnyx', stage2Routes);

// Stage 3: Inbound Call Handling + Call Flows
app.use('/webhooks', stage3Routes);  // Webhooks at /webhooks/telnyx/voice
app.use('/api', stage3Routes);       // Call flows at /api/call-flows

// Stage 4: Recording & Transcription
app.use('/api', stage4Routes);

// Stage 5: Outbound Calls
app.use('/api', stage5Routes);

// Stage 6: WebRTC Softphone
app.use('/api/telnyx', stage6Routes);
app.use('/webhooks', stage6Routes);  // Softphone webhook at /webhooks/telnyx/softphone

// Stage 7: SMS
app.use('/api', stage7Routes);
app.use('/webhooks', stage7Routes);  // SMS webhook at /webhooks/telnyx/sms

// Practices Management
app.use('/api/telnyx/practices', practicesRoutes);

// Call Flows Configuration
app.use('/api/call-flows', callFlowsRoutes);

// Reporting & Call History
app.use('/api', reportingRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
  // Run migrations first
  await runMigrations();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║           AXIS CRM - TELNYX BACKEND                   ║
╠═══════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                          ║
║                                                       ║
║  Provider: Telnyx (30-50% cost savings vs Twilio)     ║
║  Sydney PoP: Low-latency Australian calls             ║
║                                                       ║
║  Stage 1: Call Control Applications ✅                ║
║  Stage 2: Phone Number Purchase ✅                    ║
║  Stage 3: Inbound Call Handling ✅                    ║
║  Stage 4: Recording & Transcription ✅                ║
║  Stage 5: Outbound Calls ✅                           ║
║  Stage 6: WebRTC Softphone ✅                         ║
║  Stage 7: SMS Integration ✅                          ║
║  Reporting & Call History ✅                          ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

export default app;
