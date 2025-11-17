/**
 * EcoRide - Gestion trajet actif
 * Démarrage, suivi et fin de trajet en temps réel
 */

class RideActiveManager {
    constructor() {
        this.user = null;
        this.ride = null;
        this.rideId = null;
        this.passengers = [];
        this.state = {
            started: false,
            startTime: null,
            pickedUp: {},
            progress: 0
        };
        this.timerInterval = null;

        this.init();
    }

    async init() {
        // Vérifier l'authentification
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=ride-active.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();

        // Récupérer l'ID du trajet depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        this.rideId = urlParams.get('id');

        if (!this.rideId) {
            alert('Aucun trajet spécifié');
            window.location.href = 'dashboard.html';
            return;
        }

        // Charger les données du trajet
        await this.loadRideData();
    }

    async loadRideData() {
        try {
            const response = await window.apiClient.get(`/rides/${this.rideId}`);

            if (response.success) {
                this.ride = response.ride;

                // Vérifier que l'utilisateur est bien le conducteur
                if (this.ride.driver_id !== this.user.id) {
                    alert('Vous n\'êtes pas le conducteur de ce trajet');
                    window.location.href = 'dashboard.html';
                    return;
                }

                // Charger les passagers (réservations confirmées)
                await this.loadPassengers();

                // Afficher les données
                this.displayRideInfo();
            } else {
                throw new Error(response.message || 'Trajet non trouvé');
            }
        } catch (error) {
            console.error('Error loading ride:', error);
            alert('Erreur lors du chargement du trajet');
            window.location.href = 'dashboard.html';
        }
    }

    async loadPassengers() {
        try {
            // Récupérer les réservations confirmées pour ce trajet
            const response = await window.apiClient.get(`/rides/${this.rideId}/bookings`);

            if (response.success) {
                this.passengers = response.bookings || [];

                // Initialiser l'état d'embarquement
                this.passengers.forEach(p => {
                    this.state.pickedUp[p.passenger_id] = false;
                });
            }
        } catch (error) {
            console.error('Error loading passengers:', error);
        }
    }

    displayRideInfo() {
        // Mettre à jour le titre
        document.querySelector('#rideStatus').parentElement.parentElement.querySelector('p').textContent =
            `${this.ride.departure_city} → ${this.ride.arrival_city} • Trajet #${this.ride.id}`;

        // Calculer les revenus (prix - 2 crédits plateforme) * nombre de passagers
        const passengerCount = this.passengers.length;
        const earnings = (this.ride.price_credits - 2) * passengerCount;

        // Mettre à jour les statistiques
        document.getElementById('passengerCount').textContent = `${passengerCount}/${this.ride.total_seats || this.ride.seats_available}`;

        const earningsEl = document.querySelector('[style*="Revenus prévus"] + strong');
        if (earningsEl) {
            earningsEl.textContent = `+${earnings} crédits`;
        }

        // Afficher l'itinéraire
        this.displayRoute();

        // Afficher les passagers
        this.displayPassengers();

        // Si le trajet est déjà démarré (status = 'in_progress')
        if (this.ride.status === 'in_progress') {
            this.resumeRide();
        }
    }

