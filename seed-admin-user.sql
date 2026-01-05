-- Travel Management System - Seed Admin User
-- This script creates a default admin user for initial system access
-- Database: user_db

\c user_db;

-- Insert default admin user
-- Password: admin123 (BCrypt hashed)
INSERT INTO users (id, username, email, password, first_name, last_name, role, enabled, created_at, updated_at)
VALUES (
    1,
    'admin',
    'admin@travelms.com',
    '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', -- BCrypt hash of 'admin123'
    'System',
    'Administrator',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Display created admin user
SELECT id, username, email, role, enabled FROM users WHERE role = 'ADMIN';
