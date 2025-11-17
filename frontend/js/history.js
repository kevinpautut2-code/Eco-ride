/**
 * EcoRide - Historique des covoiturages
 * Affichage et gestion de l'historique utilisateur
 */

class HistoryManager {
    constructor() {
        this.user = null;
        this.rides = [];
        this.bookings = [];
        this.currentFilter = 'all';

        this.init();
    }

    async init() {
        // Vérifier l'authentification
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=history.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();

        // Charger l'historique
        await this.loadHistory();

        // Configurer les filtres
        this.setupFilters();
    }

    async loadHistory() {
        try {
            // Charger les trajets créés (en tant que conducteur)
            const ridesResponse = await window.apiClient.get(`/users/${this.user.id}/rides`);

            // Charger les réservations (en tant que passager)
            const bookingsResponse = await window.apiClient.get(`/users/${this.user.id}/bookings`);

            if (ridesResponse.success) {
                this.rides = ridesResponse.rides || [];
            }

            if (bookingsResponse.success) {
                this.bookings = bookingsResponse.bookings || [];
            }

            this.updateStats();
            this.displayHistory();

        } catch (error) {
            console.error('Error loading history:', error);
            // Afficher avec données vides
            this.displayHistory();
        }
    }

    updateStats() {
        const asDriver = this.rides.length;
        const asPassenger = this.bookings.length;

        // Calculer crédits gagnés (trajets terminés en tant que conducteur)
        const completedRides = this.rides.filter(r => r.status === 'completed');
        const creditsEarned = completedRides.reduce((sum, ride) => {
            return sum + ((ride.price_credits - 2) * (ride.total_seats - ride.seats_available));
        }, 0);

        // Calculer CO2 économisé (estimation)
        const totalRides = asDriver + asPassenger;
        const co2Saved = Math.round(totalRides * 12.5); // ~12.5kg CO2 par trajet

        document.getElementById('totalAsDriver').textContent = asDriver;
        document.getElementById('totalAsPassenger').textContent = asPassenger;
        document.getElementById('totalCreditsEarned').textContent = creditsEarned;
        document.getElementById('co2Saved').textContent = co2Saved;
    }

    setupFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');

        statusFilter?.addEventListener('change', () => {
            this.currentFilter = statusFilter.value;
            this.displayHistory();
        });

