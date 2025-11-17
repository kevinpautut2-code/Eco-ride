# 📚 Documentation API EcoRide

## Base URL

```
http://localhost:8000
```

En production: `https://api.ecoride.fr`

## Authentification

L'API utilise un système de tokens simple. Après connexion, incluez le token dans vos requêtes:

```http
Authorization: Bearer {token}
```

---

## 🔐 Auth Endpoints

### POST /auth/register

Créer un nouveau compte utilisateur.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "pseudo": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "user_type": "both"  // "driver", "passenger", "both"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": {
    "id": 1,
    "pseudo": "john_doe",
    "email": "john@example.com",
    "credits": 20,
    "role": "user",
    "user_type": "both",
    "created_at": "2025-01-15 10:30:00"
  }
}
```

### POST /auth/login

Se connecter à un compte.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "base64encodedtoken",
  "user": {
    "id": 1,
    "pseudo": "john_doe",
    "email": "john@example.com",
    "credits": 45,
    "role": "user"
  }
}
```

---

## 🚗 Rides Endpoints

### GET /rides

Rechercher des trajets avec filtres.

**Query Parameters:**
- `departure_city` (string): Ville de départ
- `arrival_city` (string): Ville d'arrivée
- `date` (YYYY-MM-DD): Date du trajet
- `max_price` (int): Prix maximum en crédits
- `ecological_only` (bool): Véhicules électriques uniquement
- `min_rating` (float): Note minimum du conducteur

**Request:**
```http
GET /rides?departure_city=Paris&arrival_city=Lyon&date=2025-01-20&max_price=50&ecological_only=true&min_rating=4.0
```

**Response 200:**
```json
{
  "success": true,
  "count": 15,
  "rides": [
    {
      "id": 1,
      "departure_city": "Paris",
      "departure_address": "1 Place de la République, 75003",
      "arrival_city": "Lyon",
      "arrival_address": "15 Rue de la République, 69001",
      "departure_datetime": "2025-01-20 09:00:00",
      "arrival_datetime": "2025-01-20 13:45:00",
      "price_credits": 45,
      "seats_available": 2,
      "total_seats": 3,
      "status": "available",
      "is_ecological": true,
      "driver_id": 5,
      "driver_pseudo": "alice_driver",
      "driver_photo": "https://...",
      "driver_rating": "4.8",
      "driver_total_rides": 47,
      "brand": "Tesla",
      "model": "Model 3",
      "color": "Blanc",
      "energy_type": "electric",
      "duration_hours": 4
    }
  ]
}
```

### GET /rides/{id}

Détails d'un trajet spécifique.

**Response 200:**
```json
{
  "success": true,
  "ride": {
    "id": 1,
    // ... (tous les champs du trajet)
    "reviews": [
      {
        "id": 12,
        "reviewer_pseudo": "marie_p",
        "rating": 5,
        "comment": "Excellent conducteur !",
        "created_at": "2025-01-10 15:30:00"
      }
    ]
  }
}
```

### POST /rides

Créer un nouveau trajet.

**Request:**
```http
POST /rides
Content-Type: application/json

{
  "driver_id": 1,
  "vehicle_id": 2,
  "departure_city": "Paris",
  "departure_address": "1 Place de la République, 75003 Paris",
  "arrival_city": "Lyon",
  "arrival_address": "15 Rue de la République, 69001 Lyon",
  "departure_datetime": "2025-01-20 09:00:00",
  "arrival_datetime": "2025-01-20 13:45:00",
  "seats_available": 3,
  "price_credits": 45
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Trajet créé avec succès",
  "ride": {
    "id": 25,
    "status": "available",
    // ...
  }
}
```

### POST /rides/{id}/book

Réserver une place sur un trajet.

**Request:**
```http
POST /rides/1/book
Content-Type: application/json

{
  "user_id": 3
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Réservation confirmée",
  "new_credits": 155
}
```

### POST /rides/{id}/start

Démarrer un trajet (conducteur uniquement).

**Response 200:**
```json
{
  "success": true,
  "message": "Trajet démarré avec succès",
  "actual_start_datetime": "2025-01-20 09:05:00"
}
```

