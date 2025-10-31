/*
  # Create Tink tokens table for secure bank access token storage

  ## Summary
  Creates the tink_tokens table to securely store encrypted bank access tokens from Tink API.
  Tokens are required for fetching transaction data and must be refreshed every 90 days per PRD.

  ## New Tables
  
  ### `tink_tokens`
  - `id` (bigserial, primary key) - Unique token record identifier
  - `user_id` (bigint, foreign key, not null) - References users.id
  - `access_token` (text, not null) - Encrypted Tink access token (AES-256 encrypted at app level)
  - `refresh_token` (text) - Encrypted Tink refresh token for token renewal
  - `token_type` (text) - Token type (typically "Bearer")
  - `expires_at` (timestamptz, not null) - Token expiration timestamp
  - `scope` (text) - OAuth scopes granted (e.g., "accounts:read,transactions:read")
  - `bank_name` (text) - Name of connected bank
  - `account_ids` (jsonb) - Array of connected account IDs
  - `last_sync_at` (timestamptz) - Last successful transaction sync timestamp
  - `is_active` (boolean) - Whether token is currently active/valid
  - `created_at` (timestamptz) - When token was first created
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on tink_tokens table
  - Backend uses service role key - no direct user access
  - Tokens are encrypted at application level before storage
  - Automatic cascade delete when user is deleted (GDPR compliance)

  ## Indexes
  - Primary key index on `id`
  - Foreign key index on `user_id` for fast user queries
  - Unique index on `user_id, bank_name` to prevent duplicate connections
  - Index on `expires_at` for token refresh queries
  - Index on `is_active` for active token queries

  ## Important Notes
  1. Tokens MUST be encrypted with AES-256 before storage (PRD requirement)
  2. Token refresh reminder at 75 days (15 days before 90-day expiry)
  3. Users can connect multiple banks (one token per bank)
  4. Inactive/expired tokens kept for 30 days then deleted
  5. last_sync_at used for delta sync optimization
  6. GDPR: Tokens are cascade deleted when user account is deleted
*/

-- Create tink_tokens table
CREATE TABLE IF NOT EXISTS tink_tokens (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  bank_name text,
  account_ids jsonb DEFAULT '[]'::jsonb,
  last_sync_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_bank UNIQUE(user_id, bank_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tink_tokens_user_id ON tink_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tink_tokens_expires_at ON tink_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tink_tokens_is_active ON tink_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tink_tokens_last_sync ON tink_tokens(last_sync_at);

-- Enable Row Level Security
ALTER TABLE tink_tokens ENABLE ROW LEVEL SECURITY;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tink_tokens_updated_at
  BEFORE UPDATE ON tink_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check for tokens expiring soon (for notifications)
CREATE OR REPLACE FUNCTION get_tokens_expiring_soon(days_threshold integer DEFAULT 15)
RETURNS TABLE (
  user_id bigint,
  bank_name text,
  expires_at timestamptz,
  days_until_expiry numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.user_id,
    t.bank_name,
    t.expires_at,
    EXTRACT(DAY FROM (t.expires_at - now())) as days_until_expiry
  FROM tink_tokens t
  WHERE t.is_active = true
    AND t.expires_at > now()
    AND t.expires_at <= now() + make_interval(days => days_threshold)
  ORDER BY t.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;