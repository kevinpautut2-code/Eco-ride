# 🚀 EcoRide - Guide de développement

## 📋 Ce qui a été créé

J'ai développé une **base solide et professionnelle** pour votre plateforme EcoRide avec :

### ✅ Fondations complètes

1. **Design System professionnel** (Dark/Light mode)
2. **Page d'accueil moderne** avec recherche
3. **Page de listing des covoiturages** avec filtres avancés
4. **Bases de données** MySQL + MongoDB configurées
5. **Backend PHP** avec modèles et API REST
6. **Architecture MVC** propre et extensible

### 📁 Structure du projet

```
ecoride/
├── frontend/              # Interface utilisateur
│   ├── css/
│   │   ├── design-system.css    # ⭐ Variables, thèmes, composants de base
│   │   ├── layout.css           # Navigation, footer, hero
│   │   └── components.css       # Cartes, filtres, modals, etc.
│   ├── js/
│   │   ├── theme.js             # Gestion dark/light mode
│   │   ├── navigation.js        # Menu responsive
│   │   ├── search.js            # Autocomplétion villes
│   │   └── rides.js             # Liste et filtres des trajets
│   ├── index.html               # Page d'accueil ✅
│   └── rides.html               # Liste des covoiturages ✅
│
├── backend/               # Logique serveur
│   ├── config/
│   │   └── Database.php         # Connexions MySQL + MongoDB
│   ├── models/
│   │   ├── User.php             # Gestion utilisateurs
│   │   └── Ride.php             # Gestion covoiturages
│   └── controllers/
│       └── RidesController.php  # API REST
│
├── database/              # Schémas et données
│   ├── sql/
│   │   ├── create_database.sql  # Création tables MySQL
│   │   └── seed_data.sql        # Données de test
│   └── mongodb/
│       ├── preferences.json      # Préférences utilisateurs
│       └── reviews.json          # Avis détaillés
│
├── docs/                  # Documentation (à compléter)
├── tests/                 # Tests (à développer)
├── .env.example           # Variables d'environnement
├── .gitignore
├── composer.json          # Dépendances PHP
└── README.md             # Instructions d'installation
```

---

## 🎯 Pour continuer le développement

### Étape 1 : Installation de l'environnement

#### 1.1 Prérequis
```bash
# Installer PHP >= 8.0
# Installer MySQL/MariaDB
# Installer MongoDB
# Installer Composer
```

#### 1.2 Configuration
```bash
cd ecoride

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos informations
nano .env

# Installer les dépendances PHP
composer install
```

#### 1.3 Bases de données
```bash
# MySQL
mysql -u root -p < database/sql/create_database.sql
mysql -u root -p ecoride < database/sql/seed_data.sql

# MongoDB
mongoimport --db ecoride --collection preferences --file database/mongodb/preferences.json --jsonArray
mongoimport --db ecoride --collection reviews --file database/mongodb/reviews.json --jsonArray
```

#### 1.4 Serveur local
```bash
# Option 1 : PHP built-in server
php -S localhost:8000 -t frontend/

# Option 2 : XAMPP/MAMP/Laragon
# Configurer un virtual host pointant vers frontend/

# Accéder à l'application
# http://localhost:8000
```

---

## 🔨 Prochaines fonctionnalités à développer

### Priorité HAUTE (MVP)

#### 1. Système d'authentification (US7)

**Fichiers à créer :**
- `frontend/login.html`
- `frontend/register.html`
- `frontend/js/auth.js`
- `backend/controllers/AuthController.php`
- `backend/utils/JWT.php`

**Fonctionnalités :**
```javascript
// auth.js
- Formulaire de connexion avec validation
- Formulaire d'inscription avec validation mot de passe fort
- Stockage JWT dans localStorage
- Middleware pour vérifier l'authentification
- Redirection si non authentifié
- Bouton de déconnexion
```

```php
// AuthController.php
- POST /auth/register : Inscription
- POST /auth/login : Connexion avec génération JWT
- POST /auth/logout : Déconnexion
- GET /auth/me : Récupérer utilisateur connecté
- POST /auth/refresh : Rafraîchir le token
```

