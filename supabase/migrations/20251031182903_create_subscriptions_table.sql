/*
  # Create subscriptions table

  ## Summary
  Creates the subscriptions table to store both manually added and auto-detected subscriptions
  from bank transactions via Tink integration and OpenAI analysis.

  ## New Tables
  
  ### `subscriptions`
  - `id` (bigserial, primary key) - Unique subscription identifier
  - `owner_id` (bigint, foreign key, not null) - References users.id
  - `title` (text, not null) - Subscription name/merchant name
  - `amount` (numeric(10,2), not null) - Monthly subscription cost
  - `currency` (text) - Currency code (default: DKK)
  - `category` (text) - Subscription category (e.g., Streaming, Fitness, Insurance)
  - `renewal_date` (date, not null) - Next renewal/payment date
  - `transaction_date` (date) - Original transaction date from bank (for imported subscriptions)
  - `logo_url` (text) - URL to company logo (Clearbit API)
  - `frequency` (text) - Payment frequency (monthly, quarterly, yearly)
  - `source` (text) - How subscription was added (manual, tink, pdf)
  - `confidence_score` (integer) - AI confidence score for detected subscriptions (0-100)
  - `is_active` (boolean) - Whether subscription is active
  - `notes` (text) - User notes about subscription
  - `created_at` (timestamptz) - When subscription was added to app
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on subscriptions table
  - Backend uses service role key for all operations
  - No direct user access - all operations via authenticated API
  - Foreign key constraint ensures data integrity

  ## Indexes
  - Primary key index on `id`
  - Foreign key index on `owner_id` for fast user queries
  - Index on `renewal_date` for notification queries
  - Composite index on `owner_id, is_active` for active subscription queries
  - Index on `created_at` for analytics

  ## Important Notes
  1. All monetary amounts stored as numeric for precision
  2. Categories are free-text but should be standardized by backend
  3. AI-detected subscriptions include confidence_score and source
  4. Manual subscriptions have NULL confidence_score
  5. GDPR: Subscriptions are cascade deleted when user is deleted
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id bigserial PRIMARY KEY,
  owner_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'DKK' NOT NULL,
  category text DEFAULT 'Øvrige',
  renewal_date date NOT NULL,
  transaction_date date,
  logo_url text,
  frequency text DEFAULT 'måned',
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'tink', 'pdf', 'email')),
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_active ON subscriptions(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();