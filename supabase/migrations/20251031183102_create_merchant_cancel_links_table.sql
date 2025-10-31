/*
  # Create merchant cancel links table

  ## Summary
  Creates the merchant_cancel_links table to store cancellation URLs, phone numbers, and email
  addresses for subscription services. Supports PRD requirement: "Cancel-Action Map" with
  JSON schema {merchant_id, label, type, target}.

  ## New Tables
  
  ### `merchant_cancel_links`
  - `id` (bigserial, primary key) - Unique merchant record identifier
  - `merchant_name` (text, unique, not null) - Standardized merchant/service name
  - `merchant_domain` (text) - Merchant domain (e.g., netflix.com)
  - `cancel_type` (text, not null) - Type of cancellation method (url, mailto, tel)
  - `cancel_target` (text, not null) - URL, email address, or phone number
  - `cancel_label` (text) - Display label (e.g., "Cancel subscription", "Call customer service")
  - `instructions` (text) - Step-by-step cancellation instructions
  - `country_code` (text) - Country (DK for Danish services)
  - `verified_at` (timestamptz) - Last time link was verified to work
  - `broken_reports` (integer) - Count of "broken link" reports from users
  - `is_active` (boolean) - Whether link is currently active/working
  - `created_at` (timestamptz) - When record was created
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on merchant_cancel_links table
  - Read access for authenticated users (via backend)
  - Write access only via backend (service role)
  - Public read access could be enabled for this reference data

  ## Indexes
  - Primary key index on `id`
  - Unique index on `merchant_name` for fast lookups
  - Index on `merchant_domain` for domain-based matching
  - Index on `is_active` for filtering broken links
  - Index on `country_code` for country-specific merchants
  - Index on `broken_reports` for maintenance priority

  ## Important Notes
  1. Supports PRD cancel-action map requirement
  2. cancel_type values: url, mailto, tel
  3. Users can report broken links (PRD mitigation strategy)
  4. Crowd-sourced updates via "report broken link" feature
  5. Top 250 DK + global brands (PRD requirement)
  6. Regular verification needed to maintain link accuracy
  7. Instructions field helps users with complex cancellation flows
*/

-- Create merchant_cancel_links table
CREATE TABLE IF NOT EXISTS merchant_cancel_links (
  id bigserial PRIMARY KEY,
  merchant_name text UNIQUE NOT NULL,
  merchant_domain text,
  cancel_type text NOT NULL CHECK (cancel_type IN ('url', 'mailto', 'tel')),
  cancel_target text NOT NULL,
  cancel_label text DEFAULT 'Opsig abonnement',
  instructions text,
  country_code text DEFAULT 'DK' CHECK (country_code IN ('DK', 'GLOBAL')),
  verified_at timestamptz,
  broken_reports integer DEFAULT 0 NOT NULL CHECK (broken_reports >= 0),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_links_domain ON merchant_cancel_links(merchant_domain);
CREATE INDEX IF NOT EXISTS idx_merchant_links_active ON merchant_cancel_links(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_links_country ON merchant_cancel_links(country_code);
CREATE INDEX IF NOT EXISTS idx_merchant_links_reports ON merchant_cancel_links(broken_reports);

-- Enable Row Level Security
ALTER TABLE merchant_cancel_links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY "Authenticated users can read merchant cancel links"
  ON merchant_cancel_links
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_merchant_cancel_links_updated_at
  BEFORE UPDATE ON merchant_cancel_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to report broken link (increments counter)
CREATE OR REPLACE FUNCTION report_broken_cancel_link(p_merchant_id bigint)
RETURNS boolean AS $$
BEGIN
  UPDATE merchant_cancel_links
  SET 
    broken_reports = broken_reports + 1,
    is_active = CASE WHEN broken_reports + 1 >= 3 THEN false ELSE is_active END,
    updated_at = now()
  WHERE id = p_merchant_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify cancel link (resets counter and marks verified)
CREATE OR REPLACE FUNCTION verify_cancel_link(p_merchant_id bigint)
RETURNS boolean AS $$
BEGIN
  UPDATE merchant_cancel_links
  SET 
    broken_reports = 0,
    is_active = true,
    verified_at = now(),
    updated_at = now()
  WHERE id = p_merchant_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;