-- Add welcome_email_sent column to users table
-- This tracks whether a user has already received their welcome email

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.welcome_email_sent IS 'Tracks whether the user has received their welcome email to prevent duplicates'; 