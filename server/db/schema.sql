-- =====================================================
-- AXIS CRM TWILIO INTEGRATION SCHEMA
-- PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STAGE 1: Regulatory Compliance
-- =====================================================

-- Business addresses for regulatory compliance
CREATE TABLE IF NOT EXISTS twilio_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_sid VARCHAR(34) UNIQUE NOT NULL,
    friendly_name VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    iso_country VARCHAR(2) NOT NULL DEFAULT 'AU',
    validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulatory bundles linking addresses to identities
CREATE TABLE IF NOT EXISTS twilio_regulatory_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_sid VARCHAR(34) UNIQUE NOT NULL,
    friendly_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending-review, twilio-approved, twilio-rejected
    regulation_sid VARCHAR(34),
    iso_country VARCHAR(2) NOT NULL DEFAULT 'AU',
    number_type VARCHAR(20) NOT NULL, -- local, mobile, toll-free
    address_sid VARCHAR(34) REFERENCES twilio_addresses(address_sid),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 2: Phone Numbers
-- =====================================================

-- Call flows (routing configuration)
CREATE TABLE IF NOT EXISTS call_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    greeting_audio_id UUID,
    greeting_text TEXT,
    route_type VARCHAR(20) NOT NULL DEFAULT 'direct', -- direct, ivr, ring-group
    route_destination VARCHAR(255), -- phone number or client identity
    ivr_config JSONB DEFAULT '{}',
    recording_enabled BOOLEAN DEFAULT TRUE,
    transcription_enabled BOOLEAN DEFAULT FALSE,
    timeout_seconds INTEGER DEFAULT 30,
    fallback_action VARCHAR(20) DEFAULT 'voicemail', -- voicemail, hangup, forward
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchased phone numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number_sid VARCHAR(34) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- E.164 format
    friendly_name VARCHAR(255),
    number_type VARCHAR(20) NOT NULL, -- local, mobile, toll-free
    capabilities JSONB DEFAULT '{"voice": true, "sms": false, "mms": false}',
    region VARCHAR(10) DEFAULT 'au1', -- au1, us1
    voice_url TEXT,
    status_callback TEXT,
    call_flow_id UUID REFERENCES call_flows(id),
    bundle_sid VARCHAR(34) REFERENCES twilio_regulatory_bundles(bundle_sid),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 4: Audio Files
-- =====================================================

-- Uploaded audio files for greetings, IVR prompts, hold music
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- greeting, ivr-prompt, hold-music
    mime_type VARCHAR(50) NOT NULL, -- audio/mpeg, audio/wav
    file_url TEXT NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to call_flows now that audio_files exists
ALTER TABLE call_flows 
    ADD CONSTRAINT fk_greeting_audio 
    FOREIGN KEY (greeting_audio_id) 
    REFERENCES audio_files(id);

-- =====================================================
-- STAGE 5-8: Call Logs & Transcriptions
-- =====================================================

-- Call logs from Twilio webhooks
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_sid VARCHAR(34) UNIQUE NOT NULL,
    parent_call_sid VARCHAR(34),
    call_status VARCHAR(20) NOT NULL, -- queued, ringing, in-progress, completed, busy, failed, no-answer, canceled
    direction VARCHAR(20) NOT NULL, -- inbound, outbound-api, outbound-dial
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    duration INTEGER DEFAULT 0,
    phone_number_id UUID REFERENCES phone_numbers(id),
    call_flow_id UUID REFERENCES call_flows(id),
    recording_url TEXT,
    recording_sid VARCHAR(34),
    recording_duration INTEGER,
    transcript TEXT,
    digits_pressed VARCHAR(50), -- IVR digit presses
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcription chunks (assembled into call_logs.transcript)
CREATE TABLE IF NOT EXISTS transcript_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_sid VARCHAR(34) NOT NULL,
    text TEXT NOT NULL,
    track VARCHAR(20), -- inbound, outbound
    sequence_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 9: Softphone Access
-- =====================================================

-- User softphone access permissions
CREATE TABLE IF NOT EXISTS user_softphone_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL UNIQUE, -- CRM user ID
    identity VARCHAR(100) NOT NULL UNIQUE, -- Twilio client identity
    caller_id VARCHAR(34), -- phone_number_sid for outbound caller ID
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 10: Settings
-- =====================================================

-- System-wide phone settings
CREATE TABLE IF NOT EXISTS phone_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO phone_settings (key, value) VALUES 
    ('recording', '{"enabled": true, "retentionDays": 90}'),
    ('transcription', '{"enabled": false, "aiSummary": false, "language": "en-AU"}'),
    ('region', '{"default": "au1", "edge": "sydney"}')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_from ON call_logs(from_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_to ON call_logs(to_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_call ON transcript_chunks(call_sid, sequence_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(phone_number);
