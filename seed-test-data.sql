-- Travel Management System - Test Data Seeding
-- This script populates the database with test data for development

-- ============================================
-- USER_DB - Test Users
-- ============================================
\c user_db;

-- Test Manager Users
INSERT INTO users (username, email, password, first_name, last_name, role, enabled, created_at, updated_at)
VALUES
    ('manager1', 'manager1@test.com', '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', 'John', 'Manager', 'TRAVEL_MANAGER', true, NOW(), NOW()),
    ('manager2', 'manager2@test.com', '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', 'Jane', 'Smith', 'TRAVEL_MANAGER', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Test Traveler Users
INSERT INTO users (username, email, password, first_name, last_name, role, enabled, created_at, updated_at)
VALUES
    ('traveler1', 'traveler1@test.com', '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', 'Alice', 'Johnson', 'TRAVELER', true, NOW(), NOW()),
    ('traveler2', 'traveler2@test.com', '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', 'Bob', 'Williams', 'TRAVELER', true, NOW(), NOW()),
    ('traveler3', 'traveler3@test.com', '$2a$10$xgKRZ8qKXVXqLLV8fJQN5.dQfJ0qE2b9mHLqKqZ8vQZKqLqZ8vQZK', 'Charlie', 'Brown', 'TRAVELER', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- TRAVEL_DB - Sample Travels
-- ============================================
\c travel_db;

-- Sample Travels (assuming manager1 has user_id=2, manager2 has user_id=3)
INSERT INTO travels (title, description, destination, country, state, city, start_date, end_date, price, max_participants, current_participants, travel_manager_id, travel_manager_name, category, active, average_rating, total_reviews, created_at, updated_at)
VALUES
    (
        'Paris Weekend Getaway',
        'Experience the romance of Paris with this 3-day weekend package including Eiffel Tower, Louvre, and Seine cruise.',
        'Paris, France',
        'France',
        'Île-de-France',
        'Paris',
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '33 days',
        1299.99,
        15,
        5,
        2,
        'John Manager',
        'CITY',
        true,
        4.5,
        12,
        NOW(),
        NOW()
    ),
    (
        'Tokyo Cultural Experience',
        'Immerse yourself in Japanese culture with temple visits, traditional tea ceremony, and sushi making class.',
        'Tokyo, Japan',
        'Japan',
        'Kanto',
        'Tokyo',
        CURRENT_DATE + INTERVAL '45 days',
        CURRENT_DATE + INTERVAL '52 days',
        2499.99,
        12,
        8,
        2,
        'John Manager',
        'CULTURAL',
        true,
        4.8,
        20,
        NOW(),
        NOW()
    ),
    (
        'Bali Beach Retreat',
        'Relax on pristine beaches, practice yoga, and enjoy spa treatments in beautiful Bali.',
        'Bali, Indonesia',
        'Indonesia',
        'Bali',
        'Ubud',
        CURRENT_DATE + INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '67 days',
        1799.99,
        20,
        12,
        3,
        'Jane Smith',
        'BEACH',
        true,
        4.7,
        18,
        NOW(),
        NOW()
    ),
    (
        'Swiss Alps Adventure',
        'Hiking, skiing, and mountain climbing in the breathtaking Swiss Alps.',
        'Swiss Alps',
        'Switzerland',
        'Valais',
        'Zermatt',
        CURRENT_DATE + INTERVAL '90 days',
        CURRENT_DATE + INTERVAL '97 days',
        2899.99,
        10,
        4,
        3,
        'Jane Smith',
        'ADVENTURE',
        true,
        4.9,
        25,
        NOW(),
        NOW()
    ),
    (
        'Amazon Rainforest Expedition',
        'Explore the biodiversity of the Amazon with guided tours and wildlife spotting.',
        'Amazon Rainforest',
        'Brazil',
        'Amazonas',
        'Manaus',
        CURRENT_DATE + INTERVAL '120 days',
        CURRENT_DATE + INTERVAL '130 days',
        3299.99,
        8,
        2,
        2,
        'John Manager',
        'NATURE',
        true,
        4.6,
        15,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- FEEDBACK_DB - Sample Feedback
-- ============================================
\c feedback_db;

-- Sample Feedback (assuming travel IDs 1-5 from above)
INSERT INTO feedbacks (traveler_id, travel_id, rating, comment, created_at, updated_at)
VALUES
    (4, 1, 5, 'Amazing experience! Paris was magical and the itinerary was perfect.', NOW(), NOW()),
    (5, 1, 4, 'Great trip, but wished we had more time at the Louvre.', NOW(), NOW()),
    (4, 2, 5, 'Tokyo exceeded all expectations. The cultural experiences were authentic.', NOW(), NOW()),
    (6, 3, 5, 'Bali was paradise! Perfect balance of relaxation and adventure.', NOW(), NOW()),
    (5, 3, 4, 'Beautiful location, though the yoga sessions could be longer.', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Display seeded data summary
\c user_db;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

\c travel_db;
SELECT category, COUNT(*) as count, AVG(price) as avg_price FROM travels GROUP BY category;

\c feedback_db;
SELECT AVG(rating) as average_rating, COUNT(*) as total_feedbacks FROM feedbacks;
