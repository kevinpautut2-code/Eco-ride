/**
 * EcoRide - Module API
 * Gestion des appels à l'API backend
 */

const API_BASE_URL = 'http://localhost:8000';

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('ecoride_token') || null;
    }

    /**
     * Effectuer une requête HTTP
     * @param {string} endpoint
     * @param {object} options
     * @returns {Promise}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers,
            },
        };

        if (options.body && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // === AUTH ===

    /**
     * Connexion utilisateur
     */
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (data.success && data.token) {
            this.token = data.token;
            localStorage.setItem('ecoride_token', data.token);
        }

        return data;
    }

    /**
     * Inscription utilisateur
     */
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: userData
        });

        return data;
    }

    /**
     * Déconnexion
     */
    logout() {
        this.token = null;
        localStorage.removeItem('ecoride_token');
        localStorage.removeItem('ecoride_user');
        sessionStorage.removeItem('ecoride_user');
    }

    // === RIDES ===

    /**
     * Rechercher des trajets
     * @param {object} filters - Filtres de recherche
     */
    async searchRides(filters = {}) {
        const params = new URLSearchParams();

        if (filters.departure_city) params.append('departure_city', filters.departure_city);
        if (filters.arrival_city) params.append('arrival_city', filters.arrival_city);
        if (filters.date) params.append('date', filters.date);
        if (filters.max_price) params.append('max_price', filters.max_price);
        if (filters.ecological_only) params.append('ecological_only', 'true');
        if (filters.min_rating) params.append('min_rating', filters.min_rating);

        const query = params.toString() ? `?${params.toString()}` : '';
        const data = await this.request(`/rides${query}`);

        return data;
    }

    /**
     * Obtenir les détails d'un trajet
     * @param {number} rideId
     */
    async getRideDetails(rideId) {
        const data = await this.request(`/rides/${rideId}`);
        return data;
    }

    /**
     * Créer un nouveau trajet
     * @param {object} rideData
     */
    async createRide(rideData) {
        const data = await this.request('/rides', {
            method: 'POST',
            body: rideData
        });

        return data;
    }

    /**
     * Réserver un trajet
     * @param {number} rideId
     * @param {number} userId
     */
    async bookRide(rideId, userId) {
        const data = await this.request(`/rides/${rideId}/book`, {
            method: 'POST',
            body: { user_id: userId }
        });

        return data;
    }

    // === USERS ===

    /**
     * Obtenir le profil d'un utilisateur
     * @param {number} userId
     */
    async getUserProfile(userId) {
        const data = await this.request(`/users/${userId}`);
        return data;
    }

    /**
     * Obtenir les trajets d'un utilisateur
     * @param {number} userId
     * @param {string} type - 'driver' ou 'passenger'
     */
    async getUserRides(userId, type = 'driver') {
        const data = await this.request(`/users/${userId}/rides?type=${type}`);
        return data;
    }

    // === VEHICLES ===

    /**
     * Obtenir la liste des véhicules
     * @param {number} userId - Optionnel, pour filtrer par utilisateur
     */
    async getVehicles(userId = null) {
        const query = userId ? `?user_id=${userId}` : '';
        const data = await this.request(`/vehicles${query}`);
        return data;
    }
}

// Créer une instance globale
window.apiClient = new APIClient();
