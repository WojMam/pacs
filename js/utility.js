/**
 * PACS Message Generator - Utility Functions
 * Contains helper functions used across the application
 */

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The notification type (success, error, warning, info)
 * @param {number} duration - How long to show the notification in ms
 */
function showNotification(message, type = "success", duration = 3000) {
	// Get or create notification container
	let container = document.getElementById("notification-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "notification-container";
		document.body.appendChild(container);
	}

	// Create notification element
	const notification = document.createElement("div");
	notification.className = `notification notification-${type}`;

	// Add icon based on type
	const icons = {
		success: "✓",
		error: "✕",
		warning: "⚠",
		info: "ℹ",
	};

	notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">&times;</button>
    `;

	// Add to container
	container.appendChild(notification);

	// Show with animation
	setTimeout(() => {
		notification.classList.add("show");
	}, 10);

	// Setup close button
	const closeButton = notification.querySelector(".notification-close");
	closeButton.addEventListener("click", () => {
		closeNotification(notification);
	});

	// Auto close after duration
	if (duration > 0) {
		setTimeout(() => {
			closeNotification(notification);
		}, duration);
	}

	return notification;
}

/**
 * Close a notification with animation
 * @param {HTMLElement} notification - The notification element to close
 */
function closeNotification(notification) {
	notification.classList.remove("show");
	setTimeout(() => {
		if (notification.parentNode) {
			notification.parentNode.removeChild(notification);
		}
	}, 300); // Animation duration
}

/**
 * Format a date for display or input
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('input', 'display', 'iso')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = "display") {
	if (!date) return "";

	// Convert to Date object if string
	const dateObj = typeof date === "string" ? new Date(date) : date;

	switch (format) {
		case "input": // For date inputs (YYYY-MM-DD)
			return dateObj.toISOString().split("T")[0];
		case "iso": // Full ISO format
			return dateObj.toISOString();
		case "display": // Human readable
			return dateObj.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		case "datetime": // Human readable with time
			return dateObj.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		default:
			return dateObj.toISOString();
	}
}

/**
 * Generate a unique ID for use in forms and templates
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = "id") {
	return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Debounce a function to prevent rapid repeated calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
	let timeout;

	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
	if (obj === null || typeof obj !== "object") return obj;

	// Handle Date
	if (obj instanceof Date) {
		return new Date(obj.getTime());
	}

	// Handle Array
	if (Array.isArray(obj)) {
		return obj.map(item => deepClone(item));
	}

	// Handle Object
	if (obj instanceof Object) {
		const copy = {};
		Object.keys(obj).forEach(key => {
			copy[key] = deepClone(obj[key]);
		});
		return copy;
	}

	throw new Error(`Unable to clone object of type ${typeof obj}`);
}

/**
 * Format a currency amount for display
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount with currency
 */
function formatCurrency(amount, currency = "EUR") {
	if (!amount) return "";

	const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: currency,
	}).format(numAmount);
}

/**
 * Check if a value is empty (null, undefined, empty string or empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
function isEmpty(value) {
	if (value === null || value === undefined) return true;
	if (typeof value === "string" && value.trim() === "") return true;
	if (Array.isArray(value) && value.length === 0) return true;
	if (typeof value === "object" && Object.keys(value).length === 0) return true;

	return false;
}

/**
 * Convert an object to URL query parameters
 * @param {Object} params - Object with parameters
 * @returns {string} URL query string starting with ?
 */
function toQueryString(params) {
	if (!params || typeof params !== "object") return "";

	const queryParts = [];

	for (const key in params) {
		if (
			params.hasOwnProperty(key) &&
			params[key] !== undefined &&
			params[key] !== null
		) {
			queryParts.push(
				`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
			);
		}
	}

	return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

/**
 * Parse URL query parameters into an object
 * @returns {Object} Object with query parameters
 */
function parseQueryString() {
	const params = {};
	const queryString = window.location.search.substring(1);

	if (queryString) {
		const pairs = queryString.split("&");

		for (const pair of pairs) {
			const [key, value] = pair.split("=");
			params[decodeURIComponent(key)] = decodeURIComponent(value || "");
		}
	}

	return params;
}

/**
 * Get base path to current application
 * Useful for making requests when app might be deployed in a subdirectory
 * @returns {string} Base path
 */
function getBasePath() {
	const baseTag = document.querySelector("base");
	if (baseTag && baseTag.href) {
		return new URL(baseTag.href).pathname;
	}

	// Fallback to calculating from script path
	const scripts = document.getElementsByTagName("script");
	for (const script of scripts) {
		if (script.src && script.src.includes("utility.js")) {
			const urlObj = new URL(script.src);
			return urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/js/"));
		}
	}

	return "";
}
