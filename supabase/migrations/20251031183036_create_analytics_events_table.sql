/*
  # Create analytics events table

  ## Summary
  Creates the analytics_events table to track user behavior and subscription management actions.
  Supports PRD requirement: "Analytics event cancel_click logged with merchant_id".
  Critical for measuring success metrics: cancellation rate, D30 retention, completion time.

  ## New Tables
  
  ### `analytics_events`
  - `id` (bigserial, primary key) - Unique event identifier
  - `user_id` (bigint, foreign key, not null) - References users.id
  - `subscription_id` (bigint, foreign key, nullable) - References subscriptions.id
  - `event_type` (text, not null) - Type of event (cancel_click, subscription_added, bank_connected, etc.)
  - `event_data` (jsonb) - Additional event-specific data
  - `merchant_name` (text) - Merchant/subscription name for quick queries
  - `session_id` (text) - Session identifier for user flow tracking
  - `platform` (text) - Platform (ios, android, web)
  - `app_version` (text) - App version for feature adoption tracking
  - `created_at` (timestamptz) - Event timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on analytics_events table
  - Backend uses service role key for all operations
  - No user access - analytics are write-only
  - Foreign key constraints ensure data integrity

  ## Indexes
  - Primary key index on `id`
  - Foreign key index on `user_id` for user behavior analysis
  - Foreign key index on `subscription_id` for subscription-specific metrics
  - Index on `event_type` for event aggregation queries
  - Index on `created_at` for time-series analysis
  - Composite index on `user_id, created_at` for retention analysis
  - Index on `merchant_name` for merchant-specific analytics

  ## Important Notes
  1. Key event types from PRD:
     - cancel_click: User clicked cancel button (KPI: 0.8 cancellations/MAU)
     - subscription_added: Subscription detected or manually added
     - bank_connected: Tink bank connection completed
     - onboarding_completed: User finished onboarding (KPI: ≤ 2 min)
     - subscription_viewed: User viewed subscription detail
     - list_viewed: User viewed subscription list
  2. event_data stores flexible JSON for event-specific details
  3. session_id tracks user flows for onboarding time measurement
  4. Retention period: 365 days for analytics, then archived
  5. GDPR: Events anonymized (user_id set to NULL) when user deletes account
*/

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  subscription_id bigint REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (
    event_type IN (
      'cancel_click',
      'subscription_added',
      'subscription_deleted',
      'subscription_viewed',
      'bank_connected',
      'bank_connection_failed',
      'onboarding_started',
      'onboarding_completed',
      'list_viewed',
      'notification_sent',
      'notification_opened',
      'pdf_uploaded',
      'export_requested',
      'search_performed'
    )
  ),
  event_data jsonb DEFAULT '{}'::jsonb,
  merchant_name text,
  session_id text,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  app_version text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_subscription_id ON analytics_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_merchant ON analytics_events(merchant_name);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Function to calculate user onboarding time
CREATE OR REPLACE FUNCTION get_user_onboarding_time(p_user_id bigint)
RETURNS interval AS $$
DECLARE
  v_started_at timestamptz;
  v_completed_at timestamptz;
BEGIN
  SELECT created_at INTO v_started_at
  FROM analytics_events
  WHERE user_id = p_user_id
    AND event_type = 'onboarding_started'
  ORDER BY created_at ASC
  LIMIT 1;
  
  SELECT created_at INTO v_completed_at
  FROM analytics_events
  WHERE user_id = p_user_id
    AND event_type = 'onboarding_completed'
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_started_at IS NULL OR v_completed_at IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN v_completed_at - v_started_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate D30 retention rate
CREATE OR REPLACE FUNCTION calculate_d30_retention()
RETURNS TABLE (
  cohort_date date,
  total_users bigint,
  retained_users bigint,
  retention_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT 
      DATE(created_at) as cohort_date,
      id as user_id
    FROM users
    WHERE created_at >= now() - interval '60 days'
  ),
  day30_activity AS (
    SELECT DISTINCT
      c.cohort_date,
      c.user_id,
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM analytics_events e
          WHERE e.user_id = c.user_id
            AND e.created_at BETWEEN (c.cohort_date + interval '29 days') 
                                 AND (c.cohort_date + interval '31 days')
        ) THEN 1
        ELSE 0
      END as is_retained
    FROM cohorts c
  )
  SELECT 
    d.cohort_date,
    COUNT(*)::bigint as total_users,
    SUM(d.is_retained)::bigint as retained_users,
    ROUND(AVG(d.is_retained) * 100, 2) as retention_rate
  FROM day30_activity d
  GROUP BY d.cohort_date
  ORDER BY d.cohort_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;