        roleFilter?.addEventListener('change', () => {
            this.currentRole = roleFilter.value;
            this.displayHistory();
        });
    }

    displayHistory() {
        const container = document.getElementById('historyList');

        if (!container) return;

        // Combiner et trier tous les trajets
        const allTrips = this.getAllTrips();

        if (allTrips.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 4rem; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;">📅</div>
                    <h3>Aucun trajet dans votre historique</h3>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">
                        Vos trajets passés et à venir s'afficheront ici
                    </p>
                    <div style="margin-top: 2rem;">
                        <a href="rides.html" class="btn btn-secondary">Rechercher un trajet</a>
                        <a href="create-ride.html" class="btn btn-primary" style="margin-left: 1rem;">Créer un trajet</a>
                    </div>
                </div>
            `;
            return;
        }

        const html = allTrips.map(trip => this.renderTripCard(trip)).join('');
        container.innerHTML = html;

        // Attacher les événements d'annulation
        this.attachCancelHandlers();
    }

    getAllTrips() {
        const trips = [];

        // Ajouter les trajets en tant que conducteur
        this.rides.forEach(ride => {
            trips.push({
                ...ride,
                role: 'driver',
                date: new Date(ride.departure_datetime)
            });
        });

        // Ajouter les réservations en tant que passager
        this.bookings.forEach(booking => {
            trips.push({
                ...booking,
                role: 'passenger',
                date: new Date(booking.departure_datetime)
            });
        });

        // Filtrer
        let filtered = trips;

        if (this.currentFilter === 'upcoming') {
            filtered = trips.filter(t => t.date > new Date());
        } else if (this.currentFilter === 'past') {
            filtered = trips.filter(t => t.date <= new Date());
        } else if (this.currentFilter === 'active') {
            filtered = trips.filter(t => t.status === 'active');
        } else if (this.currentFilter === 'completed') {
            filtered = trips.filter(t => t.status === 'completed');
        }

        // Trier par date (plus récent en premier)
        filtered.sort((a, b) => b.date - a.date);

        return filtered;
    }

    renderTripCard(trip) {
        const isUpcoming = trip.date > new Date();
        const canCancel = isUpcoming && trip.status !== 'cancelled';
        const roleLabel = trip.role === 'driver' ? 'Conducteur' : 'Passager';
        const roleColor = trip.role === 'driver' ? 'var(--primary-green)' : 'var(--primary-teal)';

        return `
            <div class="card mb-md" data-trip-id="${trip.id}" data-trip-role="${trip.role}">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h3 style="margin: 0;">${trip.departure_city} → ${trip.arrival_city}</h3>
                                <span class="badge" style="background: ${roleColor};">${roleLabel}</span>
                                ${this.getStatusBadge(trip.status)}
                            </div>
                            <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                ${this.formatDate(trip.departure_datetime)}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-green);">
                                ${trip.price_credits} crédits
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light);">
                        <div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Départ</div>
                            <div>${trip.departure_address}</div>
                            <div style="color: var(--text-tertiary); font-size: var(--font-size-sm);">
                                ${this.formatTime(trip.departure_datetime)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Arrivée</div>
                            <div>${trip.arrival_address}</div>
                            <div style="color: var(--text-tertiary); font-size: var(--font-size-sm);">
                                ${this.formatTime(trip.arrival_datetime)}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <div style="display: flex; gap: 1rem; font-size: var(--font-size-sm);">
                            ${trip.role === 'driver' ? `
                                <span>Places : ${trip.total_seats - trip.seats_available}/${trip.total_seats}</span>
                            ` : `
                                <span>Conducteur : ${trip.driver_pseudo}</span>
                            `}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${canCancel ? `
                                <button class="btn btn-danger btn-sm cancel-trip-btn"
                                        data-trip-id="${trip.id}"
                                        data-trip-role="${trip.role}">
                                    Annuler
                                </button>
                            ` : ''}
                            <a href="ride-details.html?id=${trip.ride_id || trip.id}" class="btn btn-secondary btn-sm">
                                Détails
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge" style="background: var(--warning-yellow);">En attente</span>',
            'active': '<span class="badge" style="background: var(--success-green);">Actif</span>',
            'completed': '<span class="badge" style="background: var(--info-blue);">Terminé</span>',
            'cancelled': '<span class="badge" style="background: var(--error-red);">Annulé</span>'
        };
        return badges[status] || '';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    attachCancelHandlers() {
        const cancelBtns = document.querySelectorAll('.cancel-trip-btn');

        cancelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tripId = e.target.dataset.tripId;
                const role = e.target.dataset.tripRole;
                this.handleCancelTrip(tripId, role);
            });
        });
    }

    async handleCancelTrip(tripId, role) {
        const confirmMsg = role === 'driver'
            ? 'Êtes-vous sûr de vouloir annuler ce trajet ? Les passagers seront remboursés et notifiés par email.'
            : 'Êtes-vous sûr de vouloir annuler votre réservation ? Vos crédits seront remboursés.';

        if (!confirm(confirmMsg)) {
            return;
        }

        try {
            const endpoint = role === 'driver'
                ? `/rides/${tripId}`
                : `/bookings/${tripId}`;

            const response = await window.apiClient.delete(endpoint);

            if (response.success) {
                this.showSuccess('Annulation réussie !');

                // Recharger l'historique
                await this.loadHistory();

                // Mettre à jour les crédits de l'utilisateur
                if (response.new_credits !== undefined) {
                    this.user.credits = response.new_credits;
                    window.authManager.updateUser(this.user);
                }
            } else {
                throw new Error(response.message || 'Erreur lors de l\'annulation');
            }
        } catch (error) {
            console.error('Error cancelling trip:', error);
            alert('Erreur : ' + error.message);
        }
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.style.cssText = 'position: fixed; top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alert.innerHTML = `
            <div class="alert-icon">✓</div>
            <div class="alert-content">
                <div class="alert-title">Succès</div>
                <div class="alert-text">${message}</div>
            </div>
        `;
        document.body.appendChild(alert);

        setTimeout(() => alert.remove(), 3000);
    }
}

// Initialiser
const historyManager = new HistoryManager();
window.historyManager = historyManager;
