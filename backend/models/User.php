<?php
/**
 * EcoRide - Modèle User
 * Gestion des utilisateurs
 */

require_once __DIR__ . '/../config/Database.php';

class User {
    private $conn;
    private $table = 'users';

    // Propriétés
    public $id;
    public $pseudo;
    public $email;
    public $password_hash;
    public $role;
    public $user_type;
    public $credits;
    public $is_active;
    public $is_suspended;
    public $photo_url;
    public $created_at;
    public $updated_at;
    public $last_login;

    public function __construct() {
        $this->conn = Database::getConnection();
    }

    /**
     * Créer un nouvel utilisateur
     *
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  (pseudo, email, password_hash, role, user_type, credits, photo_url)
                  VALUES (:pseudo, :email, :password_hash, :role, :user_type, :credits, :photo_url)";

        $stmt = $this->conn->prepare($query);

        // Sécuriser les données
        $this->pseudo = htmlspecialchars(strip_tags($this->pseudo));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = $this->role ?? 'user';
        $this->user_type = $this->user_type ?? 'passenger';
        $this->credits = $this->credits ?? (int)getenv('INITIAL_CREDITS') ?: 20;

        // Hacher le mot de passe
        $pepper = getenv('PASSWORD_PEPPER') ?: '';
        $pwd_peppered = hash_hmac("sha256", $this->password_hash, $pepper);
        $this->password_hash = password_hash($pwd_peppered, PASSWORD_ARGON2ID);

        // Bind
        $stmt->bindParam(':pseudo', $this->pseudo);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password_hash', $this->password_hash);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':user_type', $this->user_type);
        $stmt->bindParam(':credits', $this->credits);
        $stmt->bindParam(':photo_url', $this->photo_url);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();

            // Enregistrer la transaction de crédits d'inscription
            $this->logCreditTransaction(
                $this->credits,
                'bonus',
                'registration',
                null,
                "Bonus d'inscription"
            );

            return true;
        }

        return false;
    }

    /**
     * Authentifier un utilisateur
     *
     * @param string $email
     * @param string $password
     * @return array|false
     */
    public function authenticate($email, $password) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE email = :email AND is_active = 1 AND is_suspended = 0
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch();

            // Vérifier le mot de passe
            $pepper = getenv('PASSWORD_PEPPER') ?: '';
            $pwd_peppered = hash_hmac("sha256", $password, $pepper);

            if (password_verify($pwd_peppered, $row['password_hash'])) {
                // Mettre à jour last_login
                $this->updateLastLogin($row['id']);

                // Retourner les données utilisateur (sans le hash du mot de passe)
                unset($row['password_hash']);
                return $row;
            }
        }

        return false;
    }

    /**
     * Trouver un utilisateur par ID
     *
     * @param int $id
     * @return array|false
     */
    public function findById($id) {
        $query = "SELECT id, pseudo, email, role, user_type, credits, is_active, is_suspended, photo_url, created_at
                  FROM " . $this->table . "
                  WHERE id = :id
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Trouver un utilisateur par email
     *
     * @param string $email
     * @return array|false
     */
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE email = :email
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Trouver un utilisateur par pseudo
     *
     * @param string $pseudo
     * @return array|false
     */
    public function findByPseudo($pseudo) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE pseudo = :pseudo
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pseudo', $pseudo);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Mettre à jour le dernier login
     *
     * @param int $userId
     * @return bool
     */
    private function updateLastLogin($userId) {
        $query = "UPDATE " . $this->table . "
                  SET last_login = NOW()
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);

        return $stmt->execute();
    }

    /**
     * Mettre à jour le type d'utilisateur
     *
     * @param int $userId
     * @param string $userType
     * @return bool
     */
    public function updateUserType($userId, $userType) {
        $query = "UPDATE " . $this->table . "
                  SET user_type = :user_type
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_type', $userType);
        $stmt->bindParam(':id', $userId);

        return $stmt->execute();
    }

    /**
     * Mettre à jour les crédits
     *
     * @param int $userId
     * @param int $amount
     * @param string $type (credit|debit)
     * @param string $referenceType
     * @param int|null $referenceId
     * @param string $description
     * @return bool
     */
    public function updateCredits($userId, $amount, $type, $referenceType, $referenceId, $description) {
        $query = "UPDATE " . $this->table . "
                  SET credits = credits + :amount
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':id', $userId);

        if ($stmt->execute()) {
            // Récupérer le nouveau solde
            $user = $this->findById($userId);
            $balanceAfter = $user['credits'];

            // Enregistrer la transaction
            return $this->logCreditTransaction(
                $userId,
                abs($amount),
                $type,
                $referenceType,
                $referenceId,
                $balanceAfter,
                $description
            );
        }

        return false;
    }

    /**
     * Enregistrer une transaction de crédits
     *
     * @param int $userId
     * @param int $amount
     * @param string $type
     * @param string $referenceType
     * @param int|null $referenceId
     * @param int $balanceAfter
     * @param string $description
     * @return bool
     */
    private function logCreditTransaction($userId, $amount, $type, $referenceType, $referenceId, $balanceAfter, $description) {
        $query = "INSERT INTO credit_transactions
                  (user_id, amount, type, reference_type, reference_id, balance_after, description)
                  VALUES (:user_id, :amount, :type, :reference_type, :reference_id, :balance_after, :description)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':reference_type', $referenceType);
        $stmt->bindParam(':reference_id', $referenceId);
        $stmt->bindParam(':balance_after', $balanceAfter);
        $stmt->bindParam(':description', $description);

        return $stmt->execute();
    }

    /**
     * Obtenir les statistiques d'un utilisateur
     *
     * @param int $userId
     * @return array|false
     */
    public function getStats($userId) {
        $query = "SELECT * FROM user_stats WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Suspendre un utilisateur
     *
     * @param int $userId
     * @return bool
     */
    public function suspend($userId) {
        $query = "UPDATE " . $this->table . "
                  SET is_suspended = 1
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);

        return $stmt->execute();
    }

    /**
     * Réactiver un utilisateur
     *
     * @param int $userId
     * @return bool
     */
    public function unsuspend($userId) {
        $query = "UPDATE " . $this->table . "
                  SET is_suspended = 0
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);

        return $stmt->execute();
    }

    /**
     * Vérifier la force du mot de passe
     *
     * @param string $password
     * @return array
     */
    public static function validatePassword($password) {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = "Le mot de passe doit contenir au moins 8 caractères";
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "Le mot de passe doit contenir au moins une majuscule";
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "Le mot de passe doit contenir au moins une minuscule";
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "Le mot de passe doit contenir au moins un chiffre";
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = "Le mot de passe doit contenir au moins un caractère spécial";
        }

        return [
            'valid' => count($errors) === 0,
            'errors' => $errors
        ];
    }

    /**
     * Valider l'email
     *
     * @param string $email
     * @return bool
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