**Exemple d'implémentation :**
```php
// AuthController.php
public function login() {
    $input = json_decode(file_get_contents('php://input'), true);

    $user = new User();
    $authenticated = $user->authenticate($input['email'], $input['password']);

    if ($authenticated) {
        $token = $this->generateJWT($authenticated);
        return ['token' => $token, 'user' => $authenticated];
    }

    return ['error' => 'Identifiants invalides'];
}
```

#### 2. Page détaillée d'un covoiturage (US5)

**Fichiers à créer :**
- `frontend/ride-details.html`
- `frontend/js/ride-details.js`
- `frontend/css/ride-details.css` (optionnel, peut utiliser components.css)

**Éléments à afficher :**
- Toutes les infos du trajet
- Photo et bio du chauffeur
- Note et avis du chauffeur
- Véhicule (marque, modèle, couleur, énergie)
- Préférences du conducteur (depuis MongoDB)
- Carte du trajet (Google Maps/Mapbox)
- Bouton "Participer"

**Récupération des données :**
```javascript
// ride-details.js
async function loadRideDetails(rideId) {
    const response = await fetch(`/backend/controllers/RidesController.php/${rideId}`);
    const data = await response.json();

    displayRideInfo(data.data);
    displayDriverInfo(data.data);
    displayPreferences(data.data.driver_preferences);
    displayReviews(data.data.reviews);
}
```

#### 3. Participation à un covoiturage (US6)

**Fonctionnalités à ajouter dans `ride-details.js` :**
```javascript
async function participateToRide(rideId) {
    // 1. Vérifier authentification
    if (!isAuthenticated()) {
        showModal('Veuillez vous connecter');
        redirectToLogin();
        return;
    }

    // 2. Vérifier crédits
    const user = getCurrentUser();
    if (user.credits < ride.price_credits) {
        showModal('Crédits insuffisants');
        return;
    }

    // 3. Confirmer avec modal
    const confirmed = await showConfirmModal(
        `Confirmer la réservation de ${ride.seats_booked} place(s) pour ${ride.price_credits} crédits ?`
    );

    if (confirmed) {
        // 4. Créer la réservation
        const response = await fetch('/backend/controllers/BookingsController.php', {
            method: 'POST',
            body: JSON.stringify({
                ride_id: rideId,
                seats_booked: 1
            })
        });

        if (response.ok) {
            showNotification('Réservation confirmée !', 'success');
            updateUserCredits();
        }
    }
}
```

**Backend à créer :**
- `backend/controllers/BookingsController.php`
- `backend/models/Booking.php`

#### 4. Espace utilisateur (US8)

**Fichiers à créer :**
- `frontend/dashboard.html` (tableau de bord principal)
- `frontend/profile.html` (profil et préférences)
- `frontend/vehicles.html` (gestion véhicules)
- `frontend/js/dashboard.js`

**Sections du dashboard :**
- Solde de crédits
- Prochains trajets (en tant que chauffeur)
- Prochaines réservations (en tant que passager)
- Statistiques personnelles
- Liens rapides (créer trajet, rechercher, historique)

---

### Priorité MOYENNE

#### 5. Création de trajet (US9)

**Structure :**
```html
<!-- frontend/create-ride.html -->
<form id="createRideForm">
    <select name="vehicle_id" required>
        <!-- Liste des véhicules de l'utilisateur -->
    </select>

    <input type="text" name="departure_city" required>
    <input type="text" name="arrival_city" required>

    <input type="datetime-local" name="departure_datetime" required>
    <input type="datetime-local" name="arrival_datetime" required>

    <input type="number" name="seats_available" min="1" max="8" required>
    <input type="number" name="price_credits" min="5" required>

    <p>Prix total pour passager : <strong id="totalPrice">0</strong> crédits</p>
    <p>Vous recevrez : <strong id="driverEarnings">0</strong> crédits</p>
    <p>Frais plateforme : <strong>2</strong> crédits</p>

    <button type="submit">Publier le trajet</button>
</form>
```

#### 6. Historique (US10)

**Structure :**
```javascript
// dashboard.js ou history.js
async function loadHistory() {
    // Trajets en tant que chauffeur
    const myRides = await fetch(`/api/rides?driver_id=${userId}`);

    // Trajets en tant que passager
    const myBookings = await fetch(`/api/bookings?passenger_id=${userId}`);

    displayRidesHistory(myRides);
    displayBookingsHistory(myBookings);
}

function displayRideCard(ride) {
    // Status badges : pending, in_progress, completed, cancelled
    // Boutons actions selon statut :
    // - pending : Annuler, Modifier
    // - in_progress : Arrivée à destination
    // - completed : Voir les avis
}
```

