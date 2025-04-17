/**
 * Theme Manager
 *
 * Handles theme switching (light/dark mode) and persists user preferences.
 * Provides an API for programmatically changing themes and detecting current theme.
 */

// Theme constants
const THEME_STORAGE_KEY = "app-theme-preference";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";
const SYSTEM_THEME = "system";

/**
 * Initialize theme manager
 * Sets up theme based on stored preference or system preference
 */
function initThemeManager() {
	// Apply the current theme
	applyTheme(getCurrentThemePreference());

	// Watch for system preference changes
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", ({ matches }) => {
			// Only update if using system preference
			if (getCurrentThemePreference() === SYSTEM_THEME) {
				applyTheme(SYSTEM_THEME);
			}
		});

	// Add theme toggle event listeners
	document.addEventListener("DOMContentLoaded", () => {
		setupThemeToggleListeners();
	});
}

/**
 * Set up event listeners for theme toggle elements
 */
function setupThemeToggleListeners() {
	// Toggle buttons with data-theme-toggle attribute
	document.querySelectorAll("[data-theme-toggle]").forEach(button => {
		button.addEventListener("click", () => {
			const currentTheme = getCurrentTheme();
			const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
			setTheme(newTheme);
		});

		// Update button state
		updateThemeToggleState(button);
	});

	// Radio buttons or select elements with data-theme-value attribute
	document.querySelectorAll("[data-theme-value]").forEach(element => {
		const themeValue = element.getAttribute("data-theme-value");

		// For radio buttons and checkboxes
		if (element.type === "radio" || element.type === "checkbox") {
			element.checked = getCurrentThemePreference() === themeValue;

			element.addEventListener("change", () => {
				if (element.checked) {
					setTheme(themeValue);
				}
			});
		}
		// For select elements
		else if (element.tagName === "SELECT") {
			element.value = getCurrentThemePreference();

			element.addEventListener("change", () => {
				setTheme(element.value);
			});
		}
	});
}

/**
 * Update theme toggle button state
 *
 * @param {Element} button - The theme toggle button
 */
function updateThemeToggleState(button) {
	const currentTheme = getCurrentTheme();
	const isDarkMode = currentTheme === DARK_THEME;

	// Update aria attributes
	button.setAttribute("aria-pressed", isDarkMode.toString());

	// Update button text if it contains a label element
	const label = button.querySelector("[data-theme-label]");
	if (label) {
		label.textContent = isDarkMode ? "Dark Mode" : "Light Mode";
	}

	// Update icon if present
	const lightIcon = button.querySelector('[data-theme-icon="light"]');
	const darkIcon = button.querySelector('[data-theme-icon="dark"]');

	if (lightIcon) lightIcon.classList.toggle("hidden", isDarkMode);
	if (darkIcon) darkIcon.classList.toggle("hidden", !isDarkMode);
}

/**
 * Get the current active theme (light or dark)
 *
 * @returns {string} - Either 'light' or 'dark'
 */
function getCurrentTheme() {
	return document.documentElement.classList.contains(DARK_THEME)
		? DARK_THEME
		: LIGHT_THEME;
}

/**
 * Get the current theme preference (light, dark, or system)
 *
 * @returns {string} - The current theme preference
 */
function getCurrentThemePreference() {
	return localStorage.getItem(THEME_STORAGE_KEY) || SYSTEM_THEME;
}

/**
 * Set theme preference and apply it
 *
 * @param {string} theme - The theme to set ('light', 'dark', or 'system')
 */
function setTheme(theme) {
	if (![LIGHT_THEME, DARK_THEME, SYSTEM_THEME].includes(theme)) {
		console.error(
			`Invalid theme: ${theme}. Must be 'light', 'dark', or 'system'.`
		);
		return;
	}

	// Store preference
	localStorage.setItem(THEME_STORAGE_KEY, theme);

	// Apply the theme
	applyTheme(theme);

	// Update toggle buttons
	document
		.querySelectorAll("[data-theme-toggle]")
		.forEach(updateThemeToggleState);

	// Update other theme selectors
	document.querySelectorAll("[data-theme-value]").forEach(element => {
		const themeValue = element.getAttribute("data-theme-value");

		if (element.type === "radio" || element.type === "checkbox") {
			element.checked = theme === themeValue;
		} else if (element.tagName === "SELECT") {
			element.value = theme;
		}
	});

	// Dispatch theme change event
	document.dispatchEvent(
		new CustomEvent("themeChanged", {
			detail: { theme: getCurrentTheme(), preference: theme },
		})
	);
}

/**
 * Apply theme based on preference
 *
 * @param {string} preference - The theme preference to apply
 */
function applyTheme(preference) {
	// Determine if dark mode should be active
	let isDarkMode = false;

	if (preference === SYSTEM_THEME) {
		// Use system preference
		isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	} else {
		// Use explicit preference
		isDarkMode = preference === DARK_THEME;
	}

	// Apply the theme
	document.documentElement.classList.toggle(DARK_THEME, isDarkMode);

	// Update meta theme-color for mobile browsers
	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute("content", isDarkMode ? "#1a1a1a" : "#ffffff");
	}
}

/**
 * Check if dark mode is currently active
 *
 * @returns {boolean} - True if dark mode is active
 */
function isDarkMode() {
	return getCurrentTheme() === DARK_THEME;
}

// Initialize theme manager
initThemeManager();

// Export API for global use
window.themeManager = {
	setTheme,
	getCurrentTheme,
	getCurrentThemePreference,
	isDarkMode,
};
