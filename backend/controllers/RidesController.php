<?php
/**
 * EcoRide - Controller pour les covoiturages
 * API REST pour gérer les trajets
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../models/Ride.php';
require_once __DIR__ . '/../models/User.php';

class RidesController {
    private $ride;
    private $requestMethod;
    private $rideId;

    public function __construct() {
        $this->ride = new Ride();
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];

        // Récupérer l'ID depuis l'URL si présent
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = explode('/', $uri);

        if (isset($uri[3]) && is_numeric($uri[3])) {
            $this->rideId = (int)$uri[3];
        }
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'GET':
                if ($this->rideId) {
                    $response = $this->getRide($this->rideId);
                } else {
                    $response = $this->searchRides();
                }
                break;

            case 'POST':
                $response = $this->createRide();
                break;

            case 'PUT':
                if (!$this->rideId) {
                    $response = $this->unprocessableEntityResponse();
                } else {
                    $response = $this->updateRide($this->rideId);
                }
                break;

            case 'DELETE':
                if (!$this->rideId) {
                    $response = $this->unprocessableEntityResponse();
                } else {
                    $response = $this->deleteRide($this->rideId);
                }
                break;

            default:
                $response = $this->notFoundResponse();
                break;
        }

        header($response['status_code_header']);
        if ($response['body']) {
            echo $response['body'];
        }
    }

    /**
     * Rechercher des covoiturages
     */
    private function searchRides() {
        // Récupérer les paramètres de recherche
        $filters = [];

        if (isset($_GET['departure_city'])) {
            $filters['departure_city'] = $_GET['departure_city'];
        }

        if (isset($_GET['arrival_city'])) {
            $filters['arrival_city'] = $_GET['arrival_city'];
        }

        if (isset($_GET['date'])) {
            $filters['date'] = $_GET['date'];
        }

        if (isset($_GET['max_price'])) {
            $filters['max_price'] = (int)$_GET['max_price'];
        }

        if (isset($_GET['min_rating'])) {
            $filters['min_rating'] = (float)$_GET['min_rating'];
        }

        if (isset($_GET['ecological_only']) && $_GET['ecological_only'] === 'true') {
            $filters['ecological_only'] = true;
        }

        if (isset($_GET['limit'])) {
            $filters['limit'] = (int)$_GET['limit'];
        }

        try {
            $rides = $this->ride->search($filters);

            // Charger les préférences MongoDB pour chaque chauffeur
            $mongo = Database::getMongoConnection();
            $preferencesCollection = $mongo->selectCollection('preferences');

            foreach ($rides as &$ride) {
                // Récupérer les préférences du chauffeur
                $prefs = $preferencesCollection->findOne(['user_id' => $ride['driver_id']]);

                if ($prefs) {
                    $ride['driver_preferences'] = json_decode(json_encode($prefs), true);
                }
            }

            $response['status_code_header'] = 'HTTP/1.1 200 OK';
            $response['body'] = json_encode([
                'success' => true,
                'data' => $rides,
                'count' => count($rides),
                'filters' => $filters
            ]);

        } catch (Exception $e) {
            $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $response['body'] = json_encode([
                'success' => false,
                'message' => 'Erreur lors de la recherche des covoiturages',
                'error' => $e->getMessage()
            ]);
        }

        return $response;
    }

    /**
     * Obtenir un covoiturage spécifique
     */
    private function getRide($id) {
        try {
            $ride = $this->ride->findById($id);

            if (!$ride) {
                return $this->notFoundResponse();
            }

            // Charger les préférences du chauffeur depuis MongoDB
            $mongo = Database::getMongoConnection();
            $preferencesCollection = $mongo->selectCollection('preferences');
            $prefs = $preferencesCollection->findOne(['user_id' => $ride['driver_id']]);

            if ($prefs) {
                $ride['driver_preferences'] = json_decode(json_encode($prefs), true);
            }

            // Charger les avis approuvés depuis MongoDB
            $reviewsCollection = $mongo->selectCollection('reviews');
            $reviews = $reviewsCollection->find(
                [
                    'reviewed_user.user_id' => $ride['driver_id'],
                    'status' => 'approved'
                ],
                ['sort' => ['created_at' => -1], 'limit' => 10]
            )->toArray();

            $ride['reviews'] = json_decode(json_encode($reviews), true);

            // Récupérer les réservations actuelles
            $bookingsQuery = "SELECT COUNT(*) as bookings_count,
                                     SUM(seats_booked) as seats_booked
                              FROM bookings
                              WHERE ride_id = :ride_id
                                AND status = 'confirmed'";

            $stmt = Database::getConnection()->prepare($bookingsQuery);
            $stmt->bindParam(':ride_id', $id);
            $stmt->execute();
            $bookingsData = $stmt->fetch();

            $ride['bookings_count'] = $bookingsData['bookings_count'];
            $ride['seats_booked'] = $bookingsData['seats_booked'];

            $response['status_code_header'] = 'HTTP/1.1 200 OK';
            $response['body'] = json_encode([
                'success' => true,
                'data' => $ride
            ]);

        } catch (Exception $e) {
            $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $response['body'] = json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération du covoiturage',
                'error' => $e->getMessage()
            ]);
        }

        return $response;
    }

    /**
     * Créer un nouveau covoiturage
     */
    private function createRide() {
        $input = (array) json_decode(file_get_contents('php://input'), true);

        // Validation des données
        if (!$this->validateInput($input)) {
            return $this->unprocessableEntityResponse();
        }

        // TODO: Vérifier l'authentification de l'utilisateur
        // $userId = $this->getUserIdFromToken();

        $this->ride->driver_id = $input['driver_id'];
        $this->ride->vehicle_id = $input['vehicle_id'];
        $this->ride->departure_city = $input['departure_city'];
        $this->ride->departure_address = $input['departure_address'];
        $this->ride->departure_lat = $input['departure_lat'] ?? null;
        $this->ride->departure_lng = $input['departure_lng'] ?? null;
        $this->ride->arrival_city = $input['arrival_city'];
        $this->ride->arrival_address = $input['arrival_address'];
        $this->ride->arrival_lat = $input['arrival_lat'] ?? null;
        $this->ride->arrival_lng = $input['arrival_lng'] ?? null;
        $this->ride->departure_datetime = $input['departure_datetime'];
        $this->ride->arrival_datetime = $input['arrival_datetime'];
        $this->ride->seats_available = $input['seats_available'];
        $this->ride->price_credits = $input['price_credits'];

        try {
            $rideId = $this->ride->create();

            if ($rideId) {
                $response['status_code_header'] = 'HTTP/1.1 201 Created';
                $response['body'] = json_encode([
                    'success' => true,
                    'message' => 'Covoiturage créé avec succès',
                    'data' => ['id' => $rideId]
                ]);
            } else {
                $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
                $response['body'] = json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de la création du covoiturage'
                ]);
            }

        } catch (Exception $e) {
            $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $response['body'] = json_encode([
                'success' => false,
                'message' => 'Erreur serveur',
                'error' => $e->getMessage()
            ]);
        }

        return $response;
    }

    /**
     * Mettre à jour un covoiturage
     */
    private function updateRide($id) {
        $input = (array) json_decode(file_get_contents('php://input'), true);

        // TODO: Vérifier que l'utilisateur est le propriétaire du covoiturage

        try {
            $result = false;

            // Mettre à jour le statut
            if (isset($input['status'])) {
                $result = $this->ride->updateStatus($id, $input['status']);
            }

            // Mettre à jour les places
            if (isset($input['seats_available'])) {
                $result = $this->ride->updateSeats($id, $input['seats_available']);
            }

            if ($result) {
                $response['status_code_header'] = 'HTTP/1.1 200 OK';
                $response['body'] = json_encode([
                    'success' => true,
                    'message' => 'Covoiturage mis à jour avec succès'
                ]);
            } else {
                $response['status_code_header'] = 'HTTP/1.1 404 Not Found';
                $response['body'] = json_encode([
                    'success' => false,
                    'message' => 'Covoiturage non trouvé ou mise à jour échouée'
                ]);
            }

        } catch (Exception $e) {
            $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $response['body'] = json_encode([
                'success' => false,
                'message' => 'Erreur serveur',
                'error' => $e->getMessage()
            ]);
        }

        return $response;
    }

    /**
     * Annuler un covoiturage
     */
    private function deleteRide($id) {
        // TODO: Vérifier que l'utilisateur est le propriétaire du covoiturage

        try {
            $result = $this->ride->cancel($id);

            if ($result) {
                $response['status_code_header'] = 'HTTP/1.1 200 OK';
                $response['body'] = json_encode([
                    'success' => true,
                    'message' => 'Covoiturage annulé avec succès'
                ]);
            } else {
                $response['status_code_header'] = 'HTTP/1.1 404 Not Found';
                $response['body'] = json_encode([
                    'success' => false,
                    'message' => 'Covoiturage non trouvé ou annulation échouée'
                ]);
            }

        } catch (Exception $e) {
            $response['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $response['body'] = json_encode([
                'success' => false,
                'message' => 'Erreur serveur',
                'error' => $e->getMessage()
            ]);
        }

        return $response;
    }

    /**
     * Valider les données d'entrée
     */
    private function validateInput($input) {
        $required = [
            'driver_id', 'vehicle_id', 'departure_city', 'departure_address',
            'arrival_city', 'arrival_address', 'departure_datetime',
            'arrival_datetime', 'seats_available', 'price_credits'
        ];

        foreach ($required as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                return false;
            }
        }

        return true;
    }

    private function unprocessableEntityResponse() {
        $response['status_code_header'] = 'HTTP/1.1 422 Unprocessable Entity';
        $response['body'] = json_encode([
            'success' => false,
            'message' => 'Données invalides'
        ]);
        return $response;
    }

    private function notFoundResponse() {
        $response['status_code_header'] = 'HTTP/1.1 404 Not Found';
        $response['body'] = json_encode([
            'success' => false,
            'message' => 'Ressource non trouvée'
        ]);
        return $response;
    }
}

// Exécuter le controller
$controller = new RidesController();
$controller->processRequest();
