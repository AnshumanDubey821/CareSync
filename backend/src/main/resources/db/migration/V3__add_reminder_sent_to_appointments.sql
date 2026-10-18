-- Flyway Migration V3: Add reminder_sent column to appointments table
ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
