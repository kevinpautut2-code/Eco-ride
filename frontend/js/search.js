/**
 * EcoRide - Gestion de la recherche de trajets
 */

class SearchManager {
    constructor() {
        this.searchForm = document.getElementById('searchForm');
        this.dateInput = document.getElementById('date');

        this.init();
    }

    init() {
        // Définir la date minimale à aujourd'hui
        if (this.dateInput) {
            const today = new Date().toISOString().split('T')[0];
            this.dateInput.min = today;
            this.dateInput.value = today;
        }

        // Gérer la soumission du formulaire
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Autocomplétion des villes (simulation)
        this.setupAutocomplete();
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

        if (departure.toLowerCase() === arrival.toLowerCase()) {
            this.showNotification('Le départ et l\'arrivée doivent être différents', 'error');
            return;
        }

        // Rediriger vers la page de résultats avec les paramètres
        const params = new URLSearchParams({
            departure,
            arrival,
            date
        });

        window.location.href = `rides.html?${params.toString()}`;
    }

    setupAutocomplete() {
        // Liste de villes françaises pour l'autocomplétion
        const cities = [
            'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes',
            'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes',
            'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble',
            'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Le Mans',
            'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Tours',
            'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Boulogne-Billancourt'
        ];

        const departureInput = document.getElementById('departure');
        const arrivalInput = document.getElementById('arrival');

        if (departureInput) {
            this.addAutocomplete(departureInput, cities);
        }

        if (arrivalInput) {
            this.addAutocomplete(arrivalInput, cities);
        }
    }

    addAutocomplete(input, suggestions) {
        let currentFocus = -1;

        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            closeAllLists();

            if (!value) return;

            currentFocus = -1;

            // Créer le conteneur des suggestions
            const autocompleteList = document.createElement('div');
            autocompleteList.className = 'autocomplete-items';
            autocompleteList.style.cssText = `
                position: absolute;
                background: var(--bg-card);
                border: 1px solid var(--border-medium);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                max-height: 200px;
                overflow-y: auto;
                width: ${this.offsetWidth}px;
                z-index: 999;
                margin-top: 4px;
            `;

            this.parentNode.appendChild(autocompleteList);

            // Filtrer et afficher les suggestions
            const matches = suggestions.filter(city =>
                city.toLowerCase().includes(value)
            ).slice(0, 5);

            matches.forEach(city => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: var(--spacing-sm) var(--spacing-md);
                    cursor: pointer;
                    transition: background-color var(--transition-fast);
                `;

                item.innerHTML = city.replace(
                    new RegExp(value, 'gi'),
                    match => `<strong style="color: var(--primary-green);">${match}</strong>`
                );

                item.addEventListener('click', function() {
                    input.value = city;
                    closeAllLists();
                });

                item.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = 'var(--bg-hover)';
                });

                item.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '';
                });

                autocompleteList.appendChild(item);
            });
        });

        input.addEventListener('keydown', function(e) {
            let items = this.parentNode.querySelector('.autocomplete-items');
            if (items) items = items.getElementsByTagName('div');

            if (e.keyCode === 40) { // Down arrow
                currentFocus++;
                addActive(items);
            } else if (e.keyCode === 38) { // Up arrow
                currentFocus--;
                addActive(items);
            } else if (e.keyCode === 13) { // Enter
                e.preventDefault();
                if (currentFocus > -1 && items) {
                    items[currentFocus].click();
                }
            }
        });

        function addActive(items) {
            if (!items) return false;
            removeActive(items);
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = items.length - 1;
            items[currentFocus].style.backgroundColor = 'var(--bg-hover)';
        }

        function removeActive(items) {
            for (let i = 0; i < items.length; i++) {
                items[i].style.backgroundColor = '';
            }
        }

        function closeAllLists(except) {
            const items = document.getElementsByClassName('autocomplete-items');
            for (let i = 0; i < items.length; i++) {
                if (except !== items[i] && except !== input) {
                    items[i].parentNode.removeChild(items[i]);
                }
            }
        }

        document.addEventListener('click', function(e) {
            closeAllLists(e.target);
        });
    }

    showNotification(message, type = 'info') {
        // Créer une notification
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

        // Retirer après 5 secondes
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
}

// Initialiser la recherche
document.addEventListener('DOMContentLoaded', () => {
    new SearchManager();
});

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
