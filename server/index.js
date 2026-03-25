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

// Route imports (will add more as we progress through stages)
import stage1Routes from './routes/stage1-regulatory.js';

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS - allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    env: {
      twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID,
      databaseConfigured: !!process.env.DATABASE_URL,
    },
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Stage 1: Business Address & Regulatory Setup
app.use('/api/twilio', stage1Routes);

// Stage 2-10 routes will be added as we progress
// app.use('/api/twilio', stage2Routes);
// etc.

// =====================================================
// WEBHOOK ROUTES (Twilio callbacks)
// =====================================================

// Placeholder - will be implemented in Stage 5
app.post('/webhooks/twiml', (req, res) => {
  res.type('text/xml');
  res.send('<Response><Say>Phone system not yet configured.</Say></Response>');
});

app.post('/webhooks/status-callback', (req, res) => {
  console.log('Status callback:', req.body);
  res.sendStatus(200);
});

app.post('/webhooks/recording-status', (req, res) => {
  console.log('Recording status:', req.body);
  res.sendStatus(200);
});

app.post('/webhooks/transcription-status', (req, res) => {
  console.log('Transcription status:', req.body);
  res.sendStatus(200);
});

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

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           AXIS CRM - TWILIO BACKEND                   ║
╠═══════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                          ║
║                                                       ║
║  Stage 1: Business Address & Regulatory Setup ✅      ║
║  Stage 2: Phone Number Purchase (pending)             ║
║  Stage 3: Region Configuration (pending)              ║
║  Stage 4: Call Flow & IVR (pending)                   ║
║  Stage 5: Inbound Call Handling (pending)             ║
║  Stage 6: Outbound Calls (pending)                    ║
║  Stage 7: Recording Storage (pending)                 ║
║  Stage 8: Transcription (pending)                     ║
║  Stage 9: In-Browser Softphone (pending)              ║
║  Stage 10: Call History & Reporting (pending)         ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
