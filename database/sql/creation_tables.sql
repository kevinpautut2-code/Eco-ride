-- Création de la Base de Données (Décommenter si nécessaire)
-- CREATE DATABASE eco_ride_db;
-- USE eco_ride_db;

-- 1. Table Utilisateur (US 7, 8, 12, 13)
-- Contient tous les types d'utilisateurs (Passager, Chauffeur, Employé, Administrateur)
CREATE TABLE UTILISATEUR (
    id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    pseudo VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe_hashé VARCHAR(255) NOT NULL,
    role ENUM('Passager', 'Chauffeur', 'Employé', 'Administrateur') NOT NULL,
    credits INT DEFAULT 20 NOT NULL, -- US 7 : 20 crédits par défaut
    note_moyenne_chauffeur DECIMAL(2, 1) DEFAULT 0.0,
    est_suspendu BOOLEAN DEFAULT FALSE, -- US 13 : Suspension de compte
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Voiture (US 8, 9)
-- Stocke les informations spécifiques au(x) véhicule(s) du chauffeur
CREATE TABLE VOITURE (
    id_voiture INT PRIMARY KEY AUTO_INCREMENT,
    id_proprietaire INT NOT NULL,
    modele VARCHAR(100) NOT NULL,
    marque VARCHAR(100) NOT NULL,
    couleur VARCHAR(50),
    plaque_immatriculation VARCHAR(20) UNIQUE NOT NULL,
    date_immatriculation DATE,
    energie ENUM('Essence', 'Diesel', 'Électrique', 'Hybride') NOT NULL, -- Pour la mention "voyage écologique" (Électrique)
    places_disponibles INT NOT NULL,
    
    FOREIGN KEY (id_proprietaire) REFERENCES UTILISATEUR(id_utilisateur)
);

-- 3. Table Préférence (US 8)
-- Contient la liste des préférences possibles (Fumeur, Animal, etc.)
CREATE TABLE PREFERENCE (
    id_preference INT PRIMARY KEY AUTO_INCREMENT,
    nom_preference VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Table d'Association Voiture_Preference (US 8)
-- Permet de lier les préférences spécifiques à chaque voiture du chauffeur
CREATE TABLE VOITURE_PREFERENCE (
    id_voiture INT NOT NULL,
    id_preference INT NOT NULL,
    valeur BOOLEAN NOT NULL, -- TRUE pour Oui, FALSE pour Non
    
    PRIMARY KEY (id_voiture, id_preference),
    FOREIGN KEY (id_voiture) REFERENCES VOITURE(id_voiture),
    FOREIGN KEY (id_preference) REFERENCES PREFERENCE(id_preference)
);

-- 5. Table Trajet (US 1, 3, 9, 11)
-- Stocke les offres de covoiturage
CREATE TABLE TRAJET (
    id_trajet INT PRIMARY KEY AUTO_INCREMENT,
    id_chauffeur INT NOT NULL,
    id_voiture INT NOT NULL, -- Le véhicule utilisé pour ce trajet
    
    ville_depart VARCHAR(100) NOT NULL,
    ville_arrivee VARCHAR(100) NOT NULL,
    date_depart DATE NOT NULL,
    heure_depart TIME NOT NULL,
    heure_arrivee TIME,
    prix_en_credits INT NOT NULL, -- US 9 : Prix fixé par le chauffeur
    places_initiales INT NOT NULL,
    places_restantes INT NOT NULL,
    
    est_commencé BOOLEAN DEFAULT FALSE, -- US 11 : Bouton "démarrer"
    est_terminé BOOLEAN DEFAULT FALSE, -- US 11 : Bouton "arrivée à destination"
    
    FOREIGN KEY (id_chauffeur) REFERENCES UTILISATEUR(id_utilisateur),
    FOREIGN KEY (id_voiture) REFERENCES VOITURE(id_voiture)
);

-- 6. Table Réservation (US 6, 10)
-- Table d'association pour les passagers participant à un trajet
CREATE TABLE RESERVATION (
    id_passager INT NOT NULL,
    id_trajet INT NOT NULL,
    nb_credits_utilises INT NOT NULL,
    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('Confirmée', 'Annulée', 'Terminée') DEFAULT 'Confirmée',
    validation_passager BOOLEAN DEFAULT FALSE, -- US 11 : Validation après l'arrivée
    
    PRIMARY KEY (id_passager, id_trajet),
    FOREIGN KEY (id_passager) REFERENCES UTILISATEUR(id_utilisateur),
    FOREIGN KEY (id_trajet) REFERENCES TRAJET(id_trajet)
);

-- 7. Table Avis (US 5, 11, 12)
-- Stocke les avis donnés par les passagers aux chauffeurs
CREATE TABLE AVIS (
    id_avis INT PRIMARY KEY AUTO_INCREMENT,
    id_chauffeur_cible INT NOT NULL,
    id_passager_donneur INT NOT NULL,
    note INT CHECK (note >= 1 AND note <= 5) NOT NULL,
    commentaire TEXT,
    est_valide_employe BOOLEAN DEFAULT FALSE, -- US 12 : Validation par l'employé
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_chauffeur_cible) REFERENCES UTILISATEUR(id_utilisateur),
    FOREIGN KEY (id_passager_donneur) REFERENCES UTILISATEUR(id_utilisateur)
);