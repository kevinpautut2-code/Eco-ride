/**
 * EcoRide - Gestion de la page des covoiturages
 * Recherche, filtres et affichage des trajets
 */

class RidesManager {
    constructor() {
        this.searchForm = document.getElementById('searchForm');
        this.ridesList = document.getElementById('ridesList');
        this.loadingState = document.getElementById('loadingState');
        this.noResultsState = document.getElementById('noResultsState');
        this.resultsCount = document.getElementById('resultsCount');
        this.resultsTitle = document.getElementById('resultsTitle');

        // Filtres
        this.filterEco = document.getElementById('filterEco');
        this.filterPrice = document.getElementById('filterPrice');
        this.filterDuration = document.getElementById('filterDuration');
        this.filterRating = document.getElementById('filterRating');
        this.resetFiltersBtn = document.getElementById('resetFilters');

        // Valeurs des filtres
        this.priceValue = document.getElementById('priceValue');
        this.durationValue = document.getElementById('durationValue');
        this.ratingValue = document.getElementById('ratingValue');

        // Données
        this.allRides = [];
        this.filteredRides = [];
        this.searchParams = {};

        this.init();
    }

    init() {
        // Récupérer les paramètres de recherche depuis l'URL
        this.loadSearchParams();

        // Configurer le formulaire de recherche
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Configurer les filtres
        this.setupFilters();

        // Si des paramètres de recherche existent, effectuer la recherche
        if (Object.keys(this.searchParams).length > 0) {
            this.performSearch();
        } else {
            // Sinon, afficher les trajets disponibles
            this.loadAvailableRides();
        }

        // Configurer le bouton de modification de recherche
        const modifySearchBtn = document.getElementById('modifySearchBtn');
        if (modifySearchBtn) {
            modifySearchBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    loadSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('departure')) {
            this.searchParams.departure = urlParams.get('departure');
            document.getElementById('departure').value = this.searchParams.departure;
        }

        if (urlParams.has('arrival')) {
            this.searchParams.arrival = urlParams.get('arrival');
            document.getElementById('arrival').value = this.searchParams.arrival;
        }

        if (urlParams.has('date')) {
            this.searchParams.date = urlParams.get('date');
            document.getElementById('date').value = this.searchParams.date;
        }

        // Définir la date minimale à aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').min = today;

        if (!this.searchParams.date) {
            document.getElementById('date').value = today;
        }
    }

