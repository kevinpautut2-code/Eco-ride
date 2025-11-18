<?php
/**
 * Test de l'API de login
 */

// Simuler une requête POST à /auth/login
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/auth/login';

// Données de test
$testData = [
    'email' => 'employe@ecoride.fr',
    'password' => 'Employe123!'
];

// Simuler php://input
$GLOBALS['_test_input'] = json_encode($testData);

// Redéfinir file_get_contents pour php://input
function file_get_contents_test($filename) {
    if ($filename === 'php://input') {
        return $GLOBALS['_test_input'];
    }
    return file_get_contents($filename);
}

echo "=== Test de connexion ===\n";
echo "Email: " . $testData['email'] . "\n";
echo "Password: " . $testData['password'] . "\n\n";

// Inclure l'API
require_once __DIR__ . '/../config/Database.php';

$conn = Database::getConnection();

// Simulation du code de login
$email = $testData['email'];
$password = $testData['password'];

echo "1. Recherche de l'utilisateur dans la DB...\n";
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo "✗ Utilisateur non trouvé\n";
    exit(1);
}

echo "✓ Utilisateur trouvé:\n";
echo "  - ID: " . $user['id'] . "\n";
echo "  - Email: " . $user['email'] . "\n";
echo "  - Role: " . $user['role'] . "\n";
echo "  - Hash: " . substr($user['password_hash'], 0, 50) . "...\n\n";

echo "2. Vérification du mot de passe...\n";
$verify = password_verify($password, $user['password_hash']);

if ($verify) {
    echo "✓ Mot de passe correct!\n\n";
    echo "3. Génération du token...\n";
    $token = base64_encode($email . ':' . time());
    echo "✓ Token: " . $token . "\n\n";

    unset($user['password_hash']);
    echo "✓ Connexion réussie!\n";
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => $user
    ], JSON_PRETTY_PRINT) . "\n";
} else {
    echo "✗ Mot de passe incorrect\n";
    exit(1);
}
