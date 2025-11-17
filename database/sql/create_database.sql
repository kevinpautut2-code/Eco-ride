-- ============================================
-- ECORIDE - Création de la base de données
-- Base de données relationnelle MySQL/MariaDB
-- ============================================

-- Création de la base de données
DROP DATABASE IF EXISTS ecoride;
CREATE DATABASE ecoride CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecoride;

-- ============================================
-- TABLE: users
-- Utilisateurs de la plateforme
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pseudo VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'employee', 'admin') NOT NULL DEFAULT 'user',
    user_type ENUM('passenger', 'driver', 'both') DEFAULT 'passenger',
    credits INT NOT NULL DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    photo_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,

    INDEX idx_email (email),
    INDEX idx_pseudo (pseudo),
    INDEX idx_role (role),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: vehicles
-- Véhicules des chauffeurs
-- ============================================
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    color VARCHAR(30) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    first_registration_date DATE NOT NULL,
    energy_type ENUM('essence', 'diesel', 'electric', 'hybrid', 'gpl', 'hydrogen') NOT NULL,
    seats_available INT NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_energy_type (energy_type)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: rides
-- Covoiturages proposés par les chauffeurs
-- ============================================
CREATE TABLE rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    departure_address VARCHAR(255) NOT NULL,
    departure_lat DECIMAL(10, 8) DEFAULT NULL,
    departure_lng DECIMAL(11, 8) DEFAULT NULL,
    arrival_city VARCHAR(100) NOT NULL,
    arrival_address VARCHAR(255) NOT NULL,
    arrival_lat DECIMAL(10, 8) DEFAULT NULL,
    arrival_lng DECIMAL(11, 8) DEFAULT NULL,
    departure_datetime DATETIME NOT NULL,
    arrival_datetime DATETIME NOT NULL,
    seats_available INT NOT NULL,
    price_credits INT NOT NULL,
    is_ecological BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'active', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_departure_city (departure_city),
    INDEX idx_arrival_city (arrival_city),
    INDEX idx_departure_datetime (departure_datetime),
    INDEX idx_status (status),
    INDEX idx_is_ecological (is_ecological)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: bookings
