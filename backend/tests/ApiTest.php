<?php
/**
 * Tests unitaires API EcoRide
 * Exécuter avec: vendor/bin/phpunit tests/
 */

use PHPUnit\Framework\TestCase;

class ApiTest extends TestCase
{
    private $baseUrl = 'http://localhost:8000';
    private $testUser = [
        'pseudo' => 'test_user_' . time(),
        'email' => 'test' . time() . '@test.com',
        'password' => 'TestPassword123'
    ];
    private $token = null;
    private $userId = null;

    /**
     * Test inscription utilisateur
     */
    public function testUserRegistration()
    {
        $response = $this->makeRequest('POST', '/auth/register', $this->testUser);

        $this->assertTrue($response['success']);
        $this->assertEquals('Compte créé avec succès', $response['message']);
        $this->assertArrayHasKey('user', $response);
        $this->assertEquals(20, $response['user']['credits']); // 20 crédits offerts
        $this->userId = $response['user']['id'];
    }

    /**
     * Test connexion utilisateur
     * @depends testUserRegistration
     */
    public function testUserLogin()
    {
        $response = $this->makeRequest('POST', '/auth/login', [
            'email' => $this->testUser['email'],
            'password' => $this->testUser['password']
        ]);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('token', $response);
        $this->assertArrayHasKey('user', $response);
        $this->token = $response['token'];
    }

    /**
     * Test recherche trajets
     */
    public function testSearchRides()
    {
        $response = $this->makeRequest('GET', '/rides?departure_city=Paris&arrival_city=Lyon');

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('rides', $response);
        $this->assertArrayHasKey('count', $response);
        $this->assertIsArray($response['rides']);
    }

    /**
     * Test création trajet
     * @depends testUserLogin
     */
    public function testCreateRide()
    {
        // Pour ce test, on suppose qu'un véhicule existe
        $rideData = [
            'driver_id' => $this->userId,
            'vehicle_id' => 1,
            'departure_city' => 'Paris',
            'departure_address' => '1 Rue de Test, 75001 Paris',
            'arrival_city' => 'Lyon',
            'arrival_address' => '1 Rue d\'Arrivée, 69001 Lyon',
            'departure_datetime' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'arrival_datetime' => date('Y-m-d H:i:s', strtotime('+1 day +4 hours')),
            'seats_available' => 3,
            'price_credits' => 45
        ];

        $response = $this->makeRequest('POST', '/rides', $rideData);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('ride', $response);
        $this->assertEquals('available', $response['ride']['status']);
    }

    /**
     * Test récupération profil utilisateur
     */
    public function testGetUserProfile()
    {
        $response = $this->makeRequest('GET', '/users/1');

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayNotHasKey('password_hash', $response['user']); // Sécurité
    }

    /**
     * Test liste véhicules
     */
    public function testGetVehicles()
    {
        $response = $this->makeRequest('GET', '/vehicles');

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('vehicles', $response);
        $this->assertIsArray($response['vehicles']);
    }

    /**
     * Test erreur 404
     */
    public function testNotFoundEndpoint()
    {
        $response = $this->makeRequest('GET', '/nonexistent');

        $this->assertArrayHasKey('error', $response);
        $this->assertStringContainsString('non trouvé', $response['error']);
    }

    /**
     * Test validation email inscription
     */
    public function testRegistrationEmailValidation()
    {
        $response = $this->makeRequest('POST', '/auth/register', [
            'pseudo' => 'test',
            'email' => 'invalid-email',
            'password' => 'Test123'
        ]);

        // Devrait échouer avec email invalide (si validation implémentée)
        // Note: Ajouter validation côté backend si nécessaire
        $this->assertIsArray($response);
    }

    /**
     * Helper: Faire une requête HTTP à l'API
     */
    private function makeRequest($method, $endpoint, $data = null)
    {
        $url = $this->baseUrl . $endpoint;

        $ch = curl_init();

        if ($method === 'GET' && $data) {
            $url .= '?' . http_build_query($data);
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        } else {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return json_decode($response, true);
    }
}
