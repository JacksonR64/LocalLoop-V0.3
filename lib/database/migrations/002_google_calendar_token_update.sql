-- Migration: Add missing Google Calendar token storage columns
-- This migration updates the users table to match the expected column names in the Google Calendar integration code

-- Add the new encrypted token storage column
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_token text;

-- Add the connection timestamp column
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_connected_at timestamp with time zone;

-- Add the expires at column (different name than existing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_expires_at timestamp with time zone;

-- Migrate existing data if needed
UPDATE users 
SET google_calendar_expires_at = google_calendar_token_expires_at
WHERE google_calendar_token_expires_at IS NOT NULL;

-- Add index for the new columns
CREATE INDEX IF NOT EXISTS idx_users_google_calendar_token ON users(google_calendar_connected, google_calendar_connected_at) 
WHERE google_calendar_connected = true; 