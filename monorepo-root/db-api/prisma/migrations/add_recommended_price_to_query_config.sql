-- Migration: Add recommended_price field to query_configs table
-- Date: 2024-12-19

ALTER TABLE query_configs 
ADD COLUMN recommended_price INTEGER;

-- Add comment to the column
COMMENT ON COLUMN query_configs.recommended_price IS 'Recommended price for the query in RUB';
