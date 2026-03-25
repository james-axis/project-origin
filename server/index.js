/**
 * Axis CRM Backend Server
 * Twilio Integration - Complete Self-Service Platform
 * 
 * Tech Stack:
 * - Express.js
 * - PostgreSQL
 * - Twilio Node SDK
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './lib/db.js';

// Route imports - all 10 stages
import stage1Routes from './routes/stage1-regulatory.js';
import stage2Routes from './routes/stage2-phone-numbers.js';
import stage4Routes from './routes/stage4-call-flows.js';
import stage5Routes from './routes/stage5-inbound.js';
import stage6Routes from './routes/stage6-outbound.js';
import stage7Routes from './routes/stage7-recordings.js';
import stage8Routes from './routes/stage8-transcription.js';
import stage9Routes from './routes/stage9-softphone.js';
import stage10Routes from './routes/stage10-reporting.js';

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

// URL-encoded body parser (for Twilio webhooks)
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
    version: '1.0.0',
    stages: {
      stage1: 'regulatory',
      stage2: 'phone-numbers',
      stage3: 'region-config',
      stage4: 'call-flows',
      stage5: 'inbound',
      stage6: 'outbound',
      stage7: 'recordings',
      stage8: 'transcription',
      stage9: 'softphone',
      stage10: 'reporting',
    },
    env: {
      twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID,
      databaseConfigured: !!process.env.DATABASE_URL,
    },
  });
});

// =====================================================
// API ROUTES - ALL 10 STAGES
// =====================================================

// Stage 1: Business Address & Regulatory Setup
app.use('/api/twilio', stage1Routes);

// Stage 2: Phone Number Purchase
app.use('/api/twilio', stage2Routes);

// Stage 4: Call Flows & IVR Configuration
app.use('/api', stage4Routes);

// Stage 5: Inbound Call Handling (webhooks)
app.use('/webhooks', stage5Routes);

// Stage 6: Outbound Calls (click-to-call)
app.use('/api', stage6Routes);
app.use('/webhooks', stage6Routes); // outbound-twiml webhook

// Stage 7: Recording Storage
app.use('/api', stage7Routes);
app.use('', stage7Routes); // recording-status webhook at /webhooks

// Stage 8: Transcription
app.use('/api', stage8Routes);
app.use('', stage8Routes); // transcription-status webhook at /webhooks

// Stage 9: In-Browser Softphone
app.use('/api/twilio', stage9Routes);
app.use('/webhooks', stage9Routes); // softphone-twiml webhook

// Stage 10: Call History & Reporting
app.use('/api', stage10Routes);

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
║           AXIS CRM - TWILIO BACKEND                   ║
╠═══════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                          ║
║                                                       ║
║  Stage 1: Business Address & Regulatory Setup ✅      ║
║  Stage 2: Phone Number Purchase ✅                    ║
║  Stage 3: Region Configuration ✅ (built-in)          ║
║  Stage 4: Call Flow & IVR ✅                          ║
║  Stage 5: Inbound Call Handling ✅                    ║
║  Stage 6: Outbound Calls ✅                           ║
║  Stage 7: Recording Storage ✅                        ║
║  Stage 8: Transcription ✅                            ║
║  Stage 9: In-Browser Softphone ✅                     ║
║  Stage 10: Call History & Reporting ✅                ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

export default app;
