/**
 * EcoRide - Gestion de la navigation
 * Menu responsive et scroll effects
 */

class NavigationManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navbarToggle = document.getElementById('navbarToggle');
        this.navbarMenu = document.getElementById('navbarMenu');
        this.navbarLinks = document.querySelectorAll('.navbar-link');

        this.init();
    }

    init() {
        // Menu mobile
        if (this.navbarToggle && this.navbarMenu) {
            this.navbarToggle.addEventListener('click', () => this.toggleMobileMenu());

            // Fermer le menu lors du clic sur un lien
            this.navbarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        this.closeMobileMenu();
                    }
                });
            });
        }

        // Effet de scroll sur la navbar
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll());

        // Fermer le menu mobile lors du redimensionnement
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                this.closeMobileMenu();
            }
        });

        // Activer le lien correspondant à la page actuelle
        this.setActiveLink();
    }

    toggleMobileMenu() {
        this.navbarToggle.classList.toggle('active');
        this.navbarMenu.classList.toggle('active');

        // Empêcher le scroll du body quand le menu est ouvert
        if (this.navbarMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu() {
        this.navbarToggle.classList.remove('active');
        this.navbarMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleScroll() {
        if (!this.navbar) return;

        if (window.scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }

    setActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        this.navbarLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Initialiser la navigation
document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
});

/**
 * Smooth scroll pour les ancres
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            const offsetTop = target.offsetTop - 80; // Offset pour la navbar sticky
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});
