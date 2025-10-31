/*
  # Create notification preferences table

  ## Summary
  Creates the notification_preferences table to store user notification settings per subscription
  and global notification preferences. Supports P1 requirement: "pause notifications for a merchant".

  ## New Tables
  
  ### `notification_preferences`
  - `id` (bigserial, primary key) - Unique preference record identifier
  - `user_id` (bigint, foreign key, not null) - References users.id
  - `subscription_id` (bigint, foreign key, nullable) - References subscriptions.id (NULL = global prefs)
  - `notification_type` (text, not null) - Type of notification (new_subscription, renewal_reminder, price_increase, etc.)
  - `is_enabled` (boolean) - Whether this notification type is enabled
  - `days_before_renewal` (integer) - For renewal reminders, how many days before
  - `created_at` (timestamptz) - When preference was created
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on notification_preferences table
  - Backend uses service role key for all operations
  - Foreign key constraints ensure data integrity
  - Cascade delete when user or subscription is deleted

  ## Indexes
  - Primary key index on `id`
  - Foreign key index on `user_id` for fast user queries
  - Foreign key index on `subscription_id` for subscription-specific queries
  - Composite index on `user_id, notification_type` for fast preference lookups
  - Index on `is_enabled` for active notification queries

  ## Important Notes
  1. Global preferences have subscription_id = NULL
  2. Subscription-specific preferences override global preferences
  3. Default notification types: new_subscription, renewal_reminder, price_increase, token_expiring
  4. Users can disable notifications per subscription (PRD P1 requirement)
  5. days_before_renewal typically 1, 3, 7 days
  6. GDPR: Preferences cascade deleted with user account
*/

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id bigint REFERENCES subscriptions(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (
    notification_type IN (
      'new_subscription',
      'renewal_reminder',
      'price_increase',
      'token_expiring',
      'transaction_detected',
      'weekly_summary'
    )
  ),
  is_enabled boolean DEFAULT true NOT NULL,
  days_before_renewal integer DEFAULT 1 CHECK (days_before_renewal > 0 AND days_before_renewal <= 30),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_subscription_type UNIQUE(user_id, subscription_id, notification_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_subscription_id ON notification_preferences(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_type ON notification_preferences(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_enabled ON notification_preferences(is_enabled);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user notification preferences with fallback to defaults
CREATE OR REPLACE FUNCTION get_user_notification_preference(
  p_user_id bigint,
  p_subscription_id bigint,
  p_notification_type text
)
RETURNS boolean AS $$
DECLARE
  v_enabled boolean;
BEGIN
  -- First check for subscription-specific preference
  IF p_subscription_id IS NOT NULL THEN
    SELECT is_enabled INTO v_enabled
    FROM notification_preferences
    WHERE user_id = p_user_id
      AND subscription_id = p_subscription_id
      AND notification_type = p_notification_type;
    
    IF FOUND THEN
      RETURN v_enabled;
    END IF;
  END IF;
  
  -- Fall back to global preference
  SELECT is_enabled INTO v_enabled
  FROM notification_preferences
  WHERE user_id = p_user_id
    AND subscription_id IS NULL
    AND notification_type = p_notification_type;
  
  IF FOUND THEN
    RETURN v_enabled;
  END IF;
  
  -- Default to enabled if no preference set
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;