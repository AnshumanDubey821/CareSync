-- CareSync Initial Schema Baseline Migration
-- Flyway Migration V1

CREATE TABLE IF NOT EXISTS schema_baseline (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
