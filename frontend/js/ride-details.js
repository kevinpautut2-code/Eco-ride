/**
 * EcoRide - Détails d'un covoiturage
 * Affichage détaillé et réservation
 */

class RideDetailsManager {
    constructor() {
        this.rideId = null;
        this.rideData = null;
        this.init();
    }

    init() {
        // Récupérer l'ID du trajet depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        this.rideId = urlParams.get('id');

        if (!this.rideId) {
            this.showError();
            return;
        }

        // Charger les détails du trajet
        this.loadRideDetails();

        // Configurer le bouton de participation
        const participateBtn = document.getElementById('participateBtn');
        if (participateBtn) {
            participateBtn.addEventListener('click', () => this.handleParticipate());
        }
    }

    async loadRideDetails() {
        try {
            // Simulation de chargement (à remplacer par un vrai appel API)
            const ride = await this.fetchRideDetails(this.rideId);

            if (ride) {
                this.rideData = ride;
                this.displayRideDetails(ride);
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.showError();
        }
    }

    async fetchRideDetails(id) {
        // Données de test - simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Données mockées
        const mockRides = {
            '1': {
                id: 1,
                driver_id: 4,
                driver_pseudo: 'chauffeur',
                driver_photo: 'https://i.pravatar.cc/150?img=4',
                driver_rating: 4.8,
                driver_reviews_count: 12,
                departure_city: 'Paris',
                departure_address: '1 Place de la République, 75003 Paris',
                arrival_city: 'Lyon',
                arrival_address: '15 Rue de la République, 69001 Lyon',
                departure_datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                arrival_datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
                seats_available: 3,
                price_credits: 45,
                is_ecological: true,
                brand: 'Tesla',
                model: 'Model 3',
                color: 'Blanc',
                energy_type: 'electric',
                preferences: {
                    smoking: false,
                    pets: true,
                    music: true,
                    conversation: 'depends',
                    custom: [
                        { label: 'Arrêts autorisés', value: true, icon: '⏸️' },
                        { label: 'Climatisation', value: true, icon: '❄️' },
                        { label: 'Chargeur téléphone', value: true, icon: '🔌' }
                    ]
                },
                reviews: [
                    {
                        reviewer_pseudo: 'Marie',
                        reviewer_photo: 'https://i.pravatar.cc/150?img=5',
                        rating: 5,
                        comment: 'Excellent chauffeur ! Très ponctuel et agréable.',
                        created_at: '2025-01-10'
                    },
                    {
                        reviewer_pseudo: 'Pierre',
                        reviewer_photo: 'https://i.pravatar.cc/150?img=11',
                        rating: 4,
                        comment: 'Très bon trajet, chauffeur sympathique.',
                        created_at: '2025-01-08'
                    }
                ]
            }
        };

        return mockRides[id] || null;
    }

    displayRideDetails(ride) {
        // Cacher le loading, afficher le contenu
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('rideContent').style.display = 'block';

        // Titre
        document.getElementById('rideTitle').textContent = `${ride.departure_city} → ${ride.arrival_city}`;

        // Badge écologique
        if (ride.is_ecological) {
            document.getElementById('ecoBadge').innerHTML = '<span class="badge badge-eco">⚡ Électrique</span>';
        }

        // Informations du trajet
        document.getElementById('departureCity').textContent = ride.departure_city;
        document.getElementById('departureAddress').textContent = ride.departure_address;
        document.getElementById('departureTime').textContent = this.formatDateTime(new Date(ride.departure_datetime));

        document.getElementById('arrivalCity').textContent = ride.arrival_city;
        document.getElementById('arrivalAddress').textContent = ride.arrival_address;
        document.getElementById('arrivalTime').textContent = this.formatDateTime(new Date(ride.arrival_datetime));

        // Info boxes
        document.getElementById('seatsAvailable').textContent = ride.seats_available;

        const duration = this.calculateDuration(ride.departure_datetime, ride.arrival_datetime);
        document.getElementById('duration').textContent = `${duration.toFixed(1)}h`;

        document.getElementById('price').textContent = ride.price_credits;
        document.getElementById('sidebarPrice').textContent = ride.price_credits;
        document.getElementById('pricePerSeat').textContent = `${ride.price_credits} crédits`;

        // Informations conducteur
        document.getElementById('driverPhoto').src = ride.driver_photo;
        document.getElementById('driverPhoto').alt = ride.driver_pseudo;
        document.getElementById('driverName').textContent = ride.driver_pseudo;
        document.getElementById('driverRating').textContent = ride.driver_rating.toFixed(1);
        document.getElementById('reviewsCount').textContent = ride.driver_reviews_count;
        document.getElementById('driverStars').textContent = this.renderStars(ride.driver_rating);

        // Stats conducteur
        document.getElementById('driverStats').innerHTML = `
            <span>🚗 ${Math.floor(Math.random() * 50 + 10)} trajets</span>
            <span>👥 ${Math.floor(Math.random() * 100 + 20)} passagers</span>
            <span>📅 Membre depuis ${new Date().getFullYear() - 2}</span>
        `;

        // Préférences du conducteur
        this.displayPreferences(ride.preferences);

        // Véhicule
        document.getElementById('vehicleName').textContent = `${ride.brand} ${ride.model}`;

        if (ride.energy_type === 'electric') {
            document.getElementById('vehicleEnergyBadge').innerHTML = '<span class="badge badge-eco">⚡ Électrique</span>';
        }

        document.getElementById('vehicleDetails').innerHTML = `
            <div class="vehicle-detail">
                <span>🎨</span>
                <span>Couleur: ${ride.color}</span>
            </div>
            <div class="vehicle-detail">
                <span>⚡</span>
                <span>Énergie: ${this.translateEnergy(ride.energy_type)}</span>
            </div>
            <div class="vehicle-detail">
                <span>🪑</span>
                <span>${ride.seats_available} places disponibles</span>
            </div>
        `;

        // Avis
        this.displayReviews(ride.reviews);

        // Gérer le bouton de participation
        this.updateParticipateButton(ride);
    }

    displayPreferences(prefs) {
        if (!prefs) return;

        const prefsHTML = `
            <h4 style="margin-bottom: 1rem;">Préférences du conducteur</h4>
            <div class="preferences-list">
                <span class="preference-tag ${prefs.smoking ? 'active' : ''}">
                    <span class="preference-icon">${prefs.smoking ? '🚬' : '🚭'}</span>
                    <span>${prefs.smoking ? 'Fumeurs acceptés' : 'Non-fumeur'}</span>
                </span>
                <span class="preference-tag ${prefs.pets ? 'active' : ''}">
                    <span class="preference-icon">${prefs.pets ? '🐕' : '🚫'}</span>
                    <span>${prefs.pets ? 'Animaux acceptés' : 'Pas d\'animaux'}</span>
                </span>
                <span class="preference-tag ${prefs.music ? 'active' : ''}">
                    <span class="preference-icon">🎵</span>
                    <span>Musique ${prefs.music ? 'autorisée' : 'interdite'}</span>
                </span>
                <span class="preference-tag">
                    <span class="preference-icon">💬</span>
                    <span>Conversation: ${this.translateConversation(prefs.conversation)}</span>
                </span>
                ${prefs.custom ? prefs.custom.map(c => `
                    <span class="preference-tag ${c.value ? 'active' : ''}">
                        <span class="preference-icon">${c.icon}</span>
                        <span>${c.label}</span>
                    </span>
                `).join('') : ''}
            </div>
        `;

        document.getElementById('driverPreferences').innerHTML = prefsHTML;
    }

    displayReviews(reviews) {
        if (!reviews || reviews.length === 0) {
            document.getElementById('reviewsList').innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <p style="color: var(--text-tertiary);">Aucun avis pour le moment</p>
                </div>
            `;
            return;
        }

        const reviewsHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-author">
                        <img src="${review.reviewer_photo}" alt="${review.reviewer_pseudo}" class="review-avatar">
                        <span class="review-author-name">${review.reviewer_pseudo}</span>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                        <span>${review.rating}/5</span>
                    </div>
                </div>
                <div class="review-content">${review.comment}</div>
                <div class="review-date">${this.formatDate(review.created_at)}</div>
            </div>
        `).join('');

        document.getElementById('reviewsList').innerHTML = reviewsHTML;
    }

    updateParticipateButton(ride) {
        const btn = document.getElementById('participateBtn');

        // Vérifier s'il y a encore des places
        if (ride.seats_available === 0) {
            btn.disabled = true;
            btn.innerHTML = '<span>😔</span><span>Complet</span>';
            return;
        }

        // Vérifier si l'utilisateur est connecté
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            btn.innerHTML = '<span>🔐</span><span>Connectez-vous pour réserver</span>';
            btn.onclick = () => {
                window.location.href = 'login.html?redirect=ride-details.html?id=' + this.rideId;
            };
            return;
        }

        // Vérifier les crédits
        const user = window.authManager.getCurrentUser();
        if (user.credits < ride.price_credits) {
            btn.disabled = true;
            btn.innerHTML = '<span>💳</span><span>Crédits insuffisants</span>';
            return;
        }
    }