### POST /rides/{id}/complete

Terminer un trajet et créditer le conducteur.

**Response 200:**
```json
{
  "success": true,
  "message": "Trajet terminé avec succès",
  "credits_earned": 129,
  "new_credits": 284,
  "passenger_count": 3
}
```

### DELETE /rides/{id}

Annuler un trajet (conducteur). Rembourse automatiquement tous les passagers.

**Response 200:**
```json
{
  "success": true,
  "message": "Trajet annulé avec succès",
  "passengers_refunded": 2
}
```

### GET /rides/{id}/bookings

Liste des passagers d'un trajet.

**Response 200:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 45,
      "passenger_id": 12,
      "passenger_pseudo": "marie_d",
      "passenger_photo": "https://...",
      "credits_amount": 45,
      "status": "confirmed",
      "created_at": "2025-01-15 14:20:00"
    }
  ]
}
```

---

## 👤 Users Endpoints

### GET /users/{id}

Profil public d'un utilisateur.

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "pseudo": "john_doe",
    "photo_url": "https://...",
    "role": "user",
    "created_at": "2024-06-15 10:30:00"
    // password_hash non inclus
  }
}
```

### GET /users/{id}/rides

Trajets créés par un utilisateur (historique conducteur).

**Response 200:**
```json
{
  "success": true,
  "rides": [
    {
      "id": 10,
      "departure_city": "Paris",
      "arrival_city": "Lyon",
      "departure_datetime": "2025-01-20 09:00:00",
      "status": "completed",
      "passengers_count": 2,
      "total_seats": 3,
      "price_credits": 45,
      // ...
    }
  ]
}
```

### GET /users/{id}/bookings

Réservations d'un utilisateur (historique passager).

**Response 200:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 5,
      "ride_id": 8,
      "departure_city": "Marseille",
      "arrival_city": "Nice",
      "driver_pseudo": "sophie_m",
      "status": "confirmed",
      "credits_amount": 35,
      // ...
    }
  ]
}
```

---

## 📝 Bookings Endpoints

### DELETE /bookings/{id}

Annuler une réservation (passager). Rembourse automatiquement.

**Response 200:**
```json
{
  "success": true,
  "message": "Réservation annulée avec succès",
  "new_credits": 235
}
```

---

## 🚙 Vehicles Endpoints

### GET /vehicles

Liste des véhicules (optionnel: filtré par utilisateur).

**Query Parameters:**
- `user_id` (int): Filtrer par propriétaire

**Response 200:**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": 1,
      "driver_id": 5,
      "brand": "Tesla",
      "model": "Model 3",
      "color": "Blanc",
      "energy_type": "electric",
      "seats": 4,
      "first_registration_date": "2022-03-15"
    }
  ]
}
```

---

## ⚠️ Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Bad Request - Paramètres invalides |
| 401  | Unauthorized - Authentification requise |
| 403  | Forbidden - Accès refusé |
| 404  | Not Found - Ressource non trouvée |
| 500  | Internal Server Error - Erreur serveur |

**Format erreur:**
```json
{
  "error": "Message d'erreur détaillé"
}
```

---

## 💡 Exemples curl

```bash
# Inscription
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"test","email":"test@test.com","password":"Test123"}'

# Connexion
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# Recherche trajets
curl "http://localhost:8000/rides?departure_city=Paris&arrival_city=Lyon&date=2025-01-20"

# Réserver un trajet
curl -X POST http://localhost:8000/rides/1/book \
  -H "Content-Type: application/json" \
  -d '{"user_id":3}'
```

---

## 🔄 Rate Limiting

Limite: 100 requêtes/minute par IP

**Headers de réponse:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642683600
```

---

## 📊 Codes de statut des trajets

| Statut | Description |
|--------|-------------|
| `pending` | En attente de validation |
| `available` | Disponible pour réservation |
| `in_progress` | Trajet en cours |
| `completed` | Trajet terminé |
| `cancelled` | Trajet annulé |

---

Dernière mise à jour: 2025-01-15
