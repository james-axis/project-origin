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

// Route imports - all stages (0-10)
import stage0Routes from './routes/stage0-practices.js'; // Single-account architecture
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
      stage0: 'subaccounts',
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

// Targeted migration for Stage 0 tables only
app.post('/migrate-stage0', async (req, res) => {
  try {
    console.log('🔄 Creating Stage 0 tables...');
    
    // Create twilio_practices table
    await db.query(`
      CREATE TABLE IF NOT EXISTS twilio_practices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        practice_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255) NOT NULL,
        abn VARCHAR(20),
        afsl_number VARCHAR(20),
        is_subaccount BOOLEAN DEFAULT FALSE,
        twilio_account_sid VARCHAR(34) UNIQUE,
        twilio_auth_token VARCHAR(100),
        address_sid VARCHAR(34),
        bundle_sid VARCHAR(34),
        bundle_status VARCHAR(50) DEFAULT 'not_started',
        twiml_app_sid VARCHAR(34),
        setup_step VARCHAR(50) DEFAULT 'not_started',
        setup_status VARCHAR(20) DEFAULT 'not_started',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ twilio_practices created');
    
    // Add is_subaccount column if missing (for existing tables)
    await db.query(`
      ALTER TABLE twilio_practices 
      ADD COLUMN IF NOT EXISTS is_subaccount BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ is_subaccount column ensured');
    
    // Create twilio_twiml_apps table
    await db.query(`
      CREATE TABLE IF NOT EXISTS twilio_twiml_apps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        practice_id UUID REFERENCES twilio_practices(id) ON DELETE CASCADE,
        app_sid VARCHAR(34) UNIQUE NOT NULL,
        friendly_name VARCHAR(255),
        voice_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(practice_id)
      )
    `);
    console.log('✅ twilio_twiml_apps created');
    
    // Add practice_id columns to existing tables if missing
    await db.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_flows' AND column_name = 'practice_id') THEN
          ALTER TABLE call_flows ADD COLUMN practice_id UUID REFERENCES twilio_practices(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phone_numbers' AND column_name = 'practice_id') THEN
          ALTER TABLE phone_numbers ADD COLUMN practice_id UUID REFERENCES twilio_practices(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✅ practice_id columns added to existing tables');
    
    // Verify tables
    const tablesResult = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      message: 'Stage 0 tables created successfully',
      tables: tablesResult.rows.map(r => r.table_name),
    });
  } catch (error) {
    console.error('❌ Stage 0 migration failed:', error);
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
// API ROUTES - ALL STAGES (0-10)
// =====================================================

// Stage 0: Practice/Adviser Subaccounts
app.use('/api/twilio', stage0Routes);

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
