# 🚀 EcoRide - Démarrage Rapide

## 📍 Vous êtes ici

Félicitations ! Vous disposez d'une **base professionnelle complète** pour votre plateforme EcoRide.

### ✅ Ce qui fonctionne MAINTENANT

1. **Page d'accueil moderne** avec recherche de trajets
2. **Liste des covoiturages** avec filtres avancés
3. **Design system complet** Dark/Light mode
4. **Bases de données** configurées (MySQL + MongoDB)
5. **API REST** fonctionnelle
6. **Architecture MVC** propre

---

## 🏃‍♂️ Lancer le projet en 5 minutes

### 1. Installer les dépendances

```bash
cd /Users/mathishiguinen/Desktop/test_ecodrive/ecoride

# Installer les dépendances PHP
composer install
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer avec vos identifiants
nano .env
```

### 3. Créer les bases de données

```bash
# MySQL
mysql -u root -p < database/sql/create_database.sql
mysql -u root -p ecoride < database/sql/seed_data.sql

# MongoDB (optionnel pour l'instant, les données de test sont dans les JSON)
mongoimport --db ecoride --collection preferences --file database/mongodb/preferences.json --jsonArray
mongoimport --db ecoride --collection reviews --file database/mongodb/reviews.json --jsonArray
```

### 4. Lancer le serveur

```bash
# Depuis le dossier ecoride
php -S localhost:8000 -t frontend/

# Ou configurer XAMPP/MAMP avec un VirtualHost
```

### 5. Ouvrir l'application

```
http://localhost:8000
```

**C'est tout ! 🎉** L'application fonctionne avec des données de test.

---

## 🎨 Ce que vous pouvez tester

### Pages fonctionnelles

✅ **Page d'accueil** : http://localhost:8000/index.html
- Recherche de trajets avec autocomplétion
- Présentation de l'entreprise
- Features et statistiques

✅ **Liste des covoiturages** : http://localhost:8000/rides.html
- Affichage de 3 trajets de test
- Filtres : prix, durée, note, écologique
- Cartes de trajets animées
- Badge véhicule électrique

✅ **Toggle Dark/Light mode** : Cliquer sur le bouton ☀️/🌙
- Changement de thème fluide
- Persistance (localStorage)

### API fonctionnelle

✅ **GET /backend/controllers/RidesController.php**
- Retourne tous les trajets disponibles

✅ **GET /backend/controllers/RidesController.php/1**
- Retourne le détail du trajet #1

Testez avec Postman ou curl :
```bash
# Liste des trajets
curl http://localhost:8000/backend/controllers/RidesController.php

# Trajet spécifique
curl http://localhost:8000/backend/controllers/RidesController.php/1

# Recherche avec filtres
curl "http://localhost:8000/backend/controllers/RidesController.php?departure_city=Paris&arrival_city=Lyon"
```

---

## 📂 Structure du projet

```
ecoride/
├── 📄 README.md                    ← Instructions installation
├── 📄 PROGRESSION.md               ← État d'avancement détaillé
├── 📄 GUIDE_DEVELOPPEMENT.md       ← Guide pour continuer
├── 📄 DEMARRAGE_RAPIDE.md          ← Ce fichier
│
├── frontend/                        ← INTERFACE UTILISATEUR
│   ├── index.html                   ✅ Page d'accueil
│   ├── rides.html                   ✅ Liste covoiturages
│   │
│   ├── css/
│   │   ├── design-system.css        ✅ Variables, thèmes, base
│   │   ├── layout.css               ✅ Navigation, hero, footer
│   │   └── components.css           ✅ Cartes, filtres, modals
│   │
│   └── js/
│       ├── theme.js                 ✅ Dark/Light mode
│       ├── navigation.js            ✅ Menu responsive
│       ├── search.js                ✅ Autocomplétion
│       └── rides.js                 ✅ Liste et filtres
│
├── backend/                         ← LOGIQUE SERVEUR
│   ├── config/
│   │   └── Database.php             ✅ Connexions BDD
│   │
│   ├── models/
│   │   ├── User.php                 ✅ Gestion utilisateurs
│   │   └── Ride.php                 ✅ Gestion covoiturages
│   │
│   └── controllers/
│       └── RidesController.php      ✅ API REST
│
└── database/                        ← DONNÉES
    ├── sql/
    │   ├── create_database.sql      ✅ Schéma MySQL
    │   └── seed_data.sql            ✅ Données de test
    │
    └── mongodb/
        ├── preferences.json         ✅ Préférences users
        └── reviews.json             ✅ Avis détaillés
```

---

## 🎯 Prochaines étapes (dans l'ordre)

### 1. Système d'authentification (PRIORITÉ 1) 🔐
**Temps estimé : 4-6 heures**

Fichiers à créer :
- `frontend/login.html`
- `frontend/register.html`
- `frontend/js/auth.js`
- `backend/controllers/AuthController.php`

👉 **Voir GUIDE_DEVELOPPEMENT.md section "Système d'authentification"** pour le code complet

### 2. Page détaillée d'un covoiturage (US5) 🚗
**Temps estimé : 3-4 heures**

Fichiers à créer :
- `frontend/ride-details.html`
- `frontend/js/ride-details.js`

### 3. Participation à un covoiturage (US6) 🎫
**Temps estimé : 2-3 heures**

Backend :
- `backend/controllers/BookingsController.php`
- `backend/models/Booking.php`

### 4. Dashboard utilisateur (US8) 👤
**Temps estimé : 4-5 heures**

