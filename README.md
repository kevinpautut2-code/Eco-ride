# 🌱 EcoRide - Plateforme de Covoiturage Écologique

EcoRide est une plateforme moderne de covoiturage qui encourage les déplacements écologiques et responsables.

## 🎨 Design

- Design futuriste et moderne
- Mode sombre / Mode clair
- Palette de couleurs écologiques (vert EcoRide)
- Interface responsive (mobile, tablette, desktop)

## 🚀 Technologies

### Frontend
- HTML5
- CSS3 (Design system personnalisé)
- JavaScript (Vanilla JS)

### Backend
- PHP 8.x
- PDO pour la base de données relationnelle
- MongoDB Driver pour NoSQL

### Bases de données
- MySQL/MariaDB (données relationnelles)
- MongoDB (données NoSQL - préférences, avis)

## 📦 Installation

### Prérequis
- PHP >= 8.0
- MySQL/MariaDB >= 8.0
- MongoDB >= 5.0
- Composer
- Serveur web (Apache/Nginx)

### Installation locale

1. **Cloner le dépôt**
```bash
git clone https://github.com/votre-username/ecoride.git
cd ecoride
```

2. **Configuration de la base de données relationnelle**
```bash
# Créer la base de données
mysql -u root -p < database/sql/create_database.sql

# Importer les données de test
mysql -u root -p ecoride < database/sql/seed_data.sql
```

3. **Configuration de MongoDB**
```bash
# Importer les collections MongoDB
mongoimport --db ecoride --collection preferences --file database/mongodb/preferences.json
mongoimport --db ecoride --collection reviews --file database/mongodb/reviews.json
```

4. **Configuration de l'environnement**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables d'environnement
nano .env
```

5. **Configuration du serveur web**

Pour Apache, créer un VirtualHost :
```apache
<VirtualHost *:80>
    ServerName ecoride.local
    DocumentRoot /path/to/ecoride/frontend

    <Directory /path/to/ecoride/frontend>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

6. **Démarrage**
```bash
# Ajouter au fichier hosts
sudo echo "127.0.0.1 ecoride.local" >> /etc/hosts

# Accéder à l'application
# http://ecoride.local
```

## 🌐 Déploiement

Voir la documentation complète de déploiement dans `docs/deployment.pdf`

## 📚 Documentation

- **Manuel d'utilisation** : `docs/manuel_utilisation.pdf`
- **Charte graphique** : `docs/charte_graphique.pdf`
- **Documentation technique** : `docs/documentation_technique.pdf`
- **Gestion de projet** : `docs/gestion_projet.pdf`

## 🔐 Comptes de test

### Administrateur
- Email: admin@ecoride.fr
- Mot de passe: Admin@2025!

### Employé
- Email: employe@ecoride.fr
- Mot de passe: Employe@2025!

### Utilisateur (Chauffeur)
- Email: chauffeur@ecoride.fr
- Mot de passe: Chauffeur@2025!

### Utilisateur (Passager)
- Email: passager@ecoride.fr
- Mot de passe: Passager@2025!

## 📋 Gestion de projet

Le projet utilise un Kanban disponible sur [Trello/Notion/Jira - Lien]

## 🤝 Contribution

Ce projet est développé dans le cadre de l'évaluation du titre professionnel Développeur Web et Web Mobile.

## 📄 Licence

Copyright © 2025 EcoRide - Tous droits réservés

## 👨‍💻 Auteur

Développé avec 💚 pour un monde plus écologique
