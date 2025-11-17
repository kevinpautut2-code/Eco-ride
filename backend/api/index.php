<?php
/**
 * EcoRide API - Point d'entrée principal
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Répondre aux requêtes OPTIONS (préflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Charger l'autoloader Composer
require_once __DIR__ . '/../../vendor/autoload.php';

// Charger Database
require_once __DIR__ . '/../config/Database.php';

// Récupérer la méthode et l'URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend/api', '', $uri);

// Fonction pour envoyer une réponse JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Fonction pour récupérer le body JSON
function getRequestBody() {
    $input = file_get_contents('php://input');

    if (!empty($input)) {
        $decoded = json_decode($input, true);
        if (json_last_error() === JSON_ERROR_NONE && $decoded !== null) {
            return $decoded;
        }
    }

    // Fallback to $_POST if php://input is empty
    if (!empty($_POST)) {
        return $_POST;
    }

    return [];
}

// Router simple
try {
    $conn = Database::getConnection();

    // === AUTH ENDPOINTS ===

    // POST /auth/login
    if ($method === 'POST' && $uri === '/auth/login') {
        $data = getRequestBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            sendResponse(['error' => 'Email et mot de passe requis'], 400);
        }

        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            $token = base64_encode($email . ':' . time());

            sendResponse([
                'success' => true,
                'token' => $token,
                'user' => $user
            ]);
        } else {
            sendResponse(['error' => 'Identifiants invalides'], 401);
        }
    }

    // POST /auth/register
    if ($method === 'POST' && $uri === '/auth/register') {
        $data = getRequestBody();

        $requiredFields = ['pseudo', 'email', 'password'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                sendResponse(['error' => "Le champ $field est requis"], 400);
            }
        }

        $passwordHash = password_hash($data['password'], PASSWORD_ARGON2ID);

        $stmt = $conn->prepare("
            INSERT INTO users (pseudo, email, password_hash, role, user_type, credits)
            VALUES (?, ?, ?, 'user', ?, 20)
        ");

        try {
            $stmt->execute([
                $data['pseudo'],
                $data['email'],
                $passwordHash,
                $data['user_type'] ?? 'both'
            ]);

            $userId = $conn->lastInsertId();
            $user = $conn->query("SELECT * FROM users WHERE id = $userId")->fetch();
            unset($user['password_hash']);

            sendResponse([
                'success' => true,
                'message' => 'Compte créé avec succès',
                'user' => $user
            ], 201);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                sendResponse(['error' => 'Email ou pseudo déjà utilisé'], 400);
            }
            sendResponse(['error' => 'Erreur lors de la création du compte'], 500);
        }
    }

    // === RIDES ENDPOINTS ===

    // GET /rides - Liste des trajets avec filtres
    if ($method === 'GET' && $uri === '/rides') {
        $sql = "SELECT
                    r.*,
                    u.pseudo as driver_pseudo,
                    u.photo_url as driver_photo,
                    v.brand,
                    v.model,
                    v.color,
                    v.energy_type,
                    TIMESTAMPDIFF(HOUR, r.departure_datetime, r.arrival_datetime) as duration_hours,
                    (SELECT AVG(rating) FROM reviews WHERE driver_id = r.driver_id) as driver_rating,
                    (r.seats_available - COALESCE((SELECT COUNT(*) FROM bookings WHERE ride_id = r.id AND status = 'confirmed'), 0)) as seats_left
                FROM rides r
                LEFT JOIN users u ON r.driver_id = u.id
                LEFT JOIN vehicles v ON r.vehicle_id = v.id
                WHERE r.status IN ('pending', 'active')
                AND r.departure_datetime > NOW()";

        $params = [];

        if (!empty($_GET['departure_city'])) {
            $sql .= " AND r.departure_city LIKE ?";
            $params[] = '%' . $_GET['departure_city'] . '%';
        }

        if (!empty($_GET['arrival_city'])) {
            $sql .= " AND r.arrival_city LIKE ?";
            $params[] = '%' . $_GET['arrival_city'] . '%';
        }

        if (!empty($_GET['date'])) {
            $sql .= " AND DATE(r.departure_datetime) = ?";
            $params[] = $_GET['date'];
        }

        if (!empty($_GET['max_price'])) {
            $sql .= " AND r.price_credits <= ?";
            $params[] = (int)$_GET['max_price'];
        }

        if (isset($_GET['ecological_only']) && $_GET['ecological_only'] === 'true') {
            $sql .= " AND r.is_ecological = 1";
        }

        $sql .= " ORDER BY r.departure_datetime ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $rides = $stmt->fetchAll();

        // Filtrer par note minimale côté PHP
        if (!empty($_GET['min_rating'])) {
            $minRating = (float)$_GET['min_rating'];
            $rides = array_filter($rides, function($ride) use ($minRating) {
                return ($ride['driver_rating'] ?? 5.0) >= $minRating;
            });
            $rides = array_values($rides);
        }

        sendResponse([
            'success' => true,
            'count' => count($rides),
            'rides' => $rides
        ]);
    }

    // GET /rides/{id} - Détails d'un trajet
    if ($method === 'GET' && preg_match('#^/rides/(\d+)$#', $uri, $matches)) {
        $rideId = $matches[1];

        $stmt = $conn->prepare("
            SELECT
                r.*,
                u.pseudo as driver_pseudo,
                u.email as driver_email,
                u.photo_url as driver_photo,
                v.brand,
                v.model,
                v.color,
                v.energy_type,
                v.first_registration_date,
                v.seats_available as vehicle_seats,
                TIMESTAMPDIFF(HOUR, r.departure_datetime, r.arrival_datetime) as duration_hours,
                (SELECT AVG(rating) FROM reviews WHERE driver_id = r.driver_id) as driver_rating,
                (SELECT COUNT(*) FROM rides WHERE driver_id = r.driver_id AND status = 'completed') as driver_total_rides,
                (SELECT COUNT(*) FROM reviews WHERE driver_id = r.driver_id) as driver_reviews_count,
                (r.seats_available - COALESCE((SELECT COUNT(*) FROM bookings WHERE ride_id = r.id AND status = 'confirmed'), 0)) as seats_left
            FROM rides r
            LEFT JOIN users u ON r.driver_id = u.id
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            WHERE r.id = ?
        ");
        $stmt->execute([$rideId]);
        $ride = $stmt->fetch();

        if ($ride) {
            // Récupérer les avis du chauffeur
            $stmt = $conn->prepare("
                SELECT r.*, u.pseudo as reviewer_pseudo
                FROM reviews r
                LEFT JOIN users u ON r.reviewer_id = u.id
                WHERE r.driver_id = ?
                ORDER BY r.created_at DESC
                LIMIT 5
            ");
            $stmt->execute([$ride['driver_id']]);
            $ride['reviews'] = $stmt->fetchAll();

            sendResponse([
                'success' => true,
                'ride' => $ride
            ]);
        } else {
            sendResponse(['error' => 'Trajet non trouvé'], 404);
        }
    }

    // POST /rides - Créer un trajet
    if ($method === 'POST' && $uri === '/rides') {
        $data = getRequestBody();

        $requiredFields = ['driver_id', 'vehicle_id', 'departure_city', 'arrival_city',
                          'departure_address', 'arrival_address', 'departure_datetime',
                          'arrival_datetime', 'seats_available', 'price_credits'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                sendResponse(['error' => "Le champ $field est requis"], 400);
            }
        }

        $stmt = $conn->prepare("
            INSERT INTO rides (driver_id, vehicle_id, departure_city, departure_address,
                              arrival_city, arrival_address, departure_datetime,
                              arrival_datetime, seats_available, price_credits, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
        ");

        try {
            $stmt->execute([
                $data['driver_id'],
                $data['vehicle_id'],
                $data['departure_city'],
                $data['departure_address'],
                $data['arrival_city'],
                $data['arrival_address'],
                $data['departure_datetime'],
                $data['arrival_datetime'],
                $data['seats_available'],
                $data['price_credits']
            ]);

            $rideId = $conn->lastInsertId();
            $ride = $conn->query("SELECT * FROM rides WHERE id = $rideId")->fetch();

            sendResponse([
                'success' => true,
                'message' => 'Trajet créé avec succès',
                'ride' => $ride
            ], 201);
        } catch (PDOException $e) {
            sendResponse(['error' => 'Erreur lors de la création du trajet: ' . $e->getMessage()], 500);
        }
    }

    // POST /rides/{id}/book - Réserver un trajet
    if ($method === 'POST' && preg_match('#^/rides/(\d+)/book$#', $uri, $matches)) {
        $rideId = $matches[1];
        $data = getRequestBody();
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            sendResponse(['error' => 'user_id requis'], 400);
        }

        // Vérifier le trajet
        $stmt = $conn->prepare("SELECT * FROM rides WHERE id = ?");
        $stmt->execute([$rideId]);
        $ride = $stmt->fetch();

        if (!$ride) {
            sendResponse(['error' => 'Trajet non trouvé'], 404);
        }

        // Vérifier les places disponibles
        if ($ride['seats_available'] <= 0) {
            sendResponse(['error' => 'Plus de places disponibles'], 400);
        }

        // Vérifier les crédits de l'utilisateur
        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user['credits'] < $ride['price_credits']) {
            sendResponse(['error' => 'Crédits insuffisants'], 400);
        }

        // Transaction
        $conn->beginTransaction();

        try {
            // Créer la réservation
            $stmt = $conn->prepare("
                INSERT INTO bookings (ride_id, passenger_id, status, credits_amount)
                VALUES (?, ?, 'confirmed', ?)
            ");
            $stmt->execute([$rideId, $userId, $ride['price_credits']]);

            // Débiter les crédits du passager
            $stmt = $conn->prepare("
                UPDATE users SET credits = credits - ? WHERE id = ?
            ");
            $stmt->execute([$ride['price_credits'], $userId]);

            // Log la transaction
            $stmt = $conn->prepare("
                INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
                VALUES (?, ?, 'debit', ?)
            ");
            $stmt->execute([$userId, -$ride['price_credits'], 'Réservation trajet #' . $rideId]);

            // Mettre à jour les places disponibles
            $stmt = $conn->prepare("
                UPDATE rides SET seats_available = seats_available - 1 WHERE id = ?
            ");
            $stmt->execute([$rideId]);

            $conn->commit();

            sendResponse([
                'success' => true,
                'message' => 'Réservation confirmée',
                'new_credits' => $user['credits'] - $ride['price_credits']
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(['error' => 'Erreur lors de la réservation: ' . $e->getMessage()], 500);
        }
    }

    // === USERS ENDPOINTS ===

    // GET /users/{id} - Profil utilisateur
    if ($method === 'GET' && preg_match('#^/users/(\d+)$#', $uri, $matches)) {
        $userId = $matches[1];

        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user) {
            unset($user['password_hash']);

            sendResponse([
                'success' => true,
                'user' => $user
            ]);
        } else {
            sendResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
    }

    // GET /vehicles - Liste des véhicules
    if ($method === 'GET' && $uri === '/vehicles') {
        $userId = $_GET['user_id'] ?? null;

        $sql = "SELECT * FROM vehicles";
        if ($userId) {
            $sql .= " WHERE driver_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$userId]);
        } else {
            $stmt = $conn->query($sql);
        }

        $vehicles = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'vehicles' => $vehicles
        ]);
    }

    // GET /users/{id}/rides - Trajets créés par l'utilisateur (en tant que conducteur)
    if ($method === 'GET' && preg_match('#^/users/(\d+)/rides$#', $uri, $matches)) {
        $userId = $matches[1];

        $stmt = $conn->prepare("
            SELECT
                r.*,
                v.brand,
                v.model,
                v.color,
                v.energy_type,
                (SELECT COUNT(*) FROM bookings WHERE ride_id = r.id AND status = 'confirmed') as passengers_count,
                r.seats_available as total_seats
            FROM rides r
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            WHERE r.driver_id = ?
            ORDER BY r.departure_datetime DESC
        ");
        $stmt->execute([$userId]);
        $rides = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'rides' => $rides
        ]);
    }

    // GET /users/{id}/bookings - Réservations de l'utilisateur (en tant que passager)
    if ($method === 'GET' && preg_match('#^/users/(\d+)/bookings$#', $uri, $matches)) {
        $userId = $matches[1];

        $stmt = $conn->prepare("
            SELECT
                b.*,
                r.id as ride_id,
                r.departure_city,
                r.departure_address,
                r.arrival_city,
                r.arrival_address,
                r.departure_datetime,
                r.arrival_datetime,
                r.price_credits,
                r.status,
                u.pseudo as driver_pseudo,
                v.brand,
                v.model,
                v.color,
                v.energy_type
            FROM bookings b
            LEFT JOIN rides r ON b.ride_id = r.id
            LEFT JOIN users u ON r.driver_id = u.id
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            WHERE b.passenger_id = ?
            ORDER BY r.departure_datetime DESC
        ");
        $stmt->execute([$userId]);
        $bookings = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'bookings' => $bookings
        ]);
    }

    // DELETE /rides/{id} - Annuler un trajet (conducteur)
    if ($method === 'DELETE' && preg_match('#^/rides/(\d+)$#', $uri, $matches)) {
        $rideId = $matches[1];

        // Vérifier que le trajet existe
        $stmt = $conn->prepare("SELECT * FROM rides WHERE id = ?");
        $stmt->execute([$rideId]);
        $ride = $stmt->fetch();

        if (!$ride) {
            sendResponse(['error' => 'Trajet non trouvé'], 404);
        }

        // Transaction pour annuler le trajet et rembourser les passagers
        $conn->beginTransaction();

        try {
            // Récupérer toutes les réservations confirmées
            $stmt = $conn->prepare("
                SELECT * FROM bookings WHERE ride_id = ? AND status = 'confirmed'
            ");
            $stmt->execute([$rideId]);
            $bookings = $stmt->fetchAll();

            // Rembourser chaque passager
            foreach ($bookings as $booking) {
                // Créditer le passager
                $stmt = $conn->prepare("
                    UPDATE users SET credits = credits + ? WHERE id = ?
                ");
                $stmt->execute([$booking['credits_amount'], $booking['passenger_id']]);

                // Log la transaction
                $stmt = $conn->prepare("
                    INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
                    VALUES (?, ?, 'credit', ?)
                ");
                $stmt->execute([
                    $booking['passenger_id'],
                    $booking['credits_amount'],
                    'Remboursement trajet annulé #' . $rideId
                ]);

                // Annuler la réservation
                $stmt = $conn->prepare("
                    UPDATE bookings SET status = 'cancelled' WHERE id = ?
                ");
                $stmt->execute([$booking['id']]);

                // TODO: Envoyer email au passager
            }

            // Annuler le trajet
            $stmt = $conn->prepare("
                UPDATE rides SET status = 'cancelled' WHERE id = ?
            ");
            $stmt->execute([$rideId]);

            $conn->commit();

            sendResponse([
                'success' => true,
                'message' => 'Trajet annulé avec succès',
                'passengers_refunded' => count($bookings)
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(['error' => 'Erreur lors de l\'annulation: ' . $e->getMessage()], 500);
        }
    }

    // DELETE /bookings/{id} - Annuler une réservation (passager)
    if ($method === 'DELETE' && preg_match('#^/bookings/(\d+)$#', $uri, $matches)) {
        $bookingId = $matches[1];

        // Vérifier que la réservation existe
        $stmt = $conn->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();

        if (!$booking) {
            sendResponse(['error' => 'Réservation non trouvée'], 404);
        }

        if ($booking['status'] !== 'confirmed') {
            sendResponse(['error' => 'Cette réservation ne peut pas être annulée'], 400);
        }

        // Transaction pour annuler la réservation et rembourser
        $conn->beginTransaction();

        try {
            // Rembourser le passager
            $stmt = $conn->prepare("
                UPDATE users SET credits = credits + ? WHERE id = ?
            ");
            $stmt->execute([$booking['credits_amount'], $booking['passenger_id']]);

            // Récupérer le nouveau solde
            $stmt = $conn->prepare("SELECT credits FROM users WHERE id = ?");
            $stmt->execute([$booking['passenger_id']]);
            $newCredits = $stmt->fetchColumn();

            // Log la transaction
            $stmt = $conn->prepare("
                INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
                VALUES (?, ?, 'credit', ?)
            ");
            $stmt->execute([
                $booking['passenger_id'],
                $booking['credits_amount'],
                'Remboursement réservation annulée #' . $bookingId
            ]);

            // Annuler la réservation
            $stmt = $conn->prepare("
                UPDATE bookings SET status = 'cancelled' WHERE id = ?
            ");
            $stmt->execute([$bookingId]);

            // Libérer une place sur le trajet
            $stmt = $conn->prepare("
                UPDATE rides SET seats_available = seats_available + 1 WHERE id = ?
            ");
            $stmt->execute([$booking['ride_id']]);

            $conn->commit();

            // TODO: Envoyer email au conducteur

            sendResponse([
                'success' => true,
                'message' => 'Réservation annulée avec succès',
                'new_credits' => $newCredits
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(['error' => 'Erreur lors de l\'annulation: ' . $e->getMessage()], 500);
        }
    }

    // GET /rides/{id}/bookings - Réservations d'un trajet
    if ($method === 'GET' && preg_match('#^/rides/(\d+)/bookings$#', $uri, $matches)) {
        $rideId = $matches[1];

        $stmt = $conn->prepare("
            SELECT
                b.*,
                u.pseudo as passenger_pseudo,
                u.photo_url as passenger_photo
            FROM bookings b
            LEFT JOIN users u ON b.passenger_id = u.id
            WHERE b.ride_id = ? AND b.status = 'confirmed'
            ORDER BY b.created_at ASC
        ");
        $stmt->execute([$rideId]);
        $bookings = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'bookings' => $bookings
        ]);
    }

    // POST /rides/{id}/start - Démarrer un trajet
    if ($method === 'POST' && preg_match('#^/rides/(\d+)/start$#', $uri, $matches)) {
        $rideId = $matches[1];
        $data = getRequestBody();

        // Vérifier que le trajet existe
        $stmt = $conn->prepare("SELECT * FROM rides WHERE id = ?");
        $stmt->execute([$rideId]);
        $ride = $stmt->fetch();

        if (!$ride) {
            sendResponse(['error' => 'Trajet non trouvé'], 404);
        }

        if ($ride['status'] !== 'available' && $ride['status'] !== 'pending') {
            sendResponse(['error' => 'Ce trajet ne peut pas être démarré (statut: ' . $ride['status'] . ')'], 400);
        }

        try {
            // Mettre à jour le statut et l'heure de départ réelle
            $stmt = $conn->prepare("
                UPDATE rides
                SET status = 'in_progress',
                    actual_start_datetime = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$rideId]);

            // TODO: Envoyer email aux passagers

            sendResponse([
                'success' => true,
                'message' => 'Trajet démarré avec succès',
                'actual_start_datetime' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            sendResponse(['error' => 'Erreur lors du démarrage: ' . $e->getMessage()], 500);
        }
    }

    // POST /rides/{id}/complete - Terminer un trajet
    if ($method === 'POST' && preg_match('#^/rides/(\d+)/complete$#', $uri, $matches)) {
        $rideId = $matches[1];
        $data = getRequestBody();

        // Vérifier que le trajet existe
        $stmt = $conn->prepare("SELECT * FROM rides WHERE id = ?");
        $stmt->execute([$rideId]);
        $ride = $stmt->fetch();

        if (!$ride) {
            sendResponse(['error' => 'Trajet non trouvé'], 404);
        }

        if ($ride['status'] !== 'in_progress') {
            sendResponse(['error' => 'Ce trajet n\'est pas en cours'], 400);
        }

        // Transaction pour terminer le trajet et créditer le conducteur
        $conn->beginTransaction();

        try {
            // Compter les passagers confirmés
            $stmt = $conn->prepare("
                SELECT COUNT(*) FROM bookings WHERE ride_id = ? AND status = 'confirmed'
            ");
            $stmt->execute([$rideId]);
            $passengerCount = $stmt->fetchColumn();

            // Calculer les gains (prix - 2 crédits plateforme) * nombre de passagers
            $earningsPerPassenger = max(0, $ride['price_credits'] - 2);
            $totalEarnings = $earningsPerPassenger * $passengerCount;

            // Créditer le conducteur
            $stmt = $conn->prepare("
                UPDATE users SET credits = credits + ? WHERE id = ?
            ");
            $stmt->execute([$totalEarnings, $ride['driver_id']]);

            // Récupérer le nouveau solde
            $stmt = $conn->prepare("SELECT credits FROM users WHERE id = ?");
            $stmt->execute([$ride['driver_id']]);
            $newCredits = $stmt->fetchColumn();

            // Log la transaction
            $stmt = $conn->prepare("
                INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
                VALUES (?, ?, 'credit', ?)
            ");
            $stmt->execute([
                $ride['driver_id'],
                $totalEarnings,
                'Revenus trajet #' . $rideId . ' (' . $passengerCount . ' passager(s))'
            ]);

            // Mettre à jour le trajet
            $stmt = $conn->prepare("
                UPDATE rides
                SET status = 'completed',
                    actual_end_datetime = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$rideId]);

            $conn->commit();

            // TODO: Envoyer email aux passagers pour demander avis

            sendResponse([
                'success' => true,
                'message' => 'Trajet terminé avec succès',
                'credits_earned' => $totalEarnings,
                'new_credits' => $newCredits,
                'passenger_count' => $passengerCount
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(['error' => 'Erreur lors de la fin du trajet: ' . $e->getMessage()], 500);
        }
    }

    // Route non trouvée
    sendResponse(['error' => 'Endpoint non trouvé: ' . $method . ' ' . $uri], 404);

} catch (Exception $e) {
    sendResponse([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage()
    ], 500);
}
