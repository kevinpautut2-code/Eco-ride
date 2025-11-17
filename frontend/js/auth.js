/**
 * EcoRide - Gestion de l'authentification
 * Login, Register, Session Management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Charger l'utilisateur depuis le localStorage
        this.loadCurrentUser();

        // Initialiser les formulaires
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            this.setupRegisterForm(registerForm);
        }

        // Vérifier si on est sur une page protégée
        this.checkProtectedPage();
    }

    setupRegisterForm(form) {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Validation du mot de passe en temps réel
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
            });
        }

        // Vérification de la confirmation
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.checkPasswordMatch();
            });
        }

        form.addEventListener('submit', (e) => this.handleRegister(e));
    }

    /**
     * Validation du mot de passe avec affichage des critères
     */
    validatePassword(password) {
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        // Mettre à jour l'affichage
        Object.keys(checks).forEach(key => {
            const element = document.getElementById(`check-${key}`);
            if (element) {
                element.style.color = checks[key] ? 'var(--success)' : 'var(--text-tertiary)';
                element.style.fontWeight = checks[key] ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)';
            }
        });

        return Object.values(checks).every(v => v);
    }

    /**
     * Vérifier que les mots de passe correspondent
     */
    checkPasswordMatch() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const error = document.getElementById('confirmPasswordError');

        if (confirmPassword.value && password.value !== confirmPassword.value) {
            error.style.display = 'block';
            confirmPassword.setCustomValidity('Les mots de passe ne correspondent pas');
        } else {
            error.style.display = 'none';
            confirmPassword.setCustomValidity('');
        }
    }

    /**
     * Gérer la connexion
     */
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        try {
            // Simulation d'authentification (à remplacer par un vrai appel API)
            const user = await this.authenticateUser(email, password);

            if (user) {
                // Sauvegarder l'utilisateur
                this.saveUser(user, rememberMe);

                // Afficher succès
                this.showAlert('Connexion réussie ! Redirection...', 'success');

                // Rediriger selon le rôle
                setTimeout(() => {
                    this.redirectAfterLogin(user);
                }, 1500);
            } else {
                this.showAlert('Email ou mot de passe incorrect', 'error');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            this.showAlert('Une erreur est survenue lors de la connexion', 'error');
        }
    }

    /**
     * Gérer l'inscription
     */
    async handleRegister(e) {
        e.preventDefault();

        const pseudo = document.getElementById('pseudo').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        // Validations
        if (!this.validatePassword(password)) {
            this.showAlert('Le mot de passe ne respecte pas les critères de sécurité', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAlert('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (!acceptTerms) {
            this.showAlert('Vous devez accepter les conditions générales', 'error');
            return;
        }

        try {
            // Simulation de création de compte (à remplacer par un vrai appel API)
            const user = await this.registerUser({ pseudo, email, password });

            if (user) {
                this.showAlert('Compte créé avec succès ! Vous allez être redirigé...', 'success');

                // Sauvegarder l'utilisateur
                this.saveUser(user, true);

                // Rediriger après 2 secondes
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                this.showAlert('Erreur lors de la création du compte', 'error');
            }
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            this.showAlert(error.message || 'Une erreur est survenue lors de l\'inscription', 'error');
        }
    }

    /**
     * Authentifier via l'API
     */
    async authenticateUser(email, password) {
        try {
            const response = await window.apiClient.login(email, password);

            if (response.success && response.user) {
                return response.user;
            }

            return null;
        } catch (error) {
            console.error('Erreur API login:', error);
            throw error;
        }
    }

    /**
     * Créer un utilisateur via l'API
     */
    async registerUser(userData) {
        try {
            const response = await window.apiClient.register({
                pseudo: userData.pseudo,
                email: userData.email,
                password: userData.password,
                user_type: 'both'
            });

            if (response.success && response.user) {
                return response.user;
            }

            throw new Error(response.error || 'Erreur lors de la création du compte');
        } catch (error) {
            console.error('Erreur API register:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder l'utilisateur connecté
     */
    saveUser(user, rememberMe) {
        this.currentUser = user;

        // Sauvegarder dans localStorage ou sessionStorage
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('ecoride_user', JSON.stringify(user));
        storage.setItem('ecoride_token', this.generateToken(user));
    }

    /**
     * Charger l'utilisateur connecté
     */
    loadCurrentUser() {
        // Vérifier d'abord localStorage puis sessionStorage
        const userStr = localStorage.getItem('ecoride_user') || sessionStorage.getItem('ecoride_user');

        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                this.updateUIForLoggedInUser();
            } catch (error) {
                console.error('Erreur lors du chargement de l\'utilisateur:', error);
                this.logout();
            }
        }
    }

    /**
     * Générer un token simple (à remplacer par JWT)
     */
    generateToken(user) {
        return btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            timestamp: Date.now()
        }));
    }

    /**
     * Vérifier si l'utilisateur est connecté
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtenir l'utilisateur actuel
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Déconnexion
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('ecoride_user');
        localStorage.removeItem('ecoride_token');
        sessionStorage.removeItem('ecoride_user');
        sessionStorage.removeItem('ecoride_token');

        window.location.href = 'index.html';
    }

    /**
     * Rediriger après connexion selon le rôle
     */
    redirectAfterLogin(user) {
        switch (user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'employee':
                window.location.href = 'employee-dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }

    /**
     * Vérifier si on est sur une page protégée
     */
    checkProtectedPage() {
        const protectedPages = ['dashboard.html', 'admin-dashboard.html', 'employee-dashboard.html', 'create-ride.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (protectedPages.includes(currentPage) && !this.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + currentPage;
        }
    }

    /**
     * Mettre à jour l'UI pour un utilisateur connecté
     */
    updateUIForLoggedInUser() {
        // Mettre à jour le bouton de connexion
        const loginBtn = document.querySelector('a[href="login.html"]');
        if (loginBtn && this.currentUser) {
            loginBtn.href = 'dashboard.html';
            loginBtn.innerHTML = `
                <span>${this.currentUser.photo_url ? '<img src="' + this.currentUser.photo_url + '" style="width: 24px; height: 24px; border-radius: 50%;">' : '👤'}</span>
                <span>${this.currentUser.pseudo}</span>
            `;
        }
    }

    /**
     * Afficher une alerte
     */
    showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.marginBottom = '1rem';
        alert.innerHTML = `
            <div class="alert-icon">${icons[type]}</div>
            <div class="alert-content">
                <div class="alert-text">${message}</div>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(alert);

        // Retirer l'alerte après 5 secondes (sauf si c'est un succès qui redirige)
        if (type !== 'success') {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
    }
}

/**
 * Connexion rapide pour les comptes de démonstration
 */
window.quickLogin = function(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
};

// Initialiser le gestionnaire d'authentification
const authManager = new AuthManager();

// Exporter pour utilisation globale
window.authManager = authManager;