#### 7. Gestion trajet temps réel (US11)

**Interface chauffeur :**
```javascript
// Bouton "Démarrer le trajet"
async function startRide(rideId) {
    await updateRideStatus(rideId, 'in_progress');
    notifyPassengers(rideId, 'Le chauffeur a démarré le trajet');
}

// Bouton "Arrivée à destination"
async function completeRide(rideId) {
    await updateRideStatus(rideId, 'completed');

    // Envoyer email aux passagers
    await sendEmailToPassengers(rideId, {
        subject: 'Trajet terminé - Merci de laisser un avis',
        template: 'ride_completed'
    });

    // Notifier pour validation
    notifyPassengersToValidate(rideId);
}
```

---

### Priorité BASSE

#### 8. Espace employé (US12)
- Modération des avis
- Gestion des litiges

#### 9. Espace admin (US13)
- Statistiques avec Chart.js
- Création employés
- Suspension utilisateurs

---

## 🎨 Guidelines de design

### Couleurs à utiliser

```css
/* Vert principal */
--primary-green: #00C853;          /* Actions principales */
--primary-green-light: #69F0AE;    /* Hover */
--primary-green-dark: #00A844;     /* Active */

/* Badges écologiques */
--eco-badge: #00E676;

/* États */
--success: #00C853;                /* Succès */
--warning: #FFB300;                /* Attention */
--error: #D32F2F;                  /* Erreur */
--info: #0288D1;                   /* Information */
```

### Composants existants

Tous ces composants sont déjà stylisés dans `components.css` :

```html
<!-- Boutons -->
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-outline">Outline</button>

<!-- Badges -->
<span class="badge badge-eco">⚡ Électrique</span>
<span class="badge badge-success">Succès</span>

<!-- Cartes -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Titre</h3>
    </div>
    <div class="card-body">Contenu</div>
    <div class="card-footer">Footer</div>
</div>

<!-- Alerts -->
<div class="alert alert-success">
    <div class="alert-icon">✓</div>
    <div class="alert-content">
        <div class="alert-title">Succès</div>
        <div class="alert-text">Message</div>
    </div>
</div>

<!-- Modal -->
<div class="modal-backdrop show">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Titre</h3>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">Contenu</div>
        <div class="modal-footer">
            <button class="btn btn-secondary">Annuler</button>
            <button class="btn btn-primary">Confirmer</button>
        </div>
    </div>
</div>
```

---

## 🔒 Sécurité

### Checklist sécurité à respecter

✅ **Déjà implémenté :**
- Hash Argon2ID + pepper pour mots de passe
- Prepared statements (PDO)
- Validation email
- Politique mot de passe fort

⚠️ **À ajouter :**
- [ ] Vérification JWT sur toutes les routes protégées
- [ ] CSRF tokens sur les formulaires
- [ ] Rate limiting sur l'API
- [ ] Sanitization XSS sur tous les inputs
- [ ] Validation côté serveur (jamais seulement côté client)
- [ ] HTTPS en production
- [ ] Headers de sécurité (CSP, X-Frame-Options, etc.)

### Exemple middleware JWT

```php
// backend/middleware/AuthMiddleware.php
class AuthMiddleware {
    public static function verifyToken() {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Token manquant']);
            exit;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);

        try {
            $decoded = JWT::decode($token, getenv('JWT_SECRET'));
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token invalide']);
            exit;
        }
    }
}
```

---

## 📊 Documentation à créer

### 1. Maquettes (Wireframes & Mockups)

**Outils recommandés :**
- Figma (gratuit) : https://figma.com
- Adobe XD (gratuit)
- Sketch (Mac uniquement)

**Pages à maquetter :**
- ✅ Accueil (déjà fait en code, faire la maquette)
- ✅ Liste covoiturages (déjà fait en code)
- ⏳ Détails covoiturage
- ⏳ Dashboard utilisateur
- ⏳ Connexion/Inscription
- ⏳ Création trajet

**Versions :**
- 3 maquettes desktop (1920x1080)
- 3 maquettes mobile (375x812)

