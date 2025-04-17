/**
 * System motywów aplikacji
 *
 * Obsługuje przełączanie między jasnymi i ciemnymi motywami oraz ich odpowiednie
 * zastosowanie w interfejsie użytkownika.
 */

// Dostępne motywy
const THEMES = {
	LIGHT: "light",
	DARK: "dark",
	SYSTEM: "system",
};

// Klucz do przechowywania preferencji motywu w localStorage
const THEME_STORAGE_KEY = "pacs-preferred-theme";

// Aktualnie aktywny motyw
let activeTheme = THEMES.LIGHT;

/**
 * Inicjalizuje system motywów
 */
function initThemeSystem() {
	// Pobierz zapisany motyw z localStorage lub użyj domyślnego (system)
	const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || THEMES.SYSTEM;

	// Ustaw motyw
	setTheme(savedTheme);

	// Nasłuchuj zmian w preferencjach systemu
	if (window.matchMedia) {
		const darkModeMediaQuery = window.matchMedia(
			"(prefers-color-scheme: dark)"
		);

		// Dodaj listener dla zmian w preferencjach
		darkModeMediaQuery.addEventListener("change", e => {
			if (activeTheme === THEMES.SYSTEM) {
				applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
			}
		});
	}

	// Nasłuchuj zmian w selektorze motywu
	const themeSelector = document.getElementById("theme-selector");
	if (themeSelector) {
		themeSelector.addEventListener("change", e => {
			setTheme(e.target.value);
		});

		// Ustaw wartość selektora na aktualny motyw
		themeSelector.value = savedTheme;
	}

	// Inicjalizuj przycisk przełączania motywu
	const themeToggleBtn = document.getElementById("theme-toggle");
	if (themeToggleBtn) {
		themeToggleBtn.addEventListener("click", toggleTheme);
		updateThemeToggleButton();
	}
}

/**
 * Ustawia motyw aplikacji
 * @param {string} theme - Nazwa motywu (light, dark, system)
 */
function setTheme(theme) {
	if (!Object.values(THEMES).includes(theme)) {
		console.error(`Nieprawidłowy motyw: ${theme}`);
		return;
	}

	// Zapisz wybrany motyw
	activeTheme = theme;
	localStorage.setItem(THEME_STORAGE_KEY, theme);

	// Jeśli wybrany motyw to "system", sprawdź preferencje systemowe
	if (theme === THEMES.SYSTEM) {
		const prefersDarkMode =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyTheme(prefersDarkMode ? THEMES.DARK : THEMES.LIGHT);
	} else {
		applyTheme(theme);
	}

	// Aktualizuj interfejs
	updateThemeUI(theme);
}

/**
 * Stosuje motyw do dokumentu
 * @param {string} theme - Motyw do zastosowania (light/dark)
 */
function applyTheme(theme) {
	if (theme === THEMES.DARK) {
		document.documentElement.classList.add("dark-theme");
		document.documentElement.classList.remove("light-theme");
	} else {
		document.documentElement.classList.add("light-theme");
		document.documentElement.classList.remove("dark-theme");
	}

	// Ustaw atrybut data-theme w elemencie HTML
	document.documentElement.setAttribute("data-theme", theme);

	// Dispatch event o zmianie motywu
	const event = new CustomEvent("theme:changed", { detail: { theme } });
	document.dispatchEvent(event);
}

/**
 * Aktualizuje elementy interfejsu związane z motywem
 * @param {string} theme - Wybrany motyw
 */
function updateThemeUI(theme) {
	// Aktualizuj selektor motywu
	const themeSelector = document.getElementById("theme-selector");
	if (themeSelector) {
		themeSelector.value = theme;
	}

	// Aktualizuj przycisk przełączania
	updateThemeToggleButton();
}

/**
 * Aktualizuje wygląd przycisku przełączania motywu
 */
function updateThemeToggleButton() {
	const themeToggleBtn = document.getElementById("theme-toggle");
	if (!themeToggleBtn) return;

	// Określ aktualny motyw
	let currentTheme = activeTheme;
	if (currentTheme === THEMES.SYSTEM) {
		const prefersDarkMode =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		currentTheme = prefersDarkMode ? THEMES.DARK : THEMES.LIGHT;
	}

	// Aktualizuj ikonę
	if (currentTheme === THEMES.DARK) {
		themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
		themeToggleBtn.setAttribute("title", "Przełącz na jasny motyw");
	} else {
		themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
		themeToggleBtn.setAttribute("title", "Przełącz na ciemny motyw");
	}
}

/**
 * Przełącza między jasnym i ciemnym motywem
 */
function toggleTheme() {
	// Określ aktualny motyw
	let currentTheme = activeTheme;
	if (currentTheme === THEMES.SYSTEM) {
		const prefersDarkMode =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		currentTheme = prefersDarkMode ? THEMES.DARK : THEMES.LIGHT;
	}

	// Przełącz motyw
	const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
	setTheme(newTheme);
}

/**
 * Zwraca aktualnie aktywny motyw
 * @returns {string} Nazwa aktywnego motywu
 */
function getActiveTheme() {
	return activeTheme;
}

/**
 * Zwraca aktualnie zastosowany motyw (light/dark)
 * @returns {string} Nazwa zastosowanego motywu
 */
function getAppliedTheme() {
	if (activeTheme !== THEMES.SYSTEM) {
		return activeTheme;
	}

	// Sprawdź preferencje systemowe
	const prefersDarkMode =
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;
	return prefersDarkMode ? THEMES.DARK : THEMES.LIGHT;
}

// Inicjalizacja systemu motywów po załadowaniu DOM
document.addEventListener("DOMContentLoaded", initThemeSystem);

// Eksportuj funkcje
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.getActiveTheme = getActiveTheme;
window.getAppliedTheme = getAppliedTheme;
