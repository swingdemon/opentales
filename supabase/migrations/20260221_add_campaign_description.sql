-- =====================================================
-- Add description column to campaigns table
-- =====================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
