-- Migration: Add name columns to users table
-- Description: Add first_name and last_name for user profile display

ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
