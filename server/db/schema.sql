-- =====================================================
-- AXIS CRM TELNYX INTEGRATION SCHEMA
-- PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRACTICES
-- Organizational units for phone system management
-- =====================================================

CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    abn VARCHAR(20),
    afsl_number VARCHAR(50),
    is_subaccount BOOLEAN DEFAULT FALSE,
    setup_complete BOOLEAN DEFAULT FALSE,
    telnyx_app_id VARCHAR(100),              -- Associated Call Control App
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 1: Call Control Applications
-- Telnyx Call Control Applications define webhook endpoints
-- =====================================================

CREATE TABLE IF NOT EXISTS call_control_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id VARCHAR(100) UNIQUE,              -- Telnyx: id
    name VARCHAR(255) NOT NULL,              -- Config: Application name
    webhook_url TEXT,                        -- Telnyx: webhook_event_url
    webhook_api_version VARCHAR(10) DEFAULT '2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 2: Phone Numbers
-- Purchased numbers and their configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telnyx_id VARCHAR(100) UNIQUE,           -- Telnyx: id
    phone_number VARCHAR(20) NOT NULL,       -- Telnyx: phone_number (E.164)
    friendly_name VARCHAR(255),              -- User-friendly label
    connection_id VARCHAR(100),              -- Telnyx: connection_id
    number_type VARCHAR(20) NOT NULL DEFAULT 'local', -- local / toll_free
    region VARCHAR(50) DEFAULT 'sydney',     -- Config: sydney / default
    call_flow_id UUID,                       -- FK to call_flows
    practice_id UUID,                        -- FK to practices
    messaging_profile_id VARCHAR(100),       -- Telnyx: messaging_profile_id
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 3: Call Flows
-- Call routing configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS call_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    greeting_audio_id UUID,                  -- FK to audio_files (optional)
    greeting_text TEXT,                      -- Config: TTS greeting text
    route_type VARCHAR(20) NOT NULL DEFAULT 'direct', -- direct / ivr / ring-group
    route_destination VARCHAR(255),          -- Phone number or SIP URI
    ivr_config JSONB DEFAULT '{}',           -- Config: IVR menu options
    recording_enabled BOOLEAN DEFAULT TRUE,
    transcription_enabled BOOLEAN DEFAULT FALSE,
    timeout_seconds INTEGER DEFAULT 30,
    fallback_action VARCHAR(20) DEFAULT 'voicemail', -- voicemail / hangup / forward
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraint after call_flows exists
ALTER TABLE phone_numbers 
    DROP CONSTRAINT IF EXISTS fk_phone_call_flow;
ALTER TABLE phone_numbers 
    ADD CONSTRAINT fk_phone_call_flow 
    FOREIGN KEY (call_flow_id) 
    REFERENCES call_flows(id) ON DELETE SET NULL;

-- =====================================================
-- STAGE 3-5: Call Logs
-- All call data from Telnyx webhooks
-- =====================================================

CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_control_id VARCHAR(100) UNIQUE,     -- Telnyx: call_control_id
    call_leg_id VARCHAR(100),                -- Telnyx: call_leg_id
    call_session_id VARCHAR(100),            -- Telnyx: call_session_id
    state VARCHAR(50),                       -- Telnyx: state (ringing/answered/etc)
    direction VARCHAR(20) NOT NULL,          -- Telnyx: direction
    from_number VARCHAR(50) NOT NULL,        -- Telnyx: from
    to_number VARCHAR(50) NOT NULL,          -- Telnyx: to
    duration_seconds INTEGER DEFAULT 0,      -- Telnyx: duration_seconds
    recording_url TEXT,                      -- Telnyx: recording.media_url
    transcript TEXT,                         -- Assembled from transcription events
    digits_pressed VARCHAR(50),              -- Telnyx: digits (if IVR)
    hangup_cause VARCHAR(100),               -- Telnyx: hangup_cause
    phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
    call_flow_id UUID REFERENCES call_flows(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Audio Files
-- Uploaded audio files for greetings, IVR prompts, hold music
-- =====================================================

CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,          -- greeting, ivr-prompt, hold-music
    mime_type VARCHAR(50) NOT NULL,          -- audio/mpeg, audio/wav
    file_url TEXT NOT NULL,                  -- S3 URL
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraint after audio_files exists
ALTER TABLE call_flows 
    DROP CONSTRAINT IF EXISTS fk_greeting_audio;
ALTER TABLE call_flows 
    ADD CONSTRAINT fk_greeting_audio 
    FOREIGN KEY (greeting_audio_id) 
    REFERENCES audio_files(id) ON DELETE SET NULL;

-- =====================================================
-- Transcript Chunks
-- Real-time transcription chunks assembled into full transcript
-- =====================================================

CREATE TABLE IF NOT EXISTS transcript_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_control_id VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    track VARCHAR(20),                       -- inbound, outbound
    sequence_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 6: Softphone Access
-- User WebRTC softphone permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS user_softphone_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL UNIQUE,    -- CRM user ID
    identity VARCHAR(100) NOT NULL UNIQUE,   -- Telnyx client identity
    caller_id UUID REFERENCES phone_numbers(id), -- outbound caller ID
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGE 7: SMS Messages
-- SMS message logs
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telnyx_id VARCHAR(100) UNIQUE,           -- Telnyx message ID
    direction VARCHAR(20) NOT NULL,          -- inbound / outbound
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50),                      -- queued / sent / delivered / failed
    phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Phone Settings
-- System-wide phone configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS phone_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO phone_settings (key, value) VALUES 
    ('recording', '{"enabled": true, "retentionDays": 90, "format": "mp3", "channels": "single"}'),
    ('transcription', '{"enabled": false, "language": "en-AU", "engine": "A"}'),
    ('region', '{"default": "sydney", "pop": "sydney"}'),
    ('telnyx', '{"configured": false}')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_call_logs_call_control_id ON call_logs(call_control_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_from ON call_logs(from_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_to ON call_logs(to_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_call ON transcript_chunks(call_control_id, sequence_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
