-- Travel Management System - Database Initialization Script
-- This script creates all required databases for the microservices

-- Create databases for each microservice
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS travel_db;
CREATE DATABASE IF NOT EXISTS payment_db;
CREATE DATABASE IF NOT EXISTS feedback_db;

-- Grant all privileges to the postgres user
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE user_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE travel_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE feedback_db TO postgres;

-- Display created databases
\l
