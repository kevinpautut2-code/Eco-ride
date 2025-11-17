/**
 * EcoRide - Dashboard Utilisateur
 */

class DashboardManager {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        // Vérifier l'authentification
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();
        this.loadDashboard();
    }

    loadDashboard() {
        // Afficher les informations utilisateur
        document.getElementById('userName').textContent = this.user.pseudo;
        document.getElementById('userCredits').textContent = this.user.credits;

        // Afficher le type de compte actif
        this.updateUserTypeCards();

        // Charger les statistiques
        this.loadStats();

        // Charger les trajets à venir
        this.loadUpcomingRides();

        // Gérer l'accès à la création de trajet
        if (this.user.user_type === 'passenger') {
            const createCard = document.getElementById('createRideCard');
            if (createCard) {
                createCard.style.opacity = '0.5';
                createCard.onclick = (e) => {
                    e.preventDefault();
                    alert('Vous devez être chauffeur pour créer un trajet. Changez votre type de compte dans les paramètres.');
                };
            }
        }
    }

    updateUserTypeCards() {
        const cards = {
            passenger: document.getElementById('passengerCard'),
            driver: document.getElementById('driverCard'),
            both: document.getElementById('bothCard')
        };

        Object.keys(cards).forEach(type => {
            if (cards[type]) {
                if (this.user.user_type === type) {
                    cards[type].style.border = '2px solid var(--primary-green)';
                    cards[type].style.background = 'var(--bg-hover)';
                } else {
                    cards[type].style.border = '2px solid var(--border-light)';
                    cards[type].style.background = '';
                }
            }
        });
    }

    loadStats() {
        // Simuler des statistiques
        document.getElementById('totalRidesAsDriver').textContent = Math.floor(Math.random() * 20);
        document.getElementById('totalRidesAsPassenger').textContent = Math.floor(Math.random() * 30);
        document.getElementById('averageRating').textContent = (4 + Math.random()).toFixed(1);
    }

    loadUpcomingRides() {
        // Simuler des trajets à venir
        const mockRides = [];

        if (mockRides.length > 0) {
            // Afficher les trajets
            const html = mockRides.map(ride => this.createRideCard(ride)).join('');
            document.getElementById('upcomingRides').innerHTML = html;
        }
    }

    createRideCard(ride) {
        return `
            <div class="ride-card" style="margin-bottom: 1rem;">
                <div class="ride-card-header">
                    <strong>${ride.departure} → ${ride.arrival}</strong>
                    <span>${new Date(ride.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="ride-card-body">
                    <div style="display: flex; justify-content: space-between;">
                        <span>${ride.time}</span>
                        <span>${ride.price} crédits</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Fonctions globales
window.setUserType = function(type) {
    const user = window.authManager.getCurrentUser();
    user.user_type = type;

    // Sauvegarder
    const storage = localStorage.getItem('ecoride_user') ? localStorage : sessionStorage;
    storage.setItem('ecoride_user', JSON.stringify(user));

    // Recharger
    location.reload();
};

window.showProfileSettings = function() {
    const modal = document.getElementById('profileModal');
    const user = window.authManager.getCurrentUser();

    document.getElementById('profilePseudo').value = user.pseudo;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileUserType').value = user.user_type;
    document.getElementById('profilePhoto').src = user.photo_url;

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
};

window.closeProfileModal = function() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
};

window.saveProfile = function() {
    const user = window.authManager.getCurrentUser();
    user.pseudo = document.getElementById('profilePseudo').value;
    user.email = document.getElementById('profileEmail').value;
    user.user_type = document.getElementById('profileUserType').value;

    const storage = localStorage.getItem('ecoride_user') ? localStorage : sessionStorage;
    storage.setItem('ecoride_user', JSON.stringify(user));

    window.closeProfileModal();
    location.reload();
};

// Initialiser
const dashboardManager = new DashboardManager();
