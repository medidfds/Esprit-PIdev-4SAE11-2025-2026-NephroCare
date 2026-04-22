-- Database initialization script for NephroCare
-- This script creates the basic database structure and necessary tables

-- Create basic tables if they don't exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_type VARCHAR(5),
    medical_history LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Clinical data table
CREATE TABLE IF NOT EXISTS clinical_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    test_date TIMESTAMP,
    test_type VARCHAR(100),
    result_value DECIMAL(10, 2),
    unit VARCHAR(20),
    normal_range VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Dialysis sessions table
CREATE TABLE IF NOT EXISTS dialysis_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    session_date TIMESTAMP,
    session_duration INT,
    vascular_access_type VARCHAR(50),
    blood_flow_rate INT,
    dialysate_flow_rate INT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Hospitalization table
CREATE TABLE IF NOT EXISTS hospitalizations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    admission_date TIMESTAMP,
    discharge_date TIMESTAMP,
    reason_for_admission VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    order_type VARCHAR(50),
    order_date TIMESTAMP,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Create indexes
CREATE INDEX idx_patient_user ON patients(user_id);
CREATE INDEX idx_clinical_patient ON clinical_data(patient_id);
CREATE INDEX idx_dialysis_patient ON dialysis_sessions(patient_id);
CREATE INDEX idx_medication_patient ON medications(patient_id);
CREATE INDEX idx_hospitalization_patient ON hospitalizations(patient_id);
CREATE INDEX idx_order_patient ON orders(patient_id);