### 2. Charte graphique PDF

**Contenu :**
```
📄 Charte Graphique EcoRide

1. Identité visuelle
   - Logo (versions : couleur, noir, blanc)
   - Slogan : "Voyagez Écologique, Voyagez Économique"

2. Palette de couleurs
   [Carrés de couleurs avec codes HEX]
   - Vert principal : #00C853
   - Vert clair : #69F0AE
   - Vert foncé : #00A844
   - etc.

3. Typographie
   - Titres : Poppins Bold
   - Texte : Inter Regular/Medium

4. Composants
   - Boutons
   - Cartes
   - Badges
   [Screenshots]

5. Maquettes
   [Export des 6 maquettes]
```

### 3. Documentation technique PDF

```markdown
# Documentation Technique - EcoRide

## 1. Architecture
- Stack technique
- Schéma d'architecture
- Flow de données

## 2. Base de données
- MCD (Modèle Conceptuel de Données)
- MPD (Modèle Physique de Données)
- Dictionnaire des données

## 3. API REST
- Liste des endpoints
- Exemples de requêtes/réponses
- Codes d'erreur

## 4. Diagrammes UML
- Diagramme de cas d'utilisation
- Diagrammes de séquence (pour chaque US)
- Diagramme de classes

## 5. Déploiement
- Prérequis serveur
- Étapes d'installation
- Configuration Nginx/Apache
- Configuration SSL
- Sauvegarde et maintenance
```

### 4. Manuel d'utilisation PDF

```markdown
# Manuel Utilisateur - EcoRide

## 1. Introduction
- Présentation de la plateforme
- Concepts clés (crédits, notation, etc.)

## 2. Inscription et profil
[Screenshots avec annotations]

## 3. Rechercher un trajet
[Screenshots étape par étape]

## 4. Réserver un trajet
[Screenshots avec explications]

## 5. Proposer un trajet
[Guide complet chauffeur]

## 6. Gérer ses réservations
[Vue passager et chauffeur]

## 7. Système d'avis
[Comment noter, modération]

## 8. FAQ
- Questions fréquentes
- Résolution problèmes courants

Identifiants de test :
- Admin : admin@ecoride.fr / Test@2025!
- Employé : employe@ecoride.fr / Test@2025!
- Chauffeur : chauffeur@ecoride.fr / Test@2025!
- Passager : passager@ecoride.fr / Test@2025!
```

---

## 🚀 Déploiement

### Option 1 : Hébergement traditionnel (OVH, O2Switch, etc.)

```bash
# 1. Transférer les fichiers via FTP
# 2. Importer la base de données MySQL
# 3. Configurer MongoDB (ou utiliser MongoDB Atlas)
# 4. Configurer le .env
# 5. Configurer Apache/Nginx
```

### Option 2 : Heroku (gratuit pour débuter)

```bash
# 1. Créer compte Heroku
# 2. Installer Heroku CLI
heroku login
heroku create ecoride-app

# 3. Ajouter add-ons
heroku addons:create jawsdb:kitefin  # MySQL
heroku addons:create mongolab:sandbox  # MongoDB

# 4. Configurer variables d'environnement
heroku config:set DB_HOST=xxx
heroku config:set MONGO_URI=xxx

# 5. Déployer
git push heroku main
```

### Option 3 : Vercel (frontend) + Railway (backend)

Vercel pour le frontend statique :
```bash
npm install -g vercel
vercel --prod
```

Railway pour l'API PHP :
```bash
# Créer compte Railway
# Connecter le repo GitHub
# Railway détecte automatiquement PHP
# Ajouter bases de données depuis le dashboard
```

---

## 💡 Conseils et bonnes pratiques

### Git

```bash
# Créer une branche pour chaque fonctionnalité
git checkout -b feature/authentication
git checkout -b feature/ride-details
git checkout -b feature/dashboard

# Commits atomiques et descriptifs
git commit -m "feat(auth): add login page with form validation"
git commit -m "fix(rides): correct filter price calculation"
git commit -m "docs: update README with installation steps"

# Merge dans develop puis main
git checkout develop
git merge feature/authentication
git checkout main
git merge develop
```

### Code

