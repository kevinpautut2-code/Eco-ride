-- ============================================
-- ECORIDE - Données de test
-- Insertion de données pour les tests
-- ============================================

USE ecoride;

-- ============================================
-- UTILISATEURS
-- Mot de passe pour tous: Test@2025! (hash bcrypt)
-- ============================================

-- Administrateur
INSERT INTO users (pseudo, email, password_hash, role, credits, photo_url) VALUES
('admin', 'admin@ecoride.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1000, 'https://i.pravatar.cc/150?img=1');

-- Employés
INSERT INTO users (pseudo, email, password_hash, role, credits, photo_url) VALUES
('employe1', 'employe@ecoride.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 100, 'https://i.pravatar.cc/150?img=2'),
('employe2', 'sophie.martin@ecoride.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 100, 'https://i.pravatar.cc/150?img=3');

-- Chauffeurs
INSERT INTO users (pseudo, email, password_hash, role, user_type, credits, photo_url) VALUES
('chauffeur', 'chauffeur@ecoride.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'driver', 150, 'https://i.pravatar.cc/150?img=4'),
('marie_eco', 'marie.dupont@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'driver', 200, 'https://i.pravatar.cc/150?img=5'),
('thomas_green', 'thomas.bernard@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'driver', 180, 'https://i.pravatar.cc/150?img=6'),
('julie_planet', 'julie.petit@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'both', 220, 'https://i.pravatar.cc/150?img=7'),
('lucas_drive', 'lucas.robert@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'both', 190, 'https://i.pravatar.cc/150?img=8'),
('emma_green', 'emma.richard@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'driver', 160, 'https://i.pravatar.cc/150?img=9');

-- Passagers
INSERT INTO users (pseudo, email, password_hash, role, user_type, credits, photo_url) VALUES
('passager', 'passager@ecoride.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'passenger', 50, 'https://i.pravatar.cc/150?img=10'),
('pierre_voyage', 'pierre.durand@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'passenger', 80, 'https://i.pravatar.cc/150?img=11'),
('sarah_travel', 'sarah.moreau@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'passenger', 60, 'https://i.pravatar.cc/150?img=12'),
('alex_road', 'alex.simon@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'passenger', 90, 'https://i.pravatar.cc/150?img=13'),
('nadia_eco', 'nadia.laurent@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'passenger', 70, 'https://i.pravatar.cc/150?img=14');

-- ============================================
-- VÉHICULES
-- ============================================

INSERT INTO vehicles (user_id, brand, model, color, license_plate, first_registration_date, energy_type, seats_available) VALUES
-- Véhicules du chauffeur principal (id 4)
(4, 'Tesla', 'Model 3', 'Blanc', 'AA-123-BB', '2022-03-15', 'electric', 4),

-- Véhicules de marie_eco (id 5)
(5, 'Renault', 'Zoe', 'Bleu', 'CC-456-DD', '2021-06-20', 'electric', 4),
(5, 'Peugeot', '208', 'Rouge', 'EE-789-FF', '2020-09-10', 'essence', 4),

-- Véhicules de thomas_green (id 6)
(6, 'Nissan', 'Leaf', 'Gris', 'GG-234-HH', '2023-01-05', 'electric', 4),

-- Véhicules de julie_planet (id 7)
(7, 'BMW', 'i3', 'Noir', 'II-567-JJ', '2022-11-12', 'electric', 3),
(7, 'Volkswagen', 'Golf', 'Blanc', 'KK-890-LL', '2019-04-22', 'diesel', 4),

-- Véhicules de lucas_drive (id 8)
(8, 'Hyundai', 'Kona Electric', 'Vert', 'MM-345-NN', '2023-02-18', 'electric', 4),

-- Véhicules de emma_green (id 9)
(9, 'Audi', 'e-tron', 'Argent', 'OO-678-PP', '2022-07-30', 'electric', 4),
(9, 'Citroën', 'C3', 'Jaune', 'QQ-901-RR', '2018-12-05', 'essence', 4);

-- ============================================
-- COVOITURAGES
-- ============================================

-- Trajets disponibles (dans le futur)
INSERT INTO rides (driver_id, vehicle_id, departure_city, departure_address, arrival_city, arrival_address, departure_datetime, arrival_datetime, seats_available, price_credits, status) VALUES

-- Paris -> Lyon (Tesla électrique)
(4, 1, 'Paris', '1 Place de la République, 75003 Paris', 'Lyon', '15 Rue de la République, 69001 Lyon',
 DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 5 HOUR, 3, 45, 'pending'),

-- Paris -> Marseille (Renault Zoe électrique)
(5, 2, 'Paris', '50 Avenue des Champs-Élysées, 75008 Paris', 'Marseille', '25 La Canebière, 13001 Marseille',
 DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR, 4, 65, 'pending'),

-- Lyon -> Nice (Nissan Leaf électrique)
(6, 4, 'Lyon', '30 Cours Lafayette, 69003 Lyon', 'Nice', '10 Promenade des Anglais, 06000 Nice',
 DATE_ADD(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 4 HOUR, 2, 50, 'pending'),

-- Paris -> Bordeaux (BMW i3 électrique)
(7, 5, 'Paris', '100 Boulevard Saint-Germain, 75006 Paris', 'Bordeaux', '45 Cours de l\'Intendance, 33000 Bordeaux',
 DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 6 HOUR, 2, 55, 'pending'),

-- Marseille -> Toulouse (Hyundai Kona électrique)
(8, 7, 'Marseille', '80 Boulevard Longchamp, 13001 Marseille', 'Toulouse', '20 Place du Capitole, 31000 Toulouse',
 DATE_ADD(NOW(), INTERVAL 6 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 4 HOUR, 3, 42, 'pending'),

-- Paris -> Lille (Audi e-tron électrique)
(9, 8, 'Paris', '200 Rue de Rivoli, 75001 Paris', 'Lille', '5 Grand Place, 59000 Lille',
 DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 3 HOUR, 4, 35, 'pending'),

-- Lyon -> Strasbourg (Peugeot 208 essence - non écologique)
(5, 3, 'Lyon', '25 Rue Victor Hugo, 69002 Lyon', 'Strasbourg', '10 Place Kléber, 67000 Strasbourg',
 DATE_ADD(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY) + INTERVAL 5 HOUR, 3, 48, 'pending'),

-- Bordeaux -> Nantes (VW Golf diesel - non écologique)
(7, 6, 'Bordeaux', '15 Cours Victor Hugo, 33000 Bordeaux', 'Nantes', '30 Place Royale, 44000 Nantes',
 DATE_ADD(NOW(), INTERVAL 9 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 4 HOUR, 3, 38, 'pending'),

-- Toulouse -> Montpellier (Tesla électrique)
(4, 1, 'Toulouse', '5 Allées Jean Jaurès, 31000 Toulouse', 'Montpellier', '20 Place de la Comédie, 34000 Montpellier',
 DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 3 HOUR, 3, 30, 'pending'),

-- Nice -> Lyon (Nissan Leaf électrique)
(6, 4, 'Nice', '50 Avenue Jean Médecin, 06000 Nice', 'Lyon', '40 Rue de la République, 69002 Lyon',
 DATE_ADD(NOW(), INTERVAL 11 DAY), DATE_ADD(NOW(), INTERVAL 11 DAY) + INTERVAL 5 HOUR, 3, 52, 'pending');

-- Trajets passés (complétés)
INSERT INTO rides (driver_id, vehicle_id, departure_city, departure_address, arrival_city, arrival_address, departure_datetime, arrival_datetime, seats_available, price_credits, status) VALUES

(4, 1, 'Paris', '1 Place de la République, 75003 Paris', 'Lyon', '15 Rue de la République, 69001 Lyon',
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 5 HOUR, 0, 45, 'completed'),

(5, 2, 'Lyon', '30 Cours Lafayette, 69003 Lyon', 'Paris', '50 Avenue des Champs-Élysées, 75008 Paris',
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 5 HOUR, 0, 45, 'completed');

-- ============================================
-- RÉSERVATIONS
-- ============================================

-- Réservations pour trajets passés (complétés)
INSERT INTO bookings (ride_id, passenger_id, seats_booked, price_paid, status, is_validated) VALUES
(11, 10, 1, 45, 'completed', TRUE),
(11, 11, 1, 45, 'completed', TRUE),
(12, 12, 1, 45, 'completed', TRUE);

-- Réservations pour trajets futurs
INSERT INTO bookings (ride_id, passenger_id, seats_booked, price_paid, status, is_validated) VALUES
(1, 10, 1, 45, 'confirmed', FALSE),
(2, 11, 1, 65, 'confirmed', FALSE),
(3, 12, 2, 100, 'confirmed', FALSE);

-- ============================================
-- AVIS APPROUVÉS (insérés directement comme approuvés)
-- ============================================

INSERT INTO reviews_pending (booking_id, reviewer_id, reviewed_user_id, rating, comment, status, reviewed_by_employee_id, reviewed_at) VALUES
(1, 10, 4, 5, 'Excellent chauffeur ! Très ponctuel et agréable. Voiture propre et confortable. Je recommande vivement !', 'approved', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 11, 4, 4, 'Très bon trajet, chauffeur sympathique. Quelques arrêts non prévus mais rien de grave.', 'approved', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 12, 5, 5, 'Marie est une conductrice parfaite ! Conduite écologique et sécuritaire. Super expérience.', 'approved', 2, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Avis en attente de validation
INSERT INTO reviews_pending (booking_id, reviewer_id, reviewed_user_id, rating, comment, status) VALUES
(4, 10, 4, 5, 'Toujours aussi parfait ! Merci pour ce trajet agréable.', 'pending');

-- ============================================
-- LITIGES
-- ============================================

INSERT INTO disputes (booking_id, reporter_id, reported_user_id, reason, status, handled_by_employee_id) VALUES
(3, 12, 5, 'Le chauffeur est arrivé avec 30 minutes de retard sans prévenir. Cela m\'a fait rater mon rendez-vous.', 'in_progress', 2);

-- ============================================
-- TRANSACTIONS DE CRÉDITS
-- ============================================

-- Crédits d'inscription
INSERT INTO credit_transactions (user_id, amount, type, reference_type, balance_after, description) VALUES
(4, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(5, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(6, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(7, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(8, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(9, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(10, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(11, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(12, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(13, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription'),
(14, 20, 'bonus', 'registration', 20, 'Bonus d\'inscription');

-- Paiements de trajets complétés
INSERT INTO credit_transactions (user_id, amount, type, reference_type, reference_id, balance_after, description) VALUES
(4, 43, 'credit', 'ride_completion', 1, 150, 'Paiement reçu pour le trajet #11'),
(4, 43, 'credit', 'ride_completion', 2, 193, 'Paiement reçu pour le trajet #11'),
(5, 43, 'credit', 'ride_completion', 3, 200, 'Paiement reçu pour le trajet #12');

-- ============================================
-- NOTIFICATIONS
-- ============================================

INSERT INTO notifications (user_id, type, title, message, is_read, reference_type, reference_id) VALUES
(10, 'booking', 'Réservation confirmée', 'Votre réservation pour le trajet Paris -> Lyon a été confirmée.', TRUE, 'booking', 4),
(11, 'booking', 'Réservation confirmée', 'Votre réservation pour le trajet Paris -> Marseille a été confirmée.', TRUE, 'booking', 5),
(12, 'booking', 'Réservation confirmée', 'Votre réservation pour le trajet Lyon -> Nice a été confirmée.', FALSE, 'booking', 6),
(4, 'ride_update', 'Nouvelle réservation', 'pierre_voyage a réservé une place pour votre trajet Paris -> Lyon.', FALSE, 'ride', 1),
(5, 'review', 'Nouvel avis', 'Vous avez reçu un nouvel avis 5 étoiles !', FALSE, 'review', 3),
(2, 'system', 'Avis à valider', 'Un nouvel avis est en attente de validation.', FALSE, 'review', 4),
(2, 'dispute', 'Nouveau litige', 'Un nouveau litige a été ouvert et nécessite votre attention.', FALSE, 'dispute', 1);

-- ============================================
-- STATISTIQUES DE PLATEFORME
-- ============================================

INSERT INTO platform_stats (date, total_rides, total_bookings, credits_earned, new_users, active_users) VALUES
(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 15, 32, 64, 5, 48),
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 18, 38, 76, 8, 52),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 12, 28, 56, 3, 45),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 20, 42, 84, 6, 55),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 16, 35, 70, 4, 50),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 14, 30, 60, 7, 47),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 19, 40, 80, 5, 53);

-- Message de confirmation
SELECT 'Données de test insérées avec succès !' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as total_rides FROM rides;
SELECT COUNT(*) as total_bookings FROM bookings;
