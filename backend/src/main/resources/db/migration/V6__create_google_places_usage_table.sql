-- Flyway Migration V6: Create Google Places Usage Table for Persistent Cost & Quota Protection
CREATE TABLE IF NOT EXISTS google_places_usage (
    year_month VARCHAR(7) NOT NULL PRIMARY KEY,
    request_count BIGINT NOT NULL DEFAULT 0,
    warning_threshold BIGINT NOT NULL DEFAULT 68000,
    hard_limit BIGINT NOT NULL DEFAULT 69000,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
