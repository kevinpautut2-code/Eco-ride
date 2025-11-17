/**
 * EcoRide - Création de trajet
 * Gestion du formulaire de création de covoiturage
 */

class CreateRideManager {
    constructor() {
        this.form = document.getElementById('createRideForm');
        this.vehicleSelect = document.getElementById('vehicle');
        this.user = null;
        this.vehicles = [];

        this.init();
    }

    async init() {
        // Vérifier l'authentification
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=create-ride.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();

        // Charger les véhicules
        await this.loadVehicles();

        // Configurer le formulaire
        this.setupForm();

        // Définir les dates minimum (aujourd'hui)
        const now = new Date();
        const minDateTime = now.toISOString().slice(0, 16);
        document.getElementById('departureDateTime').min = minDateTime;
        document.getElementById('arrivalDateTime').min = minDateTime;
    }

    async loadVehicles() {
        try {
            const response = await window.apiClient.get('/vehicles');

            if (response.success && response.vehicles) {
                this.vehicles = response.vehicles;
                this.populateVehicleSelect();
            } else {
                console.warn('No vehicles found');
                this.showNoVehicleMessage();
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.showNoVehicleMessage();
        }
    }

    populateVehicleSelect() {
        // Nettoyer les options existantes
        this.vehicleSelect.innerHTML = '<option value="">Sélectionner un véhicule</option>';

        // Ajouter les véhicules de l'utilisateur
        this.vehicles.forEach(vehicle => {
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = `${vehicle.brand} ${vehicle.model} - ${vehicle.color}`;

            // Ajouter badge écologique si électrique
            if (vehicle.energy_type === 'electric') {
                option.textContent += ' ⚡';
            }

            option.dataset.seats = vehicle.seats;
            option.dataset.isEcological = vehicle.energy_type === 'electric';

            this.vehicleSelect.appendChild(option);
        });

        // Option pour ajouter un nouveau véhicule
        const addOption = document.createElement('option');
        addOption.value = 'add_new';
        addOption.textContent = '+ Ajouter un nouveau véhicule';
        this.vehicleSelect.appendChild(addOption);
    }

    showNoVehicleMessage() {
        this.vehicleSelect.innerHTML = '<option value="">Aucun véhicule enregistré</option>';
        const addOption = document.createElement('option');
        addOption.value = 'add_new';
        addOption.textContent = '+ Ajouter votre premier véhicule';
        this.vehicleSelect.appendChild(addOption);
    }

    setupForm() {
        // Gérer la sélection de véhicule
        this.vehicleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'add_new') {
                // Rediriger vers la page de gestion des véhicules
                if (confirm('Vous allez être redirigé vers votre espace pour ajouter un véhicule. Voulez-vous continuer ?')) {
                    window.location.href = 'dashboard.html?tab=vehicles';
                } else {
                    e.target.value = '';
                }
            } else if (e.target.value) {
                const selectedOption = e.target.selectedOptions[0];
                const seats = parseInt(selectedOption.dataset.seats);
                document.getElementById('seats').max = seats;
            }
        });

        // Valider les dates
        document.getElementById('departureDateTime').addEventListener('change', () => {
            this.validateDates();
        });

        document.getElementById('arrivalDateTime').addEventListener('change', () => {
            this.validateDates();
        });

        // Calculer le récapitulatif en temps réel
        document.getElementById('price').addEventListener('input', () => {
            this.updateSummary();
        });

        document.getElementById('seats').addEventListener('input', () => {
            this.updateSummary();
        });

        // Soumettre le formulaire
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    validateDates() {
        const departureInput = document.getElementById('departureDateTime');
        const arrivalInput = document.getElementById('arrivalDateTime');

        const departure = new Date(departureInput.value);
        const arrival = new Date(arrivalInput.value);

        if (departure && arrival) {
            if (arrival <= departure) {
                arrivalInput.setCustomValidity('L\'heure d\'arrivée doit être après l\'heure de départ');
                return false;
            } else {
                arrivalInput.setCustomValidity('');

                // Calculer la durée
                const duration = (arrival - departure) / (1000 * 60 * 60); // en heures
                document.getElementById('summaryDuration').textContent = `${duration.toFixed(1)}h`;

                return true;
            }
        }
        return true;
    }

    updateSummary() {
        const price = parseInt(document.getElementById('price').value) || 0;
        const seats = parseInt(document.getElementById('seats').value) || 0;

        // 2 crédits pris par la plateforme (par passager)
        const platformFee = 2;
        const driverEarnsPerPassenger = Math.max(0, price - platformFee);
        const maxEarnings = driverEarnsPerPassenger * seats;

        document.getElementById('displayPrice').textContent = `${price} crédits`;
        document.getElementById('driverEarnings').textContent = `${driverEarnsPerPassenger} crédits`;
        document.getElementById('maxSeats').textContent = seats;
        document.getElementById('maxEarnings').textContent = `${maxEarnings} crédits`;
    }

    async handleSubmit() {
        if (!this.validateDates()) {
            alert('Veuillez vérifier les dates de départ et d\'arrivée');
            return;
        }

        const vehicleId = this.vehicleSelect.value;

        if (!vehicleId || vehicleId === 'add_new') {
            alert('Veuillez sélectionner un véhicule');
            return;
        }

        // Récupérer les données du formulaire
        const formData = {
            vehicle_id: parseInt(vehicleId),
            departure_city: document.getElementById('departureCity').value.trim(),
            departure_address: document.getElementById('departureAddress').value.trim(),
            departure_datetime: document.getElementById('departureDateTime').value,
            arrival_city: document.getElementById('arrivalCity').value.trim(),
            arrival_address: document.getElementById('arrivalAddress').value.trim(),
            arrival_datetime: document.getElementById('arrivalDateTime').value,
            price_credits: parseInt(document.getElementById('price').value),
            seats_available: parseInt(document.getElementById('seats').value),
            preferences: this.getPreferences()
        };

        // Désactiver le bouton de soumission
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création en cours...';

        try {
            const response = await window.apiClient.post('/rides', formData);

            if (response.success) {
                // Afficher succès
                this.showSuccess('Trajet créé avec succès !');

                // Rediriger vers le dashboard après 2 secondes
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                throw new Error(response.message || 'Erreur lors de la création du trajet');
            }
        } catch (error) {
            console.error('Error creating ride:', error);
            alert('Erreur : ' + error.message);

            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.textContent = 'Créer le trajet';
        }
    }

    getPreferences() {
        return {
            smoking: document.getElementById('prefSmoking')?.checked || false,
            pets: document.getElementById('prefPets')?.checked || false,
            music: document.getElementById('prefMusic')?.checked || false,
            conversation: document.getElementById('prefConversation')?.value || 'depends'
        };
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

        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
}

// Initialiser
const createRideManager = new CreateRideManager();
window.createRideManager = createRideManager;