```javascript
// ✅ BON : Code clair et commenté
async function loadUserRides(userId) {
    try {
        // Récupérer les trajets de l'utilisateur
        const response = await fetch(`/api/rides?driver_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erreur lors du chargement');
        }

        const data = await response.json();
        return data.rides;

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Impossible de charger les trajets', 'error');
        return [];
    }
}

// ❌ MAUVAIS : Code non commenté, pas de gestion d'erreur
async function load(id) {
    const r = await fetch(`/api/rides?driver_id=${id}`);
    return await r.json();
}
```

### Performance

```javascript
// ✅ Débounce sur les recherches
const searchInput = document.getElementById('search');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
    }, 300);
});

// ✅ Lazy loading des images
<img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy">

// ✅ Pagination des résultats
const ITEMS_PER_PAGE = 20;
```

---

## 📞 Ressources utiles

### Documentation officielle
- **PHP PDO** : https://www.php.net/manual/fr/book.pdo.php
- **MongoDB PHP** : https://www.mongodb.com/docs/php-library/
- **JWT** : https://jwt.io/
- **MDN Web Docs** : https://developer.mozilla.org/

### Tutoriels recommandés
- Authentication avec JWT : https://jwt.io/introduction
- MongoDB avec PHP : https://www.mongodb.com/languages/php
- Charts.js pour graphiques : https://www.chartjs.org/

### Outils de développement
- **Postman** : Tester l'API
- **MySQL Workbench** : Gérer la base MySQL
- **MongoDB Compass** : Interface graphique MongoDB
- **VS Code extensions** :
  - PHP Intelephense
  - ESLint
  - Prettier
  - GitLens

---

## ✅ Checklist avant livraison

### Fonctionnalités
- [ ] Toutes les US 1-13 implémentées
- [ ] Tests manuels effectués
- [ ] Données de test cohérentes

### Documentation
- [ ] README.md à jour
- [ ] Charte graphique PDF
- [ ] Manuel utilisateur PDF
- [ ] Documentation technique PDF
- [ ] Documentation gestion projet PDF
- [ ] Maquettes (6 au total)

### Code
- [ ] Code commenté
- [ ] Pas de console.log() en production
- [ ] Pas de TODO dans le code
- [ ] Variables .env configurées
- [ ] Fichiers SQL de création/seed

### Sécurité
- [ ] Mots de passe hashés
- [ ] JWT implémenté
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection protection

### Déploiement
- [ ] Application déployée en ligne
- [ ] Bases de données en ligne
- [ ] SSL configuré (HTTPS)
- [ ] Tests en production OK

### Git
- [ ] Repo GitHub public
- [ ] Branches main et develop
- [ ] Commits propres
- [ ] README complet

### Gestion de projet
- [ ] Kanban complété (Trello/Notion/Jira)
- [ ] Toutes les US dans "Done"

---

## 🎓 Conseils pour la soutenance

### Structure recommandée (30 min)

1. **Introduction (2 min)**
   - Présentation du projet EcoRide
   - Contexte écologique
   - Objectifs de la plateforme

2. **Démo live (10 min)**
   - Parcours visiteur (recherche, consultation)
   - Parcours passager (inscription, réservation)
   - Parcours chauffeur (création trajet, gestion)
   - Parcours admin (statistiques, modération)

3. **Partie technique (10 min)**
   - Architecture (frontend/backend/databases)
   - Choix technologiques justifiés
   - Base de données (MCD, optimisations)
   - Sécurité implémentée
   - API REST

4. **Gestion de projet (5 min)**
   - Méthodologie utilisée
   - Kanban
   - Git workflow

5. **Questions (3 min)**

### Points à mettre en avant

✨ **Design moderne** : "J'ai créé un design system complet avec mode sombre/clair pour une UX optimale"

🔒 **Sécurité** : "Hash Argon2ID avec pepper, JWT, prepared statements, validation stricte"

🎯 **Architecture** : "MVC propre, code modulaire, séparation des préoccupations"

🗄️ **Hybride SQL/NoSQL** : "MySQL pour les données relationnelles, MongoDB pour les préférences et avis riches"

♻️ **Écologie** : "Mise en avant systématique des véhicules électriques avec badges et filtres"

---

**Bon développement ! 💚🚀**

Si vous avez des questions ou besoin d'aide sur une fonctionnalité spécifique, n'hésitez pas !
