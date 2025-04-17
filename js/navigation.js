/**
 * System nawigacji aplikacji
 *
 * Zarządza wyświetlaniem sekcji i nawigacją po aplikacji
 */

// Przechowuje aktualnie aktywną sekcję
let activeSection = "";

/**
 * Inicjalizuje system nawigacji
 */
function initNavigation() {
	// Pobierz początkowy cel nawigacji z URL hash
	const initialTarget = window.location.hash.substring(1) || "home";

	// Nawiguj do początkowej sekcji
	navigateTo(initialTarget);

	// Nasłuchuj zmian w hash URL
	window.addEventListener("hashchange", function () {
		const target = window.location.hash.substring(1) || "home";
		navigateTo(target);
	});

	// Inicjalizuj menu nawigacyjne
	initNavigationMenu();

	console.log("System nawigacji zainicjalizowany");
}

/**
 * Inicjalizuje menu nawigacyjne
 */
function initNavigationMenu() {
	const navLinks = document.querySelectorAll("[data-nav-target]");

	// Dodaj nasłuchiwacz kliknięcia do wszystkich linków nawigacyjnych
	navLinks.forEach(link => {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			const target = this.getAttribute("data-nav-target");
			navigateTo(target);
		});
	});

	// Dodaj obsługę menu mobilnego
	const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
	const navigationMenu = document.getElementById("navigation-menu");

	if (mobileMenuToggle && navigationMenu) {
		mobileMenuToggle.addEventListener("click", function () {
			navigationMenu.classList.toggle("open");
			mobileMenuToggle.classList.toggle("open");
		});

		// Zamknij menu po kliknięciu w link
		navigationMenu.querySelectorAll("a").forEach(link => {
			link.addEventListener("click", function () {
				navigationMenu.classList.remove("open");
				mobileMenuToggle.classList.remove("open");
			});
		});
	}
}

/**
 * Nawiguje do określonej sekcji
 * @param {string} targetId - Identyfikator docelowej sekcji
 * @param {Object} options - Opcje nawigacji
 */
function navigateTo(targetId, options = {}) {
	// Domyślne opcje
	const defaultOptions = {
		updateUrl: true,
		scrollToTop: true,
	};

	// Połącz opcje
	const navOptions = { ...defaultOptions, ...options };

	console.log(`Nawigacja do sekcji: ${targetId}`);

	// Aktualizuj URL jeśli opcja jest włączona
	if (navOptions.updateUrl) {
		window.location.hash = targetId;
	}

	// Pobierz wszystkie sekcje
	const sections = document.querySelectorAll("section.content-section");

	// Ukryj wszystkie sekcje
	sections.forEach(section => {
		section.classList.remove("active");
	});

	// Pokaż docelową sekcję
	const targetSection = document.getElementById(targetId);
	if (targetSection) {
		targetSection.classList.add("active");

		// Zapisz aktywną sekcję
		activeSection = targetId;

		// Aktualizuj aktywny link w menu
		updateActiveNavLink(targetId);

		// Przewiń do góry sekcji jeśli opcja jest włączona
		if (navOptions.scrollToTop) {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}

		// Wywołaj zdarzenie zmiany sekcji
		const event = new CustomEvent("section:changed", {
			detail: { target: targetId },
		});
		document.dispatchEvent(event);
	} else {
		console.warn(`Sekcja o ID ${targetId} nie została znaleziona`);

		// Nawiguj do strony błędu 404
		const notFoundSection = document.getElementById("not-found");
		if (notFoundSection && targetId !== "not-found") {
			notFoundSection.classList.add("active");
			activeSection = "not-found";
		}
	}
}

/**
 * Aktualizuje aktywny link w menu nawigacyjnym
 * @param {string} targetId - Identyfikator aktywnej sekcji
 */
function updateActiveNavLink(targetId) {
	// Usuń klasę aktywną ze wszystkich linków
	const navLinks = document.querySelectorAll("[data-nav-target]");
	navLinks.forEach(link => {
		link.classList.remove("active");
	});

	// Dodaj klasę aktywną do aktywnego linku
	const activeLinks = document.querySelectorAll(
		`[data-nav-target="${targetId}"]`
	);
	activeLinks.forEach(link => {
		link.classList.add("active");
	});
}

/**
 * Zwraca identyfikator aktualnie aktywnej sekcji
 * @returns {string} Identyfikator aktywnej sekcji
 */
function getActiveSection() {
	return activeSection;
}

/**
 * Nawiguje do poprzedniej sekcji w historii
 */
function navigateBack() {
	window.history.back();
}

/**
 * Nawiguje do następnej sekcji w historii
 */
function navigateForward() {
	window.history.forward();
}

// Eksportuj funkcje
window.navigateTo = navigateTo;
window.navigateBack = navigateBack;
window.navigateForward = navigateForward;
window.getActiveSection = getActiveSection;

// Inicjalizuj nawigację po załadowaniu strony
document.addEventListener("DOMContentLoaded", initNavigation);
