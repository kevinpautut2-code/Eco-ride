/**
 * Admin Dashboard Manager
 * Handles platform statistics, charts, employee and user management
 */

class AdminDashboardManager {
    constructor() {
        this.user = null;
        this.stats = {
            activeUsers: 0,
            tripsThisMonth: 0,
            creditsEarned: 0,
            ecoPercentage: 0,
            totalCredits: 0
        };
        this.employees = [];
        this.users = [];
        this.charts = {
            tripsPerDay: null,
            creditsPerDay: null
        };
    }

    async init() {
        // Check authentication and admin role
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();

        // Verify admin role
        if (this.user.role !== 'admin') {
            alert('Accès refusé. Cette page est réservée aux administrateurs.');
            window.location.href = 'dashboard.html';
            return;
        }

        await this.loadData();
        this.initializeCharts();
        this.attachEventHandlers();
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadEmployees(),
                this.loadUsers(),
                this.loadChartsData()
            ]);
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadStats() {
        try {
            const response = await window.apiClient.get('/admin/stats');

            if (response.success) {
                this.stats = response.stats;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Use demo data if API not implemented
            this.showDemoStats();
        }
    }

    async loadEmployees() {
        try {
            const response = await window.apiClient.get('/admin/employees');

            if (response.success) {
                this.employees = response.employees || [];
                this.renderEmployees();
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            this.showDemoEmployees();
        }
    }

    async loadUsers() {
        try {
            const response = await window.apiClient.get('/admin/users');

            if (response.success) {
                this.users = response.users || [];
                this.renderUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showDemoUsers();
        }
    }

    async loadChartsData() {
        try {
            const response = await window.apiClient.get('/admin/charts-data');

            if (response.success) {
                this.chartsData = response.data;
            }
        } catch (error) {
            console.error('Error loading charts data:', error);
            // Use demo data
            this.generateDemoChartsData();
        }
    }

    updateStatsDisplay() {
        const statsElements = {
            activeUsers: document.querySelector('.stat-value'),
            tripsThisMonth: document.querySelectorAll('.stat-value')[1],
            creditsEarned: document.querySelectorAll('.stat-value')[2],
            ecoPercentage: document.querySelectorAll('.stat-value')[3]
        };

        if (statsElements.activeUsers) {
            statsElements.activeUsers.textContent = this.formatNumber(this.stats.activeUsers);
        }
        if (statsElements.tripsThisMonth) {
            statsElements.tripsThisMonth.textContent = this.formatNumber(this.stats.tripsThisMonth);
        }
        if (statsElements.creditsEarned) {
            statsElements.creditsEarned.textContent = this.formatNumber(this.stats.creditsEarned);
        }
        if (statsElements.ecoPercentage) {
            statsElements.ecoPercentage.textContent = this.stats.ecoPercentage + '%';
        }
    }

    initializeCharts() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = () => this.createCharts();
            document.head.appendChild(script);
        } else {
            this.createCharts();
        }
    }

    createCharts() {
        this.createTripsChart();
        this.createCreditsChart();
    }

    createTripsChart() {
        const container = document.querySelector('.card-body > div[style*="height: 300px"]');
        if (!container) return;

        // Clear placeholder
        container.innerHTML = '<canvas id="tripsChart"></canvas>';

        const ctx = document.getElementById('tripsChart');
        if (!ctx) return;

        const labels = this.chartsData?.tripsPerDay?.labels || this.getLast7Days();
        const data = this.chartsData?.tripsPerDay?.data || [12, 19, 15, 25, 22, 30, 28];

        this.charts.tripsPerDay = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Trajets',
                    data: data,
                    borderColor: 'rgb(76, 175, 80)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5
                        }
                    }
                }
            }
        });
    }

    createCreditsChart() {
        const containers = document.querySelectorAll('.card-body > div[style*="height: 300px"]');
        const container = containers[1];
        if (!container) return;

        // Clear placeholder
        container.innerHTML = '<canvas id="creditsChart"></canvas>';

        const ctx = document.getElementById('creditsChart');
        if (!ctx) return;

        const labels = this.chartsData?.creditsPerDay?.labels || this.getLast7Days();
        const data = this.chartsData?.creditsPerDay?.data || [145, 230, 180, 310, 265, 380, 340];

        this.charts.creditsPerDay = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Crédits',
                    data: data,
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: 'rgb(33, 150, 243)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 50
                        }
                    }
                }
            }
        });
    }

    getLast7Days() {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        }

        return days;
    }

    renderEmployees() {
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;

        if (this.employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                        Aucun employé créé
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.employees.map(employee => `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 1rem;">${this.escapeHtml(employee.pseudo || employee.username)}</td>
                <td style="padding: 1rem;">${this.escapeHtml(employee.email)}</td>
                <td style="padding: 1rem;">
                    <span class="badge ${employee.is_suspended ? 'badge-danger' : 'badge-success'}">
                        ${employee.is_suspended ? 'Suspendu' : 'Actif'}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-sm ${employee.is_suspended ? 'btn-success' : 'btn-danger'}"
                            onclick="window.adminDashboard.toggleEmployeeSuspension(${employee.id}, ${employee.is_suspended ? 1 : 0})">
                        ${employee.is_suspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderUsers() {
        const tables = document.querySelectorAll('table');
        const tbody = tables[1]?.querySelector('tbody');
        if (!tbody) return;

        const displayUsers = this.filteredUsers || this.users;

        if (displayUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                        Aucun utilisateur trouvé
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = displayUsers.slice(0, 20).map(user => `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 1rem;">${this.escapeHtml(user.pseudo || user.username)}</td>
                <td style="padding: 1rem;">${this.escapeHtml(user.email)}</td>
                <td style="padding: 1rem;">${this.getUserTypeLabel(user.role)}</td>
                <td style="padding: 1rem;">${user.credits || 0}</td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-sm ${user.is_suspended ? 'btn-success' : 'btn-danger'}"
                            onclick="window.adminDashboard.toggleUserSuspension(${user.id}, ${user.is_suspended ? 1 : 0})">
                        ${user.is_suspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getUserTypeLabel(role) {
        const labels = {
            'admin': 'Administrateur',
            'employee': 'Employé',
            'user': 'Utilisateur'
        };
        return labels[role] || 'Utilisateur';
    }

    attachEventHandlers() {
        // Create employee button
        const createEmployeeBtn = document.querySelector('.btn.btn-primary');
        if (createEmployeeBtn) {
            createEmployeeBtn.onclick = () => this.showCreateEmployeeForm();
        }

        // User search
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleUserSearch(e.target.value));
        }
    }

    showCreateEmployeeForm() {
        const pseudo = prompt('Pseudo de l\'employé:');
        if (!pseudo) return;

        const email = prompt('Email de l\'employé:');
        if (!email) return;

        const password = prompt('Mot de passe temporaire:');
        if (!password || password.length < 8) {
            alert('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        this.createEmployee({ pseudo, email, password });
    }

    async createEmployee(data) {
        try {
            const response = await window.apiClient.post('/admin/employees', {
                ...data,
                created_by: this.user.id
            });

            if (response.success) {
                this.showSuccess('Employé créé avec succès');
                this.employees.push(response.employee);
                this.renderEmployees();
            } else {
                this.showError(response.error || 'Erreur lors de la création de l\'employé');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            this.showError('Erreur lors de la création de l\'employé');
        }
    }

    async toggleEmployeeSuspension(employeeId, currentlySuspended) {
        const action = currentlySuspended ? 'réactiver' : 'suspendre';
        const confirm = window.confirm(`Voulez-vous vraiment ${action} cet employé ?`);

        if (!confirm) return;

        try {
            const response = await window.apiClient.post(`/admin/employees/${employeeId}/suspend`, {
                is_suspended: !currentlySuspended,
                suspended_by: this.user.id
            });

            if (response.success) {
                this.showSuccess(`Employé ${currentlySuspended ? 'réactivé' : 'suspendu'} avec succès`);

                // Update local data
                const employee = this.employees.find(e => e.id === employeeId);
                if (employee) {
                    employee.is_suspended = !currentlySuspended;
                }

                this.renderEmployees();
            } else {
                this.showError(response.error || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Error toggling employee suspension:', error);
            this.showError('Erreur lors de la modification');
        }
    }

    async toggleUserSuspension(userId, currentlySuspended) {
        const action = currentlySuspended ? 'réactiver' : 'suspendre';
        const confirm = window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`);

        if (!confirm) return;

        try {
            const response = await window.apiClient.post(`/admin/users/${userId}/suspend`, {
                is_suspended: !currentlySuspended,
                suspended_by: this.user.id,
                reason: prompt('Raison de la suspension (optionnel):')
            });

            if (response.success) {
                this.showSuccess(`Utilisateur ${currentlySuspended ? 'réactivé' : 'suspendu'} avec succès`);

                // Update local data
                const user = this.users.find(u => u.id === userId);
                if (user) {
                    user.is_suspended = !currentlySuspended;
                }

                this.renderUsers();
            } else {
                this.showError(response.error || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Error toggling user suspension:', error);
            this.showError('Erreur lors de la modification');
        }
    }

    handleUserSearch(query) {
        if (!query || query.trim().length === 0) {
            this.filteredUsers = null;
            this.renderUsers();
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredUsers = this.users.filter(user =>
            (user.pseudo && user.pseudo.toLowerCase().includes(lowerQuery)) ||
            (user.username && user.username.toLowerCase().includes(lowerQuery)) ||
            (user.email && user.email.toLowerCase().includes(lowerQuery))
        );

        this.renderUsers();
    }

    showDemoStats() {
        this.stats = {
            activeUsers: 1234,
            tripsThisMonth: 567,
            creditsEarned: 2345,
            ecoPercentage: 78,
            totalCredits: 45678
        };
        this.updateStatsDisplay();
    }

    showDemoEmployees() {
        this.employees = [
            {
                id: 1,
                pseudo: 'employe1',
                username: 'employe1',
                email: 'employe@ecoride.fr',
                is_suspended: false
            },
            {
                id: 2,
                pseudo: 'Sophie Martin',
                username: 'sophiem',
                email: 'sophie.martin@ecoride.fr',
                is_suspended: false
            }
        ];
        this.renderEmployees();
    }

    showDemoUsers() {
        this.users = [
            {
                id: 3,
                pseudo: 'chauffeur',
                username: 'chauffeur',
                email: 'chauffeur@ecoride.fr',
                role: 'user',
                credits: 150,
                is_suspended: false
            },
            {
                id: 4,
                pseudo: 'passager',
                username: 'passager',
                email: 'passager@ecoride.fr',
                role: 'user',
                credits: 50,
                is_suspended: false
            }
        ];
        this.renderUsers();
    }

    generateDemoChartsData() {
        this.chartsData = {
            tripsPerDay: {
                labels: this.getLast7Days(),
                data: [12, 19, 15, 25, 22, 30, 28]
            },
            creditsPerDay: {
                labels: this.getLast7Days(),
                data: [145, 230, 180, 310, 265, 380, 340]
            }
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }

    showSuccess(message) {
        alert(`✅ ${message}`);
    }

    showError(message) {
        alert(`❌ ${message}`);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminDashboard = new AdminDashboardManager();
        window.adminDashboard.init();
    });
} else {
    window.adminDashboard = new AdminDashboardManager();
    window.adminDashboard.init();
}
