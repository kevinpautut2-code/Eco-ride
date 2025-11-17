/**
 * Employee Dashboard Manager
 * Handles review moderation and dispute resolution
 */

class EmployeeDashboardManager {
    constructor() {
        this.user = null;
        this.pendingReviews = [];
        this.disputes = [];
        this.stats = {
            pendingReviews: 0,
            activeDisputes: 0,
            resolvedToday: 0,
            rejectedReviews: 0
        };
    }

    async init() {
        // Check authentication and employee role
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.user = window.authManager.getCurrentUser();
        
        // Verify employee or admin role
        if (this.user.role !== 'employee' && this.user.role !== 'admin') {
            alert('Accès refusé. Cette page est réservée aux employés.');
            window.location.href = 'dashboard.html';
            return;
        }

        await this.loadData();
        this.attachEventHandlers();
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadPendingReviews(),
                this.loadDisputes(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Error loading employee dashboard data:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadPendingReviews() {
        try {
            const response = await window.apiClient.get('/employee/reviews/pending');
            
            if (response.success) {
                this.pendingReviews = response.reviews || [];
                this.renderReviews();
            }
        } catch (error) {
            console.error('Error loading pending reviews:', error);
            // Show demo data if API not implemented
            this.showDemoReviews();
        }
    }

    async loadDisputes() {
        try {
            const response = await window.apiClient.get('/employee/disputes');
            
            if (response.success) {
                this.disputes = response.disputes || [];
                this.renderDisputes();
            }
        } catch (error) {
            console.error('Error loading disputes:', error);
            // Show demo data if API not implemented
            this.showDemoDisputes();
        }
    }

    async loadStats() {
        try {
            const response = await window.apiClient.get('/employee/stats');
            
            if (response.success) {
                this.stats = response.stats;
                this.updateStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Use current data for stats
            this.updateStatsFromData();
        }
    }

    updateStatsFromData() {
        this.stats.pendingReviews = this.pendingReviews.length;
        this.stats.activeDisputes = this.disputes.filter(d => d.status === 'open').length;
        this.updateStats();
    }

    updateStats() {
        document.getElementById('pendingReviews').textContent = this.stats.pendingReviews || 0;
        document.getElementById('activeDisputes').textContent = this.stats.activeDisputes || 0;
        document.getElementById('resolvedToday').textContent = this.stats.resolvedToday || 0;
        document.getElementById('rejectedReviews').textContent = this.stats.rejectedReviews || 0;
    }

    renderReviews() {
        const container = document.getElementById('reviewsList');
        
        if (!this.pendingReviews || this.pendingReviews.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    ✅ Aucun avis en attente de modération
                </div>
            `;
            return;
        }

        container.innerHTML = this.pendingReviews.map(review => this.createReviewCard(review)).join('');
    }

    createReviewCard(review) {
        const hasInappropriateContent = this.detectInappropriateContent(review.comment);
        const stars = '⭐'.repeat(Math.round(review.rating_overall || 0));
        
        return `
            <div class="card mb-md" style="border: 2px solid var(--border-medium);" data-review-id="${review.id}">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.5rem;">Avis sur le trajet #${review.ride_id}</h4>
                            <p style="color: var(--text-tertiary); margin: 0;">
                                ${review.departure_city || ''} → ${review.arrival_city || ''} • 
                                ${this.formatDate(review.created_at)}
                            </p>
                        </div>
                        <span class="badge badge-warning">En attente</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
                        <div>
                            <p style="margin-bottom: 0.5rem;"><strong>Auteur:</strong> ${review.author_pseudo || 'N/A'} (@${review.author_username || 'unknown'})</p>
                            <p style="margin-bottom: 0.5rem;"><strong>Chauffeur:</strong> ${review.driver_pseudo || 'N/A'} (@${review.driver_username || 'unknown'})</p>
                            <p style="margin-bottom: 0.5rem;"><strong>Note globale:</strong> ${stars} ${review.rating_overall || 0}/5</p>
                        </div>
                        <div>
                            <p style="margin-bottom: 0.5rem;"><strong>Ponctualité:</strong> ${this.renderStars(review.rating_punctuality)}</p>
                            <p style="margin-bottom: 0.5rem;"><strong>Conduite:</strong> ${this.renderStars(review.rating_driving)}</p>
                            <p style="margin-bottom: 0.5rem;"><strong>Véhicule:</strong> ${this.renderStars(review.rating_vehicle)}</p>
                        </div>
                    </div>

                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
                        <p style="margin: 0;"><strong>Commentaire:</strong></p>
                        <p style="margin: 0.5rem 0 0 0; ${review.rating_overall < 3 ? 'color: var(--danger-red);' : ''}">"${review.comment || 'Aucun commentaire'}"</p>
                    </div>

                    ${hasInappropriateContent ? `
                        <div class="alert alert-warning" style="margin-bottom: 1rem;">
                            ⚠️ <strong>Attention:</strong> Cet avis contient un langage potentiellement inapproprié
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-success" onclick="window.employeeDashboard.moderateReview(${review.id}, 'approve')">
                            <span>✅</span>
                            <span>Approuver</span>
                        </button>
                        <button class="btn btn-danger" onclick="window.employeeDashboard.moderateReview(${review.id}, 'reject')">
                            <span>❌</span>
                            <span>Rejeter</span>
                        </button>
                        <button class="btn btn-secondary" onclick="window.employeeDashboard.flagReview(${review.id})">
                            <span>🚩</span>
                            <span>Signaler</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const stars = '⭐'.repeat(Math.round(rating || 0));
        return `${stars} ${rating || 0}/5`;
    }

    detectInappropriateContent(text) {
        if (!text) return false;
        
        const inappropriateWords = [
            'incompétent', 'nul', 'débile', 'idiot', 'stupide', 
            'con', 'merde', 'pourri', 'minable'
        ];
        
        const lowerText = text.toLowerCase();
        return inappropriateWords.some(word => lowerText.includes(word));
    }

    async moderateReview(reviewId, action) {
        try {
            if (action === 'reject') {
                const reason = prompt('Raison du rejet:');
                if (!reason) return;
                
                const response = await window.apiClient.post(`/employee/reviews/${reviewId}/reject`, {
                    reason: reason,
                    moderated_by: this.user.id
                });
                
                if (response.success) {
                    this.showSuccess(`Avis #${reviewId} rejeté avec succès`);
                    this.stats.rejectedReviews++;
                } else {
                    this.showError(response.error || 'Erreur lors du rejet');
                    return;
                }
            } else if (action === 'approve') {
                const response = await window.apiClient.post(`/employee/reviews/${reviewId}/validate`, {
                    moderated_by: this.user.id
                });
                
                if (response.success) {
                    this.showSuccess(`Avis #${reviewId} approuvé avec succès`);
                } else {
                    this.showError(response.error || 'Erreur lors de l\'approbation');
                    return;
                }
            }
            
            // Remove from pending list
            this.pendingReviews = this.pendingReviews.filter(r => r.id !== reviewId);
            this.stats.pendingReviews--;
            this.stats.resolvedToday++;
            
            // Re-render
            this.renderReviews();
            this.updateStats();
            
        } catch (error) {
            console.error('Error moderating review:', error);
            this.showError('Erreur lors de la modération de l\'avis');
        }
    }

    async flagReview(reviewId) {
        const reason = prompt('Motif du signalement:');
        if (!reason) return;
        
        try {
            const response = await window.apiClient.post(`/employee/reviews/${reviewId}/flag`, {
                reason: reason,
                flagged_by: this.user.id
            });
            
            if (response.success) {
                this.showSuccess(`Avis #${reviewId} signalé pour vérification approfondie`);
            } else {
                this.showError(response.error || 'Erreur lors du signalement');
            }
        } catch (error) {
            console.error('Error flagging review:', error);
            this.showError('Erreur lors du signalement de l\'avis');
        }
    }

    renderDisputes() {
        const container = document.getElementById('disputesList');
        
        if (!this.disputes || this.disputes.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    ✅ Aucun litige actif
                </div>
            `;
            return;
        }

        container.innerHTML = this.disputes.map(dispute => this.createDisputeCard(dispute)).join('');
    }

    createDisputeCard(dispute) {
        const isUrgent = this.isDisputeUrgent(dispute);
        const badgeClass = isUrgent ? 'badge-danger' : 'badge-warning';
        const badgeText = isUrgent ? 'Urgent' : 'En cours';
        
        return `
            <div class="card mb-md" style="border: 2px solid var(--warning-orange);" data-dispute-id="${dispute.id}">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.5rem;">Litige #${dispute.dispute_number} • Trajet #${dispute.ride_id}</h4>
                            <p style="color: var(--text-tertiary); margin: 0;">Ouvert le ${this.formatDateTime(dispute.created_at)}</p>
                        </div>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
                        <div>
                            <h5 style="margin-bottom: 0.5rem;">👤 Chauffeur</h5>
                            <p style="margin-bottom: 0.25rem;"><strong>Pseudo:</strong> @${dispute.driver_username || 'N/A'}</p>
                            <p style="margin-bottom: 0.25rem;"><strong>Email:</strong> ${dispute.driver_email || 'N/A'}</p>
                            <p style="margin-bottom: 0.25rem;"><strong>Note:</strong> ⭐ ${dispute.driver_rating || 'N/A'}/5</p>
                        </div>
                        <div>
                            <h5 style="margin-bottom: 0.5rem;">🎒 Passager</h5>
                            <p style="margin-bottom: 0.25rem;"><strong>Pseudo:</strong> @${dispute.passenger_username || 'N/A'}</p>
                            <p style="margin-bottom: 0.25rem;"><strong>Email:</strong> ${dispute.passenger_email || 'N/A'}</p>
                            <p style="margin-bottom: 0.25rem;"><strong>Note:</strong> ⭐ ${dispute.passenger_rating || 'N/A'}/5</p>
                        </div>
                    </div>

                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.5rem 0;"><strong>🚗 Détails du trajet:</strong></p>
                        <p style="margin: 0 0 0.5rem 0;">📍 <strong>Départ:</strong> ${dispute.departure_city}, ${dispute.departure_address}</p>
                        <p style="margin: 0 0 0.5rem 0;">🎯 <strong>Arrivée:</strong> ${dispute.arrival_city}, ${dispute.arrival_address}</p>
                        <p style="margin: 0 0 0.5rem 0;">📅 <strong>Date:</strong> ${this.formatDateTime(dispute.departure_datetime)}</p>
                        <p style="margin: 0;"><strong>💰 Prix:</strong> ${dispute.price_credits} crédits</p>
                    </div>

                    <div style="background: var(--warning-light); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--warning-orange); margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.5rem 0;"><strong>🚨 Motif du litige:</strong></p>
                        <p style="margin: 0;"><strong>${dispute.complainant_role === 'driver' ? 'Chauffeur' : 'Passager'}:</strong> "${dispute.complaint_reason || 'N/A'}"</p>
                    </div>

                    ${dispute.response ? `
                        <div style="background: var(--info-light); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--info-blue); margin-bottom: 1rem;">
                            <p style="margin: 0 0 0.5rem 0;"><strong>💬 Réponse ${dispute.complainant_role === 'driver' ? 'du passager' : 'du chauffeur'}:</strong></p>
                            <p style="margin: 0;">"${dispute.response}"</p>
                        </div>
                    ` : ''}

                    <div class="form-group">
                        <label class="form-label">📝 Décision et commentaires</label>
                        <textarea class="form-control" rows="3" id="dispute${dispute.id}-decision" placeholder="Expliquez votre décision et les actions prises..."></textarea>
                    </div>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="window.employeeDashboard.resolveDispute('${dispute.dispute_number}', ${dispute.id}, 'refund-passenger')">
                            <span>💰</span>
                            <span>Rembourser le passager</span>
                        </button>
                        <button class="btn btn-primary" onclick="window.employeeDashboard.resolveDispute('${dispute.dispute_number}', ${dispute.id}, 'refund-50')">
                            <span>🤝</span>
                            <span>Remboursement partiel (50%)</span>
                        </button>
                        <button class="btn btn-secondary" onclick="window.employeeDashboard.resolveDispute('${dispute.dispute_number}', ${dispute.id}, 'favor-driver')">
                            <span>🚗</span>
                            <span>En faveur du chauffeur</span>
                        </button>
                        <button class="btn btn-danger" onclick="window.employeeDashboard.escalateDispute('${dispute.dispute_number}', ${dispute.id})">
                            <span>⚠️</span>
                            <span>Escalader au support</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    isDisputeUrgent(dispute) {
        // Dispute is urgent if opened more than 48h ago or involves high amounts
        const hoursSinceOpened = (Date.now() - new Date(dispute.created_at).getTime()) / (1000 * 60 * 60);
        return hoursSinceOpened > 48 || dispute.price_credits > 50;
    }

    async resolveDispute(disputeNumber, disputeId, resolution) {
        const decisionElement = document.getElementById(`dispute${disputeId}-decision`);
        const decision = decisionElement ? decisionElement.value : '';

        if (!decision || decision.trim().length < 10) {
            this.showError('Veuillez saisir une décision détaillée (minimum 10 caractères)');
            return;
        }

        try {
            const response = await window.apiClient.post(`/employee/disputes/${disputeId}/resolve`, {
                resolution_type: resolution,
                resolution_notes: decision,
                resolved_by: this.user.id
            });

            if (response.success) {
                let message = this.getResolutionMessage(disputeNumber, resolution, decision);
                this.showSuccess(message);
                
                // Remove from disputes list
                this.disputes = this.disputes.filter(d => d.id !== disputeId);
                this.stats.activeDisputes--;
                this.stats.resolvedToday++;
                
                // Re-render
                this.renderDisputes();
                this.updateStats();
            } else {
                this.showError(response.error || 'Erreur lors de la résolution du litige');
            }
        } catch (error) {
            console.error('Error resolving dispute:', error);
            this.showError('Erreur lors de la résolution du litige');
        }
    }

    getResolutionMessage(disputeNumber, resolution, decision) {
        const messages = {
            'refund-passenger': `Litige ${disputeNumber} résolu: Remboursement complet du passager`,
            'refund-50': `Litige ${disputeNumber} résolu: Remboursement de 50% pour le passager`,
            'favor-driver': `Litige ${disputeNumber} résolu: En faveur du chauffeur`,
            'compensate-driver': `Litige ${disputeNumber} résolu: Compensation versée au chauffeur`,
            'minor-compensation': `Litige ${disputeNumber} résolu: Compensation mineure au chauffeur`,
            'favor-passenger': `Litige ${disputeNumber} résolu: En faveur du passager`
        };
        
        return messages[resolution] || `Litige ${disputeNumber} résolu`;
    }

    async escalateDispute(disputeNumber, disputeId) {
        const decisionElement = document.getElementById(`dispute${disputeId}-decision`);
        const comments = decisionElement ? decisionElement.value : '';

        if (!comments || comments.trim().length < 10) {
            this.showError('Veuillez ajouter des commentaires expliquant pourquoi ce litige doit être escaladé (minimum 10 caractères)');
            return;
        }

        try {
            const response = await window.apiClient.post(`/employee/disputes/${disputeId}/escalate`, {
                escalation_reason: comments,
                escalated_by: this.user.id
            });

            if (response.success) {
                this.showSuccess(`Litige ${disputeNumber} escaladé au support niveau 2. Un superviseur prendra en charge ce dossier.`);
                
                // Remove from current list
                this.disputes = this.disputes.filter(d => d.id !== disputeId);
                this.stats.activeDisputes--;
                
                this.renderDisputes();
                this.updateStats();
            } else {
                this.showError(response.error || 'Erreur lors de l\'escalade du litige');
            }
        } catch (error) {
            console.error('Error escalating dispute:', error);
            this.showError('Erreur lors de l\'escalade du litige');
        }
    }

    showDemoReviews() {
        // Demo data for testing when API is not available
        this.pendingReviews = [
            {
                id: 1,
                ride_id: 1245,
                author_pseudo: 'Jean Dupont',
                author_username: 'jeandupont',
                driver_pseudo: 'Marie Martin',
                driver_username: 'mariemartin',
                departure_city: 'Paris',
                arrival_city: 'Lyon',
                rating_overall: 5,
                rating_punctuality: 5,
                rating_driving: 5,
                rating_vehicle: 5,
                comment: 'Excellente expérience ! Marie est très ponctuelle et conduit de manière sécuritaire. Le véhicule était propre et confortable. Je recommande vivement !',
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                ride_id: 1246,
                author_pseudo: 'Sophie Bernard',
                author_username: 'sophieb',
                driver_pseudo: 'Pierre Durand',
                driver_username: 'pierred',
                departure_city: 'Marseille',
                arrival_city: 'Nice',
                rating_overall: 2,
                rating_punctuality: 1,
                rating_driving: 3,
                rating_vehicle: 2,
                comment: 'Retard de 30 minutes sans prévenir. Véhicule sale. Je ne recommande pas du tout ce chauffeur qui est vraiment incompétent.',
                created_at: new Date().toISOString()
            }
        ];
        
        this.renderReviews();
        this.updateStatsFromData();
    }

    showDemoDisputes() {
        // Demo data for testing when API is not available
        this.disputes = [
            {
                id: 1,
                dispute_number: 'D-001',
                ride_id: 1247,
                driver_username: 'julienmartin',
                driver_email: 'julien.martin@email.fr',
                driver_rating: 4.7,
                passenger_username: 'luciedubois',
                passenger_email: 'lucie.dubois@email.fr',
                passenger_rating: 4.2,
                departure_city: 'Toulouse',
                departure_address: '5 Place du Capitole',
                arrival_city: 'Bordeaux',
                arrival_address: 'Gare Saint-Jean',
                departure_datetime: new Date().toISOString(),
                price_credits: 45,
                complainant_role: 'passenger',
                complaint_reason: 'Le chauffeur n\'est jamais venu au point de rendez-vous. J\'ai attendu 45 minutes et appelé plusieurs fois sans réponse. J\'ai dû prendre un autre moyen de transport. Je demande un remboursement complet.',
                response: 'J\'étais bien au point de rendez-vous indiqué dans l\'application. J\'ai attendu 20 minutes et envoyé 3 messages sans réponse. J\'ai dû partir pour respecter l\'horaire d\'arrivée. Je pense qu\'il y a eu confusion sur le lieu.',
                status: 'open',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        this.renderDisputes();
        this.updateStatsFromData();
    }

    attachEventHandlers() {
        // Any additional event handlers can be attached here
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        window.employeeDashboard = new EmployeeDashboardManager();
        window.employeeDashboard.init();
    });
} else {
    window.employeeDashboard = new EmployeeDashboardManager();
    window.employeeDashboard.init();
}
