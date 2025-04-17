/**
 * Utils - zbiór funkcji pomocniczych dla aplikacji
 */

/**
 * Escapuje znaki specjalne w XML
 * @param {string} unsafe - Tekst do escapowania
 * @returns {string} - Teksty z escapowanymi znakami specjalnymi
 */
function escapeXml(unsafe) {
	if (!unsafe) return "";
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Dodaje zero przed liczbami jednocyfrowymi
 * @param {number} num - Liczba do sformatowania
 * @returns {string} - Sformatowana liczba
 */
function padZero(num) {
	return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Generuje identyfikator UUID v4
 * @returns {string} - UUID v4
 */
function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generuje aktualną datę i czas w formacie ISO
 * @returns {string} - Data i czas w formacie ISO
 */
function getCurrentISODateTime() {
	const now = new Date();
	const year = now.getFullYear();
	const month = padZero(now.getMonth() + 1);
	const day = padZero(now.getDate());
	const hours = padZero(now.getHours());
	const minutes = padZero(now.getMinutes());
	const seconds = padZero(now.getSeconds());

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Oblicza datę i czas przesuniętą o podaną wartość
 * @param {number} amount - Ilość jednostek
 * @param {string} unit - Jednostka ('days', 'hours', 'minutes')
 * @returns {string} - Data i czas w formacie ISO
 */
function getISODateTime(amount, unit) {
	const now = new Date();

	switch (unit) {
		case "days":
			now.setDate(now.getDate() + amount);
			break;
		case "hours":
			now.setHours(now.getHours() + amount);
			break;
		case "minutes":
			now.setMinutes(now.getMinutes() + amount);
			break;
		default:
			break;
	}

	const year = now.getFullYear();
	const month = padZero(now.getMonth() + 1);
	const day = padZero(now.getDate());
	const hours = padZero(now.getHours());
	const minutes = padZero(now.getMinutes());
	const seconds = padZero(now.getSeconds());

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Pokazuje powiadomienie
 * @param {string} message - Treść powiadomienia
 * @param {number} duration - Czas wyświetlania w ms (domyślnie 3000ms)
 */
function showNotification(message, duration = 3000) {
	const notification =
		document.getElementById("notification") || createNotificationElement();
	notification.textContent = message;
	notification.classList.add("visible");

	setTimeout(() => {
		notification.classList.remove("visible");
	}, duration);
}

/**
 * Tworzy element powiadomienia, jeśli nie istnieje
 * @returns {HTMLElement} - Element powiadomienia
 */
function createNotificationElement() {
	const notification = document.createElement("div");
	notification.id = "notification";
	notification.className = "notification";
	document.body.appendChild(notification);
	return notification;
}

/**
 * Kopiuje tekst do schowka
 * @param {string} text - Tekst do skopiowania
 * @returns {Promise} - Promise, który zostaje rozwiązany po skopiowaniu tekstu
 */
function copyToClipboard(text) {
	if (navigator.clipboard) {
		return navigator.clipboard
			.writeText(text)
			.then(() => {
				showNotification("Skopiowano do schowka!");
				return true;
			})
			.catch(err => {
				console.error("Błąd podczas kopiowania do schowka:", err);
				return false;
			});
	} else {
		// Fallback dla starszych przeglądarek
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();

		try {
			const successful = document.execCommand("copy");
			document.body.removeChild(textarea);

			if (successful) {
				showNotification("Skopiowano do schowka!");
				return Promise.resolve(true);
			} else {
				return Promise.resolve(false);
			}
		} catch (err) {
			document.body.removeChild(textarea);
			console.error("Błąd podczas kopiowania do schowka:", err);
			return Promise.resolve(false);
		}
	}
}

/**
 * Zapisuje ustawienie motywu
 * @param {string} theme - Nazwa motywu ('light' lub 'dark')
 */
function saveThemePreference(theme) {
	localStorage.setItem("theme", theme);
}

/**
 * Wczytuje zapisane ustawienie motywu
 * @returns {string|null} - Nazwa motywu ('light', 'dark' lub null, jeśli nie zapisano)
 */
function loadThemePreference() {
	return localStorage.getItem("theme");
}

// Eksportuj funkcje modułu
export {
	escapeXml,
	padZero,
	generateUUID,
	getCurrentISODateTime,
	getISODateTime,
	showNotification,
	copyToClipboard,
	saveThemePreference,
	loadThemePreference,
};
