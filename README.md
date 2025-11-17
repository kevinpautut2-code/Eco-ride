# 🌱 EcoRide - Plateforme de Covoiturage Écologique

[![PHP](https://img.shields.io/badge/PHP-8.4.14-777BB4?style=flat&logo=php)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-9.5.0-4479A1?style=flat&logo=mysql)](https://mysql.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0.21-47A248?style=flat&logo=mongodb)](https://mongodb.com)

EcoRide est une plateforme de covoiturage moderne axée sur l'écologie, développée avec PHP, MySQL et MongoDB.

## ✨ Fonctionnalités

- ✅ Inscription/Connexion sécurisée (Argon2id)
- ✅ Système de crédits (20 offerts)
- ✅ Recherche trajets avec filtres
- ✅ Réservation et paiement par crédits
- ✅ Création trajets avec calcul gains
- ✅ Historique complet avec annulation
- ✅ Gestion trajets actifs (start/stop)
- ✅ Système avis et notes
- ✅ Dashboards admin/employé
- ✅ Thème clair/sombre

## 🔧 Installation rapide

```bash
# 1. Cloner
git clone https://github.com/ecoride/ecoride.git
cd ecoride

# 2. Base de données MySQL
mysql -u root -p -e "CREATE DATABASE ecoride"
mysql -u root -p ecoride < database/schema.sql

# 3. Dépendances
cd backend && composer install

# 4. Configuration
cp backend/config/Database.example.php backend/config/Database.php
# Éditer Database.php avec vos paramètres

# 5. Lancer serveurs
# Terminal 1
cd backend/api && php -S localhost:8000 router.php
# Terminal 2  
cd frontend && python3 -m http.server 8080
```

Accès: http://localhost:8080

## 📚 Documentation complète

- Installation: [docs/INSTALLATION.md](docs/INSTALLATION.md)
- API: [docs/API.md](docs/API.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Guide utilisateur: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

## 🏗️ Architecture

```
├── frontend/          # HTML, CSS, JS
├── backend/           # PHP API REST
│   ├── api/
│   ├── config/
│   └── tests/
├── database/          # SQL, migrations
└── docs/              # Documentation
```

### Stack technique
- **Backend**: PHP 8.4, MySQL 9.5, MongoDB 6.0
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Sécurité**: Argon2id, CORS, Transactions SQL

## 🔌 API Endpoints

```bash
POST   /auth/register         # Inscription
POST   /auth/login            # Connexion
GET    /rides                 # Recherche trajets
POST   /rides                 # Créer trajet
POST   /rides/{id}/book       # Réserver
POST   /rides/{id}/start      # Démarrer trajet
POST   /rides/{id}/complete   # Terminer trajet
DELETE /rides/{id}            # Annuler trajet
GET    /users/{id}/rides      # Historique conducteur
GET    /users/{id}/bookings   # Historique passager
```

Documentation complète: [docs/API.md](docs/API.md)

## 🧪 Tests

```bash
cd backend
composer test
```

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE)

## 📞 Contact

Email: contact@ecoride.fr

---

Développé avec 💚 pour un monde plus écologique
