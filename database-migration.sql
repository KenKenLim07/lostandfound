-- Add blocked column to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN blocked BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.blocked IS 'Whether the user is blocked from posting items';

-- Create index for better performance on blocked status queries
CREATE INDEX idx_profiles_blocked ON profiles(blocked);

-- Update existing users to have blocked = false (active)
UPDATE profiles SET blocked = FALSE WHERE blocked IS NULL;

-- Add RLS policy to prevent blocked users from posting items
CREATE POLICY "Users can only post if not blocked" ON items
FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.blocked = true
  )
);

-- Enable RLS on items table if not already enabled
ALTER TABLE items ENABLE ROW LEVEL SECURITY; 