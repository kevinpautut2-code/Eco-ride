<?php
/**
 * EcoRide - Modèle Ride
 * Gestion des covoiturages
 */

require_once __DIR__ . '/../config/Database.php';

class Ride {
    private $conn;
    private $table = 'rides';

    // Propriétés
    public $id;
    public $driver_id;
    public $vehicle_id;
    public $departure_city;
    public $departure_address;
    public $departure_lat;
    public $departure_lng;
    public $arrival_city;
    public $arrival_address;
    public $arrival_lat;
    public $arrival_lng;
    public $departure_datetime;
    public $arrival_datetime;
    public $seats_available;
    public $price_credits;
    public $is_ecological;
    public $status;

    public function __construct() {
        $this->conn = Database::getConnection();
    }

    /**
     * Créer un nouveau covoiturage
     *
     * @return bool|int
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  (driver_id, vehicle_id, departure_city, departure_address, departure_lat, departure_lng,
                   arrival_city, arrival_address, arrival_lat, arrival_lng, departure_datetime, arrival_datetime,
                   seats_available, price_credits, status)
                  VALUES (:driver_id, :vehicle_id, :departure_city, :departure_address, :departure_lat, :departure_lng,
                          :arrival_city, :arrival_address, :arrival_lat, :arrival_lng, :departure_datetime, :arrival_datetime,
                          :seats_available, :price_credits, :status)";

        $stmt = $this->conn->prepare($query);

        // Sécuriser les données
        $this->departure_city = htmlspecialchars(strip_tags($this->departure_city));
        $this->departure_address = htmlspecialchars(strip_tags($this->departure_address));
        $this->arrival_city = htmlspecialchars(strip_tags($this->arrival_city));
        $this->arrival_address = htmlspecialchars(strip_tags($this->arrival_address));
        $this->status = $this->status ?? 'pending';

        // Bind
        $stmt->bindParam(':driver_id', $this->driver_id);
        $stmt->bindParam(':vehicle_id', $this->vehicle_id);
        $stmt->bindParam(':departure_city', $this->departure_city);
        $stmt->bindParam(':departure_address', $this->departure_address);
        $stmt->bindParam(':departure_lat', $this->departure_lat);
        $stmt->bindParam(':departure_lng', $this->departure_lng);
        $stmt->bindParam(':arrival_city', $this->arrival_city);
        $stmt->bindParam(':arrival_address', $this->arrival_address);
        $stmt->bindParam(':arrival_lat', $this->arrival_lat);
        $stmt->bindParam(':arrival_lng', $this->arrival_lng);
        $stmt->bindParam(':departure_datetime', $this->departure_datetime);
        $stmt->bindParam(':arrival_datetime', $this->arrival_datetime);
        $stmt->bindParam(':seats_available', $this->seats_available);
        $stmt->bindParam(':price_credits', $this->price_credits);
        $stmt->bindParam(':status', $this->status);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return $this->id;
        }

        return false;
    }

    /**
     * Rechercher des covoiturages avec filtres
     *
     * @param array $filters
     * @return array
     */
    public function search($filters = []) {
        $query = "SELECT
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
                FROM " . $this->table . " r
                INNER JOIN users u ON u.id = r.driver_id
                INNER JOIN vehicles v ON v.id = r.vehicle_id
                LEFT JOIN reviews_pending rp ON rp.reviewed_user_id = r.driver_id AND rp.status = 'approved'
                WHERE r.status = 'pending'
                    AND r.seats_available > 0
                    AND r.departure_datetime > NOW()";

        $params = [];

        // Filtre ville de départ
        if (!empty($filters['departure_city'])) {
            $query .= " AND r.departure_city LIKE :departure_city";
            $params[':departure_city'] = '%' . $filters['departure_city'] . '%';
        }

        // Filtre ville d'arrivée
        if (!empty($filters['arrival_city'])) {
            $query .= " AND r.arrival_city LIKE :arrival_city";
            $params[':arrival_city'] = '%' . $filters['arrival_city'] . '%';
        }

        // Filtre date
        if (!empty($filters['date'])) {
            $query .= " AND DATE(r.departure_datetime) = :date";
            $params[':date'] = $filters['date'];
        }

        // Filtre prix maximum
        if (!empty($filters['max_price'])) {
            $query .= " AND r.price_credits <= :max_price";
            $params[':max_price'] = (int)$filters['max_price'];
        }

        // Filtre écologique uniquement
        if (isset($filters['ecological_only']) && $filters['ecological_only']) {
            $query .= " AND r.is_ecological = 1";
        }

        $query .= " GROUP BY r.id";

        // Filtre note minimale (après le GROUP BY)
        if (!empty($filters['min_rating'])) {
            $query .= " HAVING driver_rating >= :min_rating";
            $params[':min_rating'] = (float)$filters['min_rating'];
        }

        $query .= " ORDER BY r.departure_datetime ASC";

        // Limite de résultats
        $limit = !empty($filters['limit']) ? (int)$filters['limit'] : 50;
        $query .= " LIMIT :limit";

        $stmt = $this->conn->prepare($query);

        // Bind des paramètres
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Obtenir un covoiturage par ID avec détails
     *
     * @param int $id
     * @return array|false
     */
    public function findById($id) {
        $query = "SELECT
                    r.*,
                    u.pseudo as driver_pseudo,
                    u.photo_url as driver_photo,
                    u.email as driver_email,
                    v.brand,
                    v.model,
                    v.color,
                    v.energy_type,
                    COALESCE(AVG(rp.rating), 0) as driver_rating,
                    COUNT(DISTINCT rp.id) as driver_reviews_count
                FROM " . $this->table . " r
                INNER JOIN users u ON u.id = r.driver_id
                INNER JOIN vehicles v ON v.id = r.vehicle_id
                LEFT JOIN reviews_pending rp ON rp.reviewed_user_id = r.driver_id AND rp.status = 'approved'
                WHERE r.id = :id
                GROUP BY r.id
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Obtenir les covoiturages d'un chauffeur
     *
     * @param int $driverId
     * @param string $status
     * @return array
     */
    public function getByDriver($driverId, $status = null) {
        $query = "SELECT r.*, v.brand, v.model, v.energy_type,
                         (SELECT COUNT(*) FROM bookings WHERE ride_id = r.id AND status != 'cancelled') as bookings_count
                  FROM " . $this->table . " r
                  INNER JOIN vehicles v ON v.id = r.vehicle_id
                  WHERE r.driver_id = :driver_id";

        $params = [':driver_id' => $driverId];

        if ($status !== null) {
            $query .= " AND r.status = :status";
            $params[':status'] = $status;
        }

        $query .= " ORDER BY r.departure_datetime DESC";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Mettre à jour le statut d'un covoiturage
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateStatus($id, $status) {
        $validStatuses = ['pending', 'active', 'in_progress', 'completed', 'cancelled'];

        if (!in_array($status, $validStatuses)) {
            return false;
        }

        $query = "UPDATE " . $this->table . "
                  SET status = :status
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    /**
     * Mettre à jour le nombre de places disponibles
     *
     * @param int $id
     * @param int $seats
     * @return bool
     */
    public function updateSeats($id, $seats) {
        $query = "UPDATE " . $this->table . "
                  SET seats_available = :seats
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':seats', $seats);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    /**
     * Annuler un covoiturage
     *
     * @param int $id
     * @return bool
     */
    public function cancel($id) {
        // Récupérer les réservations pour rembourser les passagers
        $bookingsQuery = "SELECT b.*, r.driver_id
                          FROM bookings b
                          INNER JOIN rides r ON r.id = b.ride_id
                          WHERE b.ride_id = :ride_id AND b.status = 'confirmed'";

        $stmt = $this->conn->prepare($bookingsQuery);
        $stmt->bindParam(':ride_id', $id);
        $stmt->execute();
        $bookings = $stmt->fetchAll();

        // Commencer une transaction
        $this->conn->beginTransaction();

        try {
            // Mettre à jour le statut du covoiturage
            if (!$this->updateStatus($id, 'cancelled')) {
                throw new Exception("Erreur lors de l'annulation du covoiturage");
            }

            // Rembourser les passagers et annuler les réservations
            foreach ($bookings as $booking) {
                // Annuler la réservation
                $cancelBookingQuery = "UPDATE bookings SET status = 'cancelled' WHERE id = :id";
                $stmt = $this->conn->prepare($cancelBookingQuery);
                $stmt->bindParam(':id', $booking['id']);

                if (!$stmt->execute()) {
                    throw new Exception("Erreur lors de l'annulation de la réservation");
                }

                // Rembourser les crédits au passager
                $refundQuery = "UPDATE users SET credits = credits + :amount WHERE id = :id";
                $stmt = $this->conn->prepare($refundQuery);
                $stmt->bindParam(':amount', $booking['price_paid']);
                $stmt->bindParam(':id', $booking['passenger_id']);

                if (!$stmt->execute()) {
                    throw new Exception("Erreur lors du remboursement");
                }

                // Enregistrer la transaction
                $transactionQuery = "INSERT INTO credit_transactions
                                     (user_id, amount, type, reference_type, reference_id, balance_after, description)
                                     SELECT :user_id, :amount, 'refund', 'booking', :booking_id,
                                            (SELECT credits FROM users WHERE id = :user_id),
                                            'Remboursement suite à l\\'annulation du trajet'";

                $stmt = $this->conn->prepare($transactionQuery);
                $stmt->bindParam(':user_id', $booking['passenger_id']);
                $stmt->bindParam(':amount', $booking['price_paid']);
                $stmt->bindParam(':booking_id', $booking['id']);

                if (!$stmt->execute()) {
                    throw new Exception("Erreur lors de l'enregistrement de la transaction");
                }
            }

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Erreur lors de l'annulation : " . $e->getMessage());
            return false;
        }
    }

    /**
     * Trouver le prochain trajet disponible
     *
     * @param string $departureCity
     * @param string $arrivalCity
     * @param string $afterDate
     * @return array|false
     */
    public function findNextAvailable($departureCity, $arrivalCity, $afterDate) {
        $query = "SELECT *
                  FROM " . $this->table . "
                  WHERE departure_city LIKE :departure_city
                    AND arrival_city LIKE :arrival_city
                    AND DATE(departure_datetime) > :after_date
                    AND status = 'pending'
                    AND seats_available > 0
                  ORDER BY departure_datetime ASC
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':departure_city', '%' . $departureCity . '%');
        $stmt->bindValue(':arrival_city', '%' . $arrivalCity . '%');
        $stmt->bindParam(':after_date', $afterDate);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Obtenir les statistiques des covoiturages
     *
     * @param int|null $driverId
     * @return array
     */
    public function getStatistics($driverId = null) {
        $query = "SELECT
                    COUNT(*) as total_rides,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
                    COUNT(CASE WHEN is_ecological = 1 THEN 1 END) as ecological_rides,
                    SUM(price_credits) as total_credits
                  FROM " . $this->table;

        if ($driverId !== null) {
            $query .= " WHERE driver_id = :driver_id";
        }

        $stmt = $this->conn->prepare($query);

        if ($driverId !== null) {
            $stmt->bindParam(':driver_id', $driverId);
        }

        $stmt->execute();

        return $stmt->fetch();
    }
}
