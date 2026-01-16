-- Migration: Simplify Contact Management
-- Description: Remove Contact model and change Task.contactId to String for device contact IDs
-- Date: 2026-01-16

-- Step 1: Drop the foreign key constraint on Task.contactId
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_contactId_fkey";

-- Step 2: Change contactId column type from Integer to String
-- Note: This will clear existing contactId values since we're changing types
ALTER TABLE "Task" ALTER COLUMN "contactId" TYPE VARCHAR(255) USING NULL;

-- Step 3: Drop the Contact table (no longer needed)
DROP TABLE IF EXISTS "Contact" CASCADE;

-- Step 4: Update indexes (contactId index already exists, just verify)
-- The index on contactId is already defined in the schema

-- Verification queries (run these after migration to verify)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Task' AND column_name = 'contactId';
-- Expected result: contactId | character varying

-- Note: All existing contactId references will be set to NULL
-- Users will need to re-link contacts from their device after this migration
