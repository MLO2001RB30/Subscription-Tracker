/*
  # Create push notification tokens table

  ## Summary
  Creates the push_tokens table to store Expo push notification tokens for each user device.
  Supports PRD requirement: "Push Notifications - Uses Expo push tokens" for P1 features
  like "get a push alert when a new subscription appears".

  ## New Tables
  
  ### `push_tokens`
  - `id` (bigserial, primary key) - Unique token record identifier
  - `user_id` (bigint, foreign key, not null) - References users.id
  - `expo_push_token` (text, unique, not null) - Expo push notification token
  - `device_name` (text) - User-friendly device name
  - `device_id` (text) - Unique device identifier
  - `platform` (text) - Platform (ios, android)
  - `os_version` (text) - Operating system version
  - `app_version` (text) - App version for compatibility tracking
  - `is_active` (boolean) - Whether token is currently valid
  - `last_used_at` (timestamptz) - Last time notification was sent to this token
  - `created_at` (timestamptz) - When token was registered
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on push_tokens table
  - Backend uses service role key for all operations
  - Users can have multiple devices (one token per device)
  - Automatic cascade delete when user is deleted

  ## Indexes
  - Primary key index on `id`
  - Unique index on `expo_push_token` to prevent duplicates
  - Foreign key index on `user_id` for fast user queries
  - Index on `is_active` for filtering active tokens
  - Composite index on `user_id, is_active` for sending notifications

  ## Important Notes
  1. Users can have multiple devices (one token per device)
  2. Tokens expire when user uninstalls app or revokes permissions
  3. is_active flag updated when notification delivery fails
  4. last_used_at tracks notification delivery for debugging
  5. Platform and version info helps with notification formatting
  6. GDPR: Tokens cascade deleted when user account is deleted
*/

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token text UNIQUE NOT NULL,
  device_name text,
  device_id text,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  os_version text,
  app_version text,
  is_active boolean DEFAULT true NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active ON push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_device_id ON push_tokens(device_id);

-- Enable Row Level Security
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id bigint)
RETURNS TABLE (
  token_id bigint,
  expo_push_token text,
  platform text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    push_tokens.expo_push_token,
    push_tokens.platform
  FROM push_tokens
  WHERE user_id = p_user_id
    AND is_active = true
  ORDER BY last_used_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark token as inactive (after failed delivery)
CREATE OR REPLACE FUNCTION deactivate_push_token(p_token_id bigint)
RETURNS boolean AS $$
BEGIN
  UPDATE push_tokens
  SET 
    is_active = false,
    updated_at = now()
  WHERE id = p_token_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last_used_at after successful notification
CREATE OR REPLACE FUNCTION mark_push_token_used(p_token_id bigint)
RETURNS boolean AS $$
BEGIN
  UPDATE push_tokens
  SET 
    last_used_at = now(),
    updated_at = now()
  WHERE id = p_token_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;