    setupFilters() {
        // Filtre prix
        if (this.filterPrice) {
            this.filterPrice.addEventListener('input', (e) => {
                this.priceValue.textContent = `${e.target.value} crédits`;
                this.applyFilters();
            });
        }

        // Filtre durée
        if (this.filterDuration) {
            this.filterDuration.addEventListener('input', (e) => {
                this.durationValue.textContent = `${e.target.value} heures`;
                this.applyFilters();
            });
        }

        // Filtre note
        if (this.filterRating) {
            this.filterRating.addEventListener('input', (e) => {
                this.ratingValue.textContent = e.target.value;
                this.applyFilters();
            });
        }

        // Filtre écologique
        if (this.filterEco) {
            this.filterEco.addEventListener('change', () => this.applyFilters());
        }

        // Réinitialiser les filtres
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }
    }

    handleSearch(e) {
        e.preventDefault();

        const departure = document.getElementById('departure').value.trim();
        const arrival = document.getElementById('arrival').value.trim();
        const date = document.getElementById('date').value;

        if (!departure || !arrival || !date) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        this.searchParams = { departure, arrival, date };

        // Mettre à jour l'URL
        const params = new URLSearchParams(this.searchParams);
        window.history.pushState({}, '', `rides.html?${params.toString()}`);

        this.performSearch();
    }

    async performSearch() {
        this.showLoading();

        try {
            // Simuler un appel API (à remplacer par un vrai appel)
            const response = await this.fetchRides(this.searchParams);

            this.allRides = response;
            this.applyFilters();

            if (this.searchParams.departure && this.searchParams.arrival) {
                this.resultsTitle.textContent = `${this.searchParams.departure} → ${this.searchParams.arrival}`;
            }

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            this.showNotification('Une erreur est survenue lors de la recherche', 'error');
            this.hideLoading();
        }
    }

    async loadAvailableRides() {
        this.showLoading();

        try {
            const response = await this.fetchRides();
            this.allRides = response;
            this.applyFilters();
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.showNotification('Une erreur est survenue', 'error');
            this.hideLoading();
        }
    }

    async fetchRides(params = {}) {
        // Simuler des données pour la démo
        // Dans la vraie application, remplacer par: await fetch('/api/rides.php', ...)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.getMockRides());
            }, 1000);
        });
    }

    applyFilters() {
        const ecoOnly = this.filterEco?.checked || false;
        const maxPrice = parseInt(this.filterPrice?.value || 100);
        const maxDuration = parseInt(this.filterDuration?.value || 12);
        const minRating = parseFloat(this.filterRating?.value || 0);

        this.filteredRides = this.allRides.filter(ride => {
            // Filtre écologique
            if (ecoOnly && !ride.is_ecological) return false;

            // Filtre prix
            if (ride.price_credits > maxPrice) return false;

            // Filtre durée
            const duration = this.calculateDuration(ride.departure_datetime, ride.arrival_datetime);
            if (duration > maxDuration) return false;

            // Filtre note
            if (ride.driver_rating < minRating) return false;

            return true;
        });

        this.displayRides();
    }

    calculateDuration(departure, arrival) {
        const dep = new Date(departure);
        const arr = new Date(arrival);
        return (arr - dep) / (1000 * 60 * 60); // Heures
    }

    displayRides() {
        this.hideLoading();

        if (this.filteredRides.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();

        this.resultsCount.textContent = this.filteredRides.length;
        this.ridesList.innerHTML = '';

        this.filteredRides.forEach(ride => {
            const card = this.createRideCard(ride);
            this.ridesList.appendChild(card);
        });
    }

    createRideCard(ride) {
        const div = document.createElement('div');
        div.className = `ride-card${ride.is_ecological ? ' eco' : ''}`;

        const duration = this.calculateDuration(ride.departure_datetime, ride.arrival_datetime);
        const departureDate = new Date(ride.departure_datetime);
        const arrivalDate = new Date(ride.arrival_datetime);

        div.innerHTML = `
            <div class="ride-card-header">
                <div class="ride-driver">
                    <img src="${ride.driver_photo}" alt="${ride.driver_pseudo}" class="driver-avatar">
                    <div class="driver-info">
                        <h4>${ride.driver_pseudo}</h4>
                        <div class="driver-rating">
                            <span class="stars">${this.renderStars(ride.driver_rating)}</span>
                            <span>${ride.driver_rating.toFixed(1)} (${ride.driver_reviews_count} avis)</span>
                        </div>
                    </div>
                </div>
                ${ride.is_ecological ? '<span class="badge badge-eco">⚡ Électrique</span>' : ''}
            </div>

            <div class="ride-card-body">
                <div class="ride-route">
                    <div class="route-point">
                        <div class="route-icon departure">📍</div>
                        <div class="route-details">
                            <div class="route-location">${ride.departure_city}</div>
                            <div class="route-time">${this.formatDateTime(departureDate)}</div>
                        </div>
                    </div>

                    <div class="route-point">
                        <div class="route-icon arrival">🎯</div>
                        <div class="route-details">
                            <div class="route-location">${ride.arrival_city}</div>
                            <div class="route-time">${this.formatDateTime(arrivalDate)}</div>
                        </div>
                    </div>
                </div>

                <div class="ride-info">
                    <div class="info-item">
                        <div class="info-icon">👥</div>
                        <div class="info-value">${ride.seats_available}</div>
                        <div class="info-label">places</div>
                    </div>

                    <div class="info-item">
                        <div class="info-icon">⏱️</div>
                        <div class="info-value">${duration.toFixed(1)}h</div>
                        <div class="info-label">durée</div>
                    </div>

                    <div class="info-item">
                        <div class="info-icon">🚗</div>
                        <div class="info-value">${ride.brand}</div>
                        <div class="info-label">${ride.model}</div>
                    </div>
                </div>
            </div>

            <div class="ride-card-footer">
                <div class="ride-price">
                    <span class="price-amount">${ride.price_credits}</span>
                    <span class="price-currency">crédits</span>
                </div>
                <a href="ride-details.html?id=${ride.id}" class="btn btn-primary">
                    <span>👀</span>
                    <span>Voir détails</span>
                </a>
            </div>
        `;

        return div;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return '⭐'.repeat(fullStars) +
               (halfStar ? '⭐' : '') +
               '☆'.repeat(emptyStars);
    }

    formatDateTime(date) {
        const options = {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('fr-FR', options);
    }

    resetFilters() {
        if (this.filterEco) this.filterEco.checked = false;
        if (this.filterPrice) {
            this.filterPrice.value = 100;
            this.priceValue.textContent = '100 crédits';
        }
        if (this.filterDuration) {
            this.filterDuration.value = 8;
            this.durationValue.textContent = '8 heures';
        }
        if (this.filterRating) {
            this.filterRating.value = 0;
            this.ratingValue.textContent = '0.0';
        }

        this.applyFilters();
    }

    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'block';
        if (this.ridesList) this.ridesList.style.display = 'none';
        if (this.noResultsState) this.noResultsState.style.display = 'none';
    }

    hideLoading() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.ridesList) this.ridesList.style.display = 'grid';
    }

    showNoResults() {
        if (this.noResultsState) {
            this.noResultsState.style.display = 'block';
            this.resultsCount.textContent = '0';
        }
        if (this.ridesList) this.ridesList.style.display = 'none';

        // Message personnalisé selon la recherche
        const message = document.getElementById('noResultsMessage');
        if (message && this.searchParams.date) {
            // Essayer de trouver le prochain trajet disponible
            message.innerHTML = `
                Aucun trajet trouvé pour cette date.<br>
                <a href="#" onclick="return false;" style="color: var(--primary-green);">
                    Voir les trajets des prochains jours
                </a>
            `;
        }
    }

    hideNoResults() {
        if (this.noResultsState) this.noResultsState.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div class="alert-icon">${this.getIconForType(type)}</div>
            <div class="alert-content">
                <div class="alert-text">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // Données de test (à remplacer par de vrais appels API)
    getMockRides() {
        const now = new Date();

        return [
            {
                id: 1,
                driver_id: 4,
                driver_pseudo: 'chauffeur',
                driver_photo: 'https://i.pravatar.cc/150?img=4',
                driver_rating: 4.8,
                driver_reviews_count: 12,
                vehicle_id: 1,
                brand: 'Tesla',
                model: 'Model 3',
                energy_type: 'electric',
                departure_city: 'Paris',
                departure_address: '1 Place de la République, 75003 Paris',
                arrival_city: 'Lyon',
                arrival_address: '15 Rue de la République, 69001 Lyon',
                departure_datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                arrival_datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
                seats_available: 3,
                price_credits: 45,
                is_ecological: true
            },
            {
                id: 2,
                driver_id: 5,
                driver_pseudo: 'marie_eco',
                driver_photo: 'https://i.pravatar.cc/150?img=5',
                driver_rating: 5.0,
                driver_reviews_count: 8,
                vehicle_id: 2,
                brand: 'Renault',
                model: 'Zoe',
                energy_type: 'electric',
                departure_city: 'Paris',
                departure_address: '50 Avenue des Champs-Élysées, 75008 Paris',
                arrival_city: 'Marseille',
                arrival_address: '25 La Canebière, 13001 Marseille',
                departure_datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                arrival_datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
                seats_available: 4,
                price_credits: 65,
                is_ecological: true
            },
            {
                id: 3,
                driver_id: 6,
                driver_pseudo: 'thomas_green',
                driver_photo: 'https://i.pravatar.cc/150?img=6',
                driver_rating: 4.5,
                driver_reviews_count: 6,
                vehicle_id: 4,
                brand: 'Nissan',
                model: 'Leaf',
                energy_type: 'electric',
                departure_city: 'Lyon',
                departure_address: '30 Cours Lafayette, 69003 Lyon',
                arrival_city: 'Nice',
                arrival_address: '10 Promenade des Anglais, 06000 Nice',
                departure_datetime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                arrival_datetime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
                seats_available: 2,
                price_credits: 50,
                is_ecological: true
            }
        ];
    }
}

// Initialiser le gestionnaire de covoiturages
document.addEventListener('DOMContentLoaded', () => {
    new RidesManager();
});
