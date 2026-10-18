-- Flyway Migration V2: Create Core Entities for CareSync (PostgreSQL Compatible)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users (email);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    emergency_contact VARCHAR(30),
    medical_history TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    qualifications VARCHAR(255) NOT NULL,
    experience_years INT,
    bio TEXT,
    location VARCHAR(255),
    consultation_fee DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doctor_specialization ON doctors (specialization);

-- 4. Doctor Availabilities Table
CREATE TABLE IF NOT EXISTS doctor_availabilities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    available_date DATE,
    day_of_week VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_avail_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_avail_doctor_date ON doctor_availabilities (doctor_id, available_date);

-- 5. Appointments Table (Includes UNIQUE constraint on doctor_id, appointment_date, start_time)
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uk_doctor_slot UNIQUE (doctor_id, appointment_date, start_time),
    CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_app_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_doctor_date ON appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_app_patient ON appointments (patient_id);

-- 6. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT NOT NULL UNIQUE,
    diagnosis VARCHAR(255) NOT NULL,
    medicines TEXT NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    doctor_notes TEXT,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_presc_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prescription_patient ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_doctor ON prescriptions (doctor_id);
