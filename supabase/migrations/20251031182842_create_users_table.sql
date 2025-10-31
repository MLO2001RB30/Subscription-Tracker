/*
  # Create users table for authentication

  ## Summary
  Creates the core users table for SubTrack DK authentication system with email/password support.
  Backend uses service role key for all operations, so RLS is restrictive by default.

  ## New Tables
  
  ### `users`
  - `id` (bigserial, primary key) - Unique user identifier
  - `email` (text, unique, not null) - User email address for authentication
  - `hashed_password` (text, not null) - Bcrypt hashed password
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last account update timestamp
  - `last_login` (timestamptz) - Last successful login timestamp
  - `is_active` (boolean) - Account active status (for soft deletion)

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on users table
  - Backend uses service role key which bypasses RLS
  - No public policies needed as all access is via backend API with JWT validation
  - This ensures maximum security - users cannot directly access database

  ## Indexes
  - Primary key index on `id`
  - Unique index on `email` for fast login lookups
  - Index on `created_at` for analytics queries

  ## Important Notes
  1. Passwords are stored as bcrypt hashes only (never plaintext)
  2. Email must be validated before account creation
  3. GDPR compliance: Users can request full data deletion
  4. Data retention: 90 days after account deletion per PRD requirements
  5. Backend handles all authentication and authorization via JWT tokens
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  hashed_password text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login timestamptz,
  is_active boolean DEFAULT true NOT NULL
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable Row Level Security (backend uses service role, so this is restrictive by default)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();