-- Réservations des passagers
-- ============================================
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    passenger_id INT NOT NULL,
    seats_booked INT NOT NULL DEFAULT 1,
    price_paid INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'disputed') NOT NULL DEFAULT 'confirmed',
    is_validated BOOLEAN DEFAULT FALSE,
    validation_comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ride_id (ride_id),
    INDEX idx_passenger_id (passenger_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_booking (ride_id, passenger_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: reviews_pending
-- Avis en attente de validation
-- ============================================
CREATE TABLE reviews_pending (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewed_user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by_employee_id INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_employee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_reviewed_user_id (reviewed_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: disputes
-- Litiges à gérer par les employés
-- ============================================
CREATE TABLE disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    resolution TEXT DEFAULT NULL,
    handled_by_employee_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by_employee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    INDEX idx_reporter_id (reporter_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: credit_transactions
-- Historique des transactions de crédits
-- ============================================
CREATE TABLE credit_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    type ENUM('credit', 'debit', 'refund', 'bonus', 'platform_fee') NOT NULL,
    reference_type ENUM('booking', 'ride_completion', 'registration', 'refund', 'admin') NOT NULL,
    reference_id INT DEFAULT NULL,
    balance_after INT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: notifications
-- Notifications pour les utilisateurs
-- ============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('booking', 'ride_update', 'review', 'credit', 'system', 'dispute') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: password_resets
-- Tokens de réinitialisation de mot de passe
-- ============================================
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: sessions
-- Sessions utilisateurs
-- ============================================
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    payload TEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: platform_stats
-- Statistiques de la plateforme (pour admin)
-- ============================================
CREATE TABLE platform_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_rides INT NOT NULL DEFAULT 0,
    total_bookings INT NOT NULL DEFAULT 0,
    credits_earned INT NOT NULL DEFAULT 0,
    new_users INT NOT NULL DEFAULT 0,
    active_users INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================
-- VUES
-- ============================================

-- Vue pour les statistiques des utilisateurs
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id,
    u.pseudo,
    u.email,
    u.role,
    u.credits,
    COUNT(DISTINCT CASE WHEN r.driver_id = u.id THEN r.id END) as rides_as_driver,
    COUNT(DISTINCT CASE WHEN b.passenger_id = u.id THEN b.id END) as rides_as_passenger,
    COALESCE(AVG(CASE WHEN rp.status = 'approved' THEN rp.rating END), 0) as average_rating,
    COUNT(DISTINCT CASE WHEN rp.status = 'approved' THEN rp.id END) as total_reviews
FROM users u
LEFT JOIN rides r ON r.driver_id = u.id
LEFT JOIN bookings b ON b.passenger_id = u.id
LEFT JOIN reviews_pending rp ON rp.reviewed_user_id = u.id AND rp.status = 'approved'
GROUP BY u.id;

-- Vue pour les covoiturages disponibles
CREATE OR REPLACE VIEW available_rides AS
SELECT
    r.id,
    r.driver_id,
    u.pseudo as driver_pseudo,
    u.photo_url as driver_photo,
    r.vehicle_id,
    v.brand,
    v.model,
    v.energy_type,
    r.departure_city,
    r.departure_address,
    r.arrival_city,
    r.arrival_address,
    r.departure_datetime,
    r.arrival_datetime,
    r.seats_available,
    r.price_credits,
    r.is_ecological,
    COALESCE(AVG(rp.rating), 0) as driver_rating,
    COUNT(DISTINCT rp.id) as driver_reviews_count
FROM rides r
INNER JOIN users u ON u.id = r.driver_id
INNER JOIN vehicles v ON v.id = r.vehicle_id
LEFT JOIN reviews_pending rp ON rp.reviewed_user_id = r.driver_id AND rp.status = 'approved'
WHERE r.status = 'pending'
    AND r.seats_available > 0
    AND r.departure_datetime > NOW()
GROUP BY r.id;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour automatiquement is_ecological
DELIMITER //
CREATE TRIGGER before_ride_insert
BEFORE INSERT ON rides
FOR EACH ROW
BEGIN
    DECLARE vehicle_energy VARCHAR(30);

    SELECT energy_type INTO vehicle_energy
    FROM vehicles
    WHERE id = NEW.vehicle_id;

    IF vehicle_energy = 'electric' THEN
        SET NEW.is_ecological = TRUE;
    ELSE
        SET NEW.is_ecological = FALSE;
    END IF;
END//

CREATE TRIGGER before_ride_update
BEFORE UPDATE ON rides
FOR EACH ROW
BEGIN
    DECLARE vehicle_energy VARCHAR(30);

    SELECT energy_type INTO vehicle_energy
    FROM vehicles
    WHERE id = NEW.vehicle_id;

    IF vehicle_energy = 'electric' THEN
        SET NEW.is_ecological = TRUE;
    ELSE
        SET NEW.is_ecological = FALSE;
    END IF;
END//

-- Trigger pour enregistrer les transactions de crédits lors d'une réservation
CREATE TRIGGER after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    -- Débit pour le passager
    INSERT INTO credit_transactions (user_id, amount, type, reference_type, reference_id, balance_after, description)
    SELECT NEW.passenger_id, -NEW.price_paid, 'debit', 'booking', NEW.id,
           (SELECT credits FROM users WHERE id = NEW.passenger_id),
           CONCAT('Réservation du trajet #', NEW.ride_id);
END//

-- Trigger pour créditer le chauffeur et la plateforme à la fin d'un trajet
CREATE TRIGGER after_booking_complete
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    DECLARE driver_id INT;
    DECLARE platform_fee INT;
    DECLARE driver_amount INT;

    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.is_validated = TRUE THEN
        -- Récupérer l'ID du chauffeur
        SELECT r.driver_id INTO driver_id
        FROM rides r
        WHERE r.id = NEW.ride_id;

        -- Calculer les montants
        SET platform_fee = 2;
        SET driver_amount = NEW.price_paid - platform_fee;

        -- Créditer le chauffeur
        UPDATE users SET credits = credits + driver_amount WHERE id = driver_id;

        INSERT INTO credit_transactions (user_id, amount, type, reference_type, reference_id, balance_after, description)
        SELECT driver_id, driver_amount, 'credit', 'ride_completion', NEW.id,
               (SELECT credits FROM users WHERE id = driver_id),
               CONCAT('Paiement reçu pour le trajet #', NEW.ride_id);

        -- Enregistrer les frais de plateforme
        INSERT INTO credit_transactions (user_id, amount, type, reference_type, reference_id, balance_after, description)
        VALUES (1, platform_fee, 'platform_fee', 'ride_completion', NEW.id, 0, 'Frais de plateforme');
    END IF;
END//

DELIMITER ;

-- ============================================
-- PROCÉDURES STOCKÉES
-- ============================================

DELIMITER //

-- Procédure pour rechercher des trajets
CREATE PROCEDURE search_rides(
    IN p_departure_city VARCHAR(100),
    IN p_arrival_city VARCHAR(100),
    IN p_date DATE,
    IN p_max_price INT,
    IN p_min_rating DECIMAL(3,2),
    IN p_ecological_only BOOLEAN
)
BEGIN
    SELECT
        r.id,
        r.driver_id,
        u.pseudo as driver_pseudo,
        u.photo_url as driver_photo,
        v.brand,
        v.model,
        v.energy_type,
        r.departure_city,
        r.departure_address,
        r.arrival_city,
        r.arrival_address,
        r.departure_datetime,
        r.arrival_datetime,
        r.seats_available,
        r.price_credits,
        r.is_ecological,
        COALESCE(AVG(rp.rating), 0) as driver_rating,
        COUNT(DISTINCT rp.id) as driver_reviews_count
    FROM rides r
    INNER JOIN users u ON u.id = r.driver_id
    INNER JOIN vehicles v ON v.id = r.vehicle_id
    LEFT JOIN reviews_pending rp ON rp.reviewed_user_id = r.driver_id AND rp.status = 'approved'
    WHERE r.status = 'pending'
        AND r.seats_available > 0
        AND r.departure_datetime > NOW()
        AND DATE(r.departure_datetime) = p_date
        AND r.departure_city LIKE CONCAT('%', p_departure_city, '%')
        AND r.arrival_city LIKE CONCAT('%', p_arrival_city, '%')
        AND (p_max_price IS NULL OR r.price_credits <= p_max_price)
        AND (p_ecological_only = FALSE OR r.is_ecological = TRUE)
    GROUP BY r.id
    HAVING (p_min_rating IS NULL OR driver_rating >= p_min_rating)
    ORDER BY r.departure_datetime ASC;
END//

-- Procédure pour calculer les statistiques quotidiennes
CREATE PROCEDURE calculate_daily_stats(IN p_date DATE)
BEGIN
    INSERT INTO platform_stats (date, total_rides, total_bookings, credits_earned, new_users, active_users)
    SELECT
        p_date,
        COUNT(DISTINCT CASE WHEN DATE(r.created_at) = p_date THEN r.id END),
        COUNT(DISTINCT CASE WHEN DATE(b.created_at) = p_date THEN b.id END),
        COALESCE(SUM(CASE WHEN DATE(ct.created_at) = p_date AND ct.type = 'platform_fee' THEN ct.amount END), 0),
        COUNT(DISTINCT CASE WHEN DATE(u.created_at) = p_date THEN u.id END),
        COUNT(DISTINCT CASE WHEN DATE(u.last_login) = p_date THEN u.id END)
    FROM users u
    LEFT JOIN rides r ON 1=1
    LEFT JOIN bookings b ON 1=1
    LEFT JOIN credit_transactions ct ON 1=1
    ON DUPLICATE KEY UPDATE
        total_rides = VALUES(total_rides),
        total_bookings = VALUES(total_bookings),
        credits_earned = VALUES(credits_earned),
        new_users = VALUES(new_users),
        active_users = VALUES(active_users);
END//

DELIMITER ;

-- Message de confirmation
SELECT 'Base de données EcoRide créée avec succès !' as message;
