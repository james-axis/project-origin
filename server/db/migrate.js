/**
 * Database Migration Script
 * Run with: npm run db:migrate
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running database migrations...');
    
    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database migration complete!');
    console.log('');
    console.log('Tables created:');
    console.log('  - twilio_addresses');
    console.log('  - twilio_regulatory_bundles');
    console.log('  - call_flows');
    console.log('  - phone_numbers');
    console.log('  - audio_files');
    console.log('  - call_logs');
    console.log('  - transcript_chunks');
    console.log('  - user_softphone_access');
    console.log('  - phone_settings');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
