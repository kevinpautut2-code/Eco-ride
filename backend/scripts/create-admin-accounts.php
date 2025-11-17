<?php
/**
 * Script pour créer les comptes admin et employé
 * Usage: php backend/scripts/create-admin-accounts.php
 */

require_once __DIR__ . '/../config/Database.php';

try {
    $conn = Database::getConnection();

    echo "=== Création des comptes admin et employé ===\n\n";

    // Compte Admin
    $adminEmail = 'admin@ecoride.fr';
    $adminPassword = 'Admin123!';
    $adminPasswordHash = password_hash($adminPassword, PASSWORD_ARGON2ID);

    // Vérifier si admin existe déjà
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);

    if ($stmt->fetch()) {
        echo "✓ Compte admin existe déjà\n";
    } else {
        $stmt = $conn->prepare("
            INSERT INTO users (pseudo, username, email, password_hash, role, credits, created_at)
            VALUES ('Administrateur', 'admin', ?, ?, 'admin', 1000, NOW())
        ");
        $stmt->execute([$adminEmail, $adminPasswordHash]);
        echo "✓ Compte admin créé avec succès\n";
        echo "  Email: $adminEmail\n";
        echo "  Mot de passe: $adminPassword\n\n";
    }

    // Compte Employé
    $employeeEmail = 'employe@ecoride.fr';
    $employeePassword = 'Employe123!';
    $employeePasswordHash = password_hash($employeePassword, PASSWORD_ARGON2ID);

    // Vérifier si employé existe déjà
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$employeeEmail]);

    if ($stmt->fetch()) {
        echo "✓ Compte employé existe déjà\n";
    } else {
        $stmt = $conn->prepare("
            INSERT INTO users (pseudo, username, email, password_hash, role, credits, created_at)
            VALUES ('Employé Support', 'employe1', ?, ?, 'employee', 0, NOW())
        ");
        $stmt->execute([$employeeEmail, $employeePasswordHash]);
        echo "✓ Compte employé créé avec succès\n";
        echo "  Email: $employeeEmail\n";
        echo "  Mot de passe: $employeePassword\n\n";
    }

    echo "=== Comptes créés avec succès! ===\n\n";
    echo "Vous pouvez maintenant vous connecter avec:\n";
    echo "- Admin: admin@ecoride.fr / Admin123!\n";
    echo "- Employé: employe@ecoride.fr / Employe123!\n";

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
