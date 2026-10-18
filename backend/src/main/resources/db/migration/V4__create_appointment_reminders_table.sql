-- Flyway Migration V4: Create appointment_reminders table for tracking automated reminder delivery
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    reminder_type VARCHAR(30) NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
    CONSTRAINT uk_app_reminder_type UNIQUE (appointment_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_reminder_app_type ON appointment_reminders (appointment_id, reminder_type);