    displayRoute() {
        const routeContainer = document.querySelector('[class*="card-title"]:contains("Itinéraire")');
        if (!routeContainer) return;

        const cardBody = routeContainer.closest('.card').querySelector('.card-body');

        cardBody.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 0.5rem;"><strong>Départ</strong></p>
                <p style="margin: 0; color: var(--text-secondary);">${this.ride.departure_address}</p>
            </div>
            <div style="border-left: 3px dashed var(--border-medium); height: 40px; margin-left: 1rem;"></div>
            <div>
                <p style="margin-bottom: 0.5rem;"><strong>Arrivée</strong></p>
                <p style="margin: 0; color: var(--text-secondary);">${this.ride.arrival_address}</p>
            </div>
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-tertiary);">Départ prévu:</span>
                    <strong>${this.formatDateTime(this.ride.departure_datetime)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-tertiary);">Arrivée prévue:</span>
                    <strong>${this.formatDateTime(this.ride.arrival_datetime)}</strong>
                </div>
            </div>
        `;
    }

    displayPassengers() {
        const passengersContainer = document.querySelector('.card-header .card-title:contains("Passagers")');
        if (!passengersContainer) return;

        passengersContainer.textContent = `Passagers (${this.passengers.length})`;

        const cardBody = passengersContainer.closest('.card').querySelector('.card-body');

        if (this.passengers.length === 0) {
            cardBody.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                    <p>Aucun passager pour ce trajet</p>
                </div>
            `;
            return;
        }

        const html = this.passengers.map(passenger => {
            const isPickedUp = this.state.pickedUp[passenger.passenger_id];
            return `
                <div class="card mb-md" style="border: 2px solid var(--border-light);">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                <img src="${passenger.passenger_photo || 'https://i.pravatar.cc/60?img=' + passenger.passenger_id}"
                                     alt="Passager"
                                     style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--primary-green);">
                                <div>
                                    <h4 style="margin: 0 0 0.25rem 0;">${passenger.passenger_pseudo || 'Passager'}</h4>
                                    <p style="margin: 0; color: var(--text-tertiary); font-size: var(--font-size-sm);">
                                        @${passenger.passenger_pseudo} • ${passenger.credits_amount} crédits
                                    </p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-${isPickedUp ? 'secondary' : 'success'} btn-sm"
                                        id="pickup-${passenger.passenger_id}"
                                        onclick="window.rideActiveManager.markPickedUp(${passenger.passenger_id})"
                                        ${isPickedUp ? 'disabled' : ''}>
                                    <span>${isPickedUp ? '✓' : '→'}</span>
                                    <span>${isPickedUp ? 'Embarqué' : 'Embarquer'}</span>
                                </button>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                            <p style="margin: 0; color: var(--text-tertiary); font-size: var(--font-size-sm);">
                                Montée prévue: ${this.ride.departure_address}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        cardBody.innerHTML = html;
    }

    markPickedUp(passengerId) {
        this.state.pickedUp[passengerId] = true;

        const button = document.getElementById(`pickup-${passengerId}`);
        if (button) {
            button.innerHTML = '<span>✓</span><span>Embarqué</span>';
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
            button.disabled = true;
        }

        // Vérifier si tous sont embarqués
        const allPickedUp = Object.values(this.state.pickedUp).every(v => v);
        if (allPickedUp && !this.state.started) {
            this.showSuccess('Tous les passagers sont à bord ! Vous pouvez démarrer le trajet.');
        }
    }

    async startRide() {
        // Vérifier que tous les passagers sont embarqués
        const allPickedUp = Object.values(this.state.pickedUp).every(v => v);

        if (!allPickedUp && this.passengers.length > 0) {
            if (!confirm('Tous les passagers ne sont pas encore marqués comme embarqués. Voulez-vous quand même démarrer le trajet ?')) {
                return;
            }
        }

        try {
            // Appel API pour démarrer le trajet
            const response = await window.apiClient.post(`/rides/${this.rideId}/start`, {
                start_datetime: new Date().toISOString()
            });

            if (response.success) {
                this.state.started = true;
                this.state.startTime = new Date();

                // Mettre à jour l'interface
                document.getElementById('preStartActions').style.display = 'none';
                document.getElementById('duringRideActions').style.display = 'block';
                document.getElementById('rideStatus').textContent = 'Trajet en cours';

                // Démarrer le chronomètre
                this.startTimer();

                // Simuler la progression
                this.startProgressSimulation();

                this.showSuccess('Trajet démarré ! Bonne route et conduisez prudemment.');
            } else {
                throw new Error(response.message || 'Erreur lors du démarrage');
            }
        } catch (error) {
            console.error('Error starting ride:', error);
            alert('Erreur : ' + error.message);
        }
    }

    resumeRide() {
        // Si le trajet est déjà en cours, reprendre le chronomètre
        this.state.started = true;
        this.state.startTime = new Date(this.ride.actual_start_datetime || this.ride.departure_datetime);

        document.getElementById('preStartActions').style.display = 'none';
        document.getElementById('duringRideActions').style.display = 'block';
        document.getElementById('rideStatus').textContent = 'Trajet en cours';

        this.startTimer();
        this.startProgressSimulation();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now - this.state.startTime) / 1000);

            const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');

            document.getElementById('timer').textContent = `${hours}:${minutes}:${seconds}`;
        }, 1000);
    }

    startProgressSimulation() {
        setInterval(() => {
            if (this.state.started && this.state.progress < 100) {
                this.state.progress += 0.5;
                document.getElementById('progressBar').style.width = this.state.progress + '%';
                document.getElementById('progressPercent').textContent = Math.floor(this.state.progress) + '%';
            }
        }, 3000);
    }

    async completeRide() {
        if (!this.state.started) {
            alert('Vous devez d\'abord démarrer le trajet');
            return;
        }

        if (this.state.progress < 80) {
            if (!confirm(`Vous n'avez parcouru que ${Math.floor(this.state.progress)}% du trajet. Voulez-vous vraiment le terminer ?`)) {
                return;
            }
        }

        try {
            // Calculer les gains
            const passengerCount = this.passengers.length;
            const earningsPerPassenger = this.ride.price_credits - 2; // 2 crédits plateforme
            const totalEarnings = earningsPerPassenger * passengerCount;

            // Appel API pour terminer le trajet
            const response = await window.apiClient.post(`/rides/${this.rideId}/complete`, {
                completion_datetime: new Date().toISOString(),
                distance_km: this.ride.distance_km || 0
            });

            if (response.success) {
                // Arrêter le chronomètre
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }

                // Mettre à jour les crédits de l'utilisateur
                if (response.new_credits !== undefined) {
                    this.user.credits = response.new_credits;
                    window.authManager.updateUser(this.user);
                }

                alert(`🎉 Félicitations ! Trajet terminé avec succès.\n\n💰 +${totalEarnings} crédits ajoutés à votre compte\n🌱 CO₂ économisé grâce au covoiturage\n\nLes passagers vont recevoir une demande d'avis.`);

                // Rediriger vers l'historique
                setTimeout(() => {
                    window.location.href = 'history.html';
                }, 2000);
            } else {
                throw new Error(response.message || 'Erreur lors de la fin du trajet');
            }
        } catch (error) {
            console.error('Error completing ride:', error);
            alert('Erreur : ' + error.message);
        }
    }

    async reportIssue() {
        const issue = prompt('Décrivez l\'incident ou le problème:');
        if (!issue) return;

        try {
            // TODO: Créer endpoint pour les signalements
            // Pour l'instant, juste une alerte
            this.showSuccess('Incident signalé. Un employé EcoRide vous contactera rapidement.');
        } catch (error) {
            console.error('Error reporting issue:', error);
        }
    }

    async cancelRideFromActive() {
        if (this.state.started) {
            alert('Impossible d\'annuler un trajet déjà démarré. Veuillez signaler un incident si nécessaire.');
            return;
        }

        const reason = prompt('Raison de l\'annulation:');
        if (!reason) return;

        if (!confirm('Êtes-vous sûr de vouloir annuler ce trajet ? Les passagers seront remboursés.')) {
            return;
        }

        try {
            const response = await window.apiClient.delete(`/rides/${this.rideId}`);

            if (response.success) {
                this.showSuccess('Trajet annulé. Les passagers ont été notifiés et remboursés.');
                setTimeout(() => {
                    window.location.href = 'history.html';
                }, 2000);
            } else {
                throw new Error(response.message || 'Erreur lors de l\'annulation');
            }
        } catch (error) {
            console.error('Error cancelling ride:', error);
            alert('Erreur : ' + error.message);
        }
    }

    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
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
const rideActiveManager = new RideActiveManager();
window.rideActiveManager = rideActiveManager;

// Fonctions globales pour les événements onclick
function startRide() {
    window.rideActiveManager.startRide();
}

function completeRide() {
    window.rideActiveManager.completeRide();
}

function reportIssue() {
    window.rideActiveManager.reportIssue();
}

function cancelRideFromActive() {
    window.rideActiveManager.cancelRideFromActive();
}

function openNavigation() {
    if (window.rideActiveManager.ride) {
        const destination = encodeURIComponent(window.rideActiveManager.ride.arrival_address);
        window.open(`https://maps.google.com/?daddr=${destination}`, '_blank');
    }
}

function pauseRide() {
    const reason = prompt('Raison de l\'arrêt (optionnel):\n- Pause déjeuner\n- Problème technique\n- Autre');
    if (reason !== null) {
        alert(`Pause enregistrée.\nRaison: ${reason || 'Non spécifiée'}\n\nLes passagers seront notifiés.`);
    }
}
