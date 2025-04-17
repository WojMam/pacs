document.addEventListener("DOMContentLoaded", function () {
	// Referencje do elementów DOM
	const toggleThemeBtn = document.getElementById("toggleTheme");
	const toggleThemeText = toggleThemeBtn.querySelector(".toggle-text");

	// Inicjalizacja trybu kolorystycznego
	initTheme();

	// Obsługa przełącznika trybu jasnego/ciemnego
	toggleThemeBtn.addEventListener("click", function () {
		document.documentElement.classList.toggle("dark-mode");
		updateThemeText();
		saveThemePreference();
	});

	// Funkcja inicjalizująca tryb kolorystyczny na podstawie zapisanych preferencji
	function initTheme() {
		const darkModePreferred = localStorage.getItem("darkMode") === "true";
		if (darkModePreferred) {
			document.documentElement.classList.add("dark-mode");
		} else {
			document.documentElement.classList.remove("dark-mode");
		}
		updateThemeText();
	}

	// Funkcja aktualizująca tekst przycisku przełącznika
	function updateThemeText() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		toggleThemeText.textContent = isDarkMode ? "Tryb jasny" : "Tryb ciemny";
	}

	// Funkcja zapisująca preferencje trybu
	function saveThemePreference() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		localStorage.setItem("darkMode", isDarkMode);
	}
});