    handleParticipate() {
        // Vérifier l'authentification
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=ride-details.html?id=' + this.rideId;
            return;
        }

        // Afficher le modal de confirmation
        this.showParticipationModal();
    }

    showParticipationModal() {
        const modal = document.getElementById('participationModal');
        const user = window.authManager.getCurrentUser();

        // Remplir les informations
        document.getElementById('modalPrice').textContent = `${this.rideData.price_credits} crédits`;
        document.getElementById('currentBalance').textContent = `${user.credits} crédits`;
        document.getElementById('balanceAfter').textContent = `${user.credits - this.rideData.price_credits} crédits`;
        document.getElementById('confirmPrice').textContent = `${this.rideData.price_credits} crédits`;

        // Afficher le modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Utilitaires
    calculateDuration(departure, arrival) {
        const dep = new Date(departure);
        const arr = new Date(arrival);
        return (arr - dep) / (1000 * 60 * 60);
    }

    formatDateTime(date) {
        const options = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('fr-FR', options);
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return '⭐'.repeat(fullStars) + (halfStar ? '⭐' : '') + '☆'.repeat(emptyStars);
    }

    translateEnergy(energy) {
        const translations = {
            'electric': 'Électrique',
            'essence': 'Essence',
            'diesel': 'Diesel',
            'hybrid': 'Hybride'
        };
        return translations[energy] || energy;
    }

    translateConversation(level) {
        const translations = {
            'yes': 'Bavard',
            'no': 'Silencieux',
            'depends': 'Ça dépend'
        };
        return translations[level] || level;
    }

    showError() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
    }
}

// Fonctions globales pour le modal
window.closeParticipationModal = function() {
    const modal = document.getElementById('participationModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
};

window.confirmParticipation = async function() {
    // Simuler la réservation
    const user = window.authManager.getCurrentUser();
    const ride = window.rideDetailsManager.rideData;

    try {
        // Débiter les crédits
        user.credits -= ride.price_credits;

        // Sauvegarder
        const storage = localStorage.getItem('ecoride_user') ? localStorage : sessionStorage;
        storage.setItem('ecoride_user', JSON.stringify(user));

        // Fermer le modal
        window.closeParticipationModal();

        // Afficher succès
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.style.cssText = 'position: fixed; top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alert.innerHTML = `
            <div class="alert-icon">✓</div>
            <div class="alert-content">
                <div class="alert-title">Réservation confirmée !</div>
                <div class="alert-text">Votre place a été réservée. Rendez-vous le jour J !</div>
            </div>
        `;
        document.body.appendChild(alert);

        // Rediriger vers le dashboard après 2 secondes
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Erreur lors de la réservation:', error);
        alert('Une erreur est survenue');
    }
};

// Initialiser
const rideDetailsManager = new RideDetailsManager();
window.rideDetailsManager = rideDetailsManager;
