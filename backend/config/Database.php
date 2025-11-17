<?php
/**
 * EcoRide - Gestionnaire de connexions aux bases de données
 * MySQL/MariaDB (relationnel) et MongoDB (NoSQL)
 */

class Database {
    // Configuration MySQL
    private static $mysql_host;
    private static $mysql_db;
    private static $mysql_user;
    private static $mysql_pass;
    private static $mysql_charset = 'utf8mb4';
    private static $mysql_connection = null;

    // Configuration MongoDB
    private static $mongo_uri;
    private static $mongo_db;
    private static $mongo_connection = null;
    private static $mongo_database = null;

    /**
     * Initialiser les configurations depuis les variables d'environnement
     */
    public static function init() {
        // Charger le fichier .env
        self::loadEnv();

        // Configuration MySQL
        self::$mysql_host = getenv('DB_HOST') ?: 'localhost';
        self::$mysql_db = getenv('DB_NAME') ?: 'ecoride';
        self::$mysql_user = getenv('DB_USER') ?: 'root';
        self::$mysql_pass = getenv('DB_PASS') ?: '';

        // Configuration MongoDB
        self::$mongo_uri = getenv('MONGO_URI') ?: 'mongodb://localhost:27017';
        self::$mongo_db = getenv('MONGO_DB') ?: 'ecoride';
    }

    /**
     * Charger les variables d'environnement depuis le fichier .env
     */
    private static function loadEnv() {
        $envFile = dirname(__DIR__, 2) . '/.env';

        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                // Ignorer les commentaires
                if (strpos(trim($line), '#') === 0) {
                    continue;
                }

                // Parser la ligne
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value);

                    // Retirer les guillemets
                    $value = trim($value, '"\'');

                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }

    /**
     * Obtenir la connexion MySQL via PDO
     *
     * @return PDO
     * @throws PDOException
     */
    public static function getConnection() {
        if (self::$mysql_connection === null) {
            self::init();

            try {
                $dsn = "mysql:host=" . self::$mysql_host . ";dbname=" . self::$mysql_db . ";charset=" . self::$mysql_charset;

                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ];

                self::$mysql_connection = new PDO($dsn, self::$mysql_user, self::$mysql_pass, $options);
            } catch (PDOException $e) {
                error_log("Erreur de connexion MySQL: " . $e->getMessage());
                throw new PDOException("Erreur de connexion à la base de données: " . $e->getMessage());
            }
        }

        return self::$mysql_connection;
    }

    /**
     * Obtenir la connexion MongoDB
     *
     * @return MongoDB\Database
     * @throws Exception
     */
    public static function getMongoConnection() {
        if (self::$mongo_database === null) {
            self::init();

            try {
                // Vérifier si l'extension MongoDB est installée
                if (!class_exists('MongoDB\Driver\Manager')) {
                    throw new Exception("L'extension MongoDB n'est pas installée");
                }

                // Créer la connexion
                self::$mongo_connection = new MongoDB\Driver\Manager(self::$mongo_uri);

                // Créer le client et obtenir la base de données
                $client = new MongoDB\Client(self::$mongo_uri);
                self::$mongo_database = $client->selectDatabase(self::$mongo_db);

            } catch (Exception $e) {
                error_log("Erreur de connexion MongoDB: " . $e->getMessage());
                throw new Exception("Erreur de connexion à MongoDB: " . $e->getMessage());
            }
        }

        return self::$mongo_database;
    }

    /**
     * Obtenir une collection MongoDB
     *
     * @param string $collectionName
     * @return MongoDB\Collection
     */
    public static function getCollection($collectionName) {
        $db = self::getMongoConnection();
        return $db->selectCollection($collectionName);
    }

    /**
     * Fermer les connexions
     */
    public static function closeConnections() {
        self::$mysql_connection = null;
        self::$mongo_connection = null;
        self::$mongo_database = null;
    }

    /**
     * Tester les connexions aux bases de données
     *
     * @return array
     */
    public static function testConnections() {
        $results = [
            'mysql' => ['status' => false, 'message' => ''],
            'mongodb' => ['status' => false, 'message' => '']
        ];

        // Test MySQL
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query("SELECT 1");
            if ($stmt !== false) {
                $results['mysql']['status'] = true;
                $results['mysql']['message'] = 'Connexion MySQL réussie';
            }
        } catch (Exception $e) {
            $results['mysql']['message'] = 'Erreur MySQL: ' . $e->getMessage();
        }

        // Test MongoDB
        try {
            $mongo = self::getMongoConnection();
            $collections = $mongo->listCollections();
            $results['mongodb']['status'] = true;
            $results['mongodb']['message'] = 'Connexion MongoDB réussie';
        } catch (Exception $e) {
            $results['mongodb']['message'] = 'Erreur MongoDB: ' . $e->getMessage();
        }

        return $results;
    }

    /**
     * Exécuter une transaction MySQL
     *
     * @param callable $callback
     * @return mixed
     * @throws Exception
     */
    public static function transaction($callback) {
        $pdo = self::getConnection();

        try {
            $pdo->beginTransaction();
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}

// Initialiser automatiquement lors de l'inclusion
Database::init();