- `frontend/dashboard.html`
- `frontend/js/dashboard.js`

### Total MVP : ~15-20 heures de développement

---

## 💡 Astuces

### Réutiliser les composants existants

Tous les styles sont dans `components.css`, utilisez-les !

```html
<!-- Bouton principal -->
<button class="btn btn-primary">Mon bouton</button>

<!-- Carte -->
<div class="card">
  <div class="card-body">Contenu</div>
</div>

<!-- Badge écologique -->
<span class="badge badge-eco">⚡ Électrique</span>

<!-- Notification -->
showNotification('Message de succès', 'success');
```

### Debugging

```javascript
// Dans rides.js, activer le mode debug
console.log('Rides loaded:', this.allRides);

// Vérifier la connexion BDD
// Créer test-connection.php dans backend/
<?php
require_once 'config/Database.php';
$tests = Database::testConnections();
print_r($tests);
```

### Données de test

**Identifiants disponibles :**
- Admin : `admin@ecoride.fr` / `Test@2025!`
- Employé : `employe@ecoride.fr` / `Test@2025!`
- Chauffeur : `chauffeur@ecoride.fr` / `Test@2025!`
- Passager : `passager@ecoride.fr` / `Test@2025!`

---

## 🐛 Problèmes fréquents

### "Connection failed" sur l'API

**Problème** : Les requêtes API ne fonctionnent pas

**Solution** :
```bash
# Vérifier que PHP est lancé
ps aux | grep php

# Vérifier les erreurs PHP
tail -f /var/log/php/error.log

# Tester la connexion BDD
php -f backend/test-connection.php
```

### Mode sombre ne se sauvegarde pas

**Problème** : Le thème ne persiste pas au rechargement

**Solution** : Vérifier que localStorage est activé dans votre navigateur
```javascript
// Tester dans la console
localStorage.setItem('test', '1');
localStorage.getItem('test'); // Doit retourner '1'
```

### Les filtres ne fonctionnent pas

**Problème** : Les trajets ne se filtrent pas

**Solution** : Ouvrir la console du navigateur (F12) et vérifier les erreurs JavaScript

---

## 📚 Documentation

- **PROGRESSION.md** : État détaillé de ce qui est fait/à faire
- **GUIDE_DEVELOPPEMENT.md** : Guide complet pour continuer (TRÈS IMPORTANT !)
- **README.md** : Instructions d'installation officielles

---

## 🎓 Pour votre évaluation

### Ce qui est attendu (checklist)

**Fonctionnalités :**
- ✅ US1 : Page d'accueil ✓
- ✅ US2 : Menu ✓
- ✅ US3 : Vue covoiturages ✓
- ✅ US4 : Filtres ✓
- ⏳ US5-13 : À compléter

**Livrables :**
- ✅ Dépôt GitHub
- ✅ README avec instructions
- ✅ Base de données (schéma + données)
- ⏳ Application déployée
- ⏳ Maquettes (6)
- ⏳ Charte graphique PDF
- ⏳ Manuel utilisateur PDF
- ⏳ Documentation technique PDF
- ⏳ Gestion projet (Kanban)

### Timeline suggérée

**Semaine 1-2 :** Compléter fonctionnalités (US5-13)
**Semaine 3 :** Documentation et maquettes
**Semaine 4 :** Déploiement et tests
**Semaine 5 :** Préparation soutenance

---

## 🚀 Commandes Git utiles

```bash
# Voir l'état du projet
git status

# Voir l'historique
git log --oneline

# Créer une branche pour une nouvelle fonctionnalité
git checkout -b feature/authentication

# Sauvegarder vos modifications
git add .
git commit -m "feat: add authentication system"

# Pousser sur GitHub
git remote add origin https://github.com/votre-username/ecoride.git
git push -u origin main
```

---

## 💬 Besoin d'aide ?

### Ordre de lecture des documents

1. **Ce fichier** (DEMARRAGE_RAPIDE.md) - Vous y êtes ! ✓
2. **GUIDE_DEVELOPPEMENT.md** - Guide détaillé pour continuer
3. **PROGRESSION.md** - État d'avancement
4. **README.md** - Documentation officielle

### Ressources

- Documentation PHP PDO : https://www.php.net/pdo
- MongoDB PHP : https://www.mongodb.com/docs/php-library/
- Flexbox/Grid : https://css-tricks.com/
- Fetch API : https://developer.mozilla.org/fr/docs/Web/API/Fetch_API

---

## ✨ Points forts de ce projet

Ce qui va impressionner le jury :

1. 🎨 **Design exceptionnel** : Mode sombre/clair, animations fluides
2. 🏗️ **Architecture propre** : MVC, code modulaire, séparation claire
3. 🔒 **Sécurité robuste** : Argon2ID, PDO, validation
4. 🗄️ **Hybride SQL/NoSQL** : Utilisation intelligente de 2 types de BDD
5. 💚 **Engagement écologique** : Thème cohérent, filtres écolo
6. 📱 **Responsive** : Fonctionne sur tous les écrans
7. ⚡ **Performance** : Lazy loading, débounce, optimisations

---

## 🎉 Bon courage !

Vous avez entre les mains une **base solide et professionnelle**.

Le plus dur est fait : architecture, design, base de données.

Maintenant, il "suffit" de compléter les fonctionnalités en suivant le **GUIDE_DEVELOPPEMENT.md** !

**N'oubliez pas** : Faites des commits réguliers et testez au fur et à mesure.

---

**Créé avec 💚 pour un monde plus vert**

*Dernière mise à jour : 17 janvier 2025*
