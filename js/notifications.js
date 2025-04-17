/**
 * Notifications Manager
 *
 * Provides functionality for displaying toast notifications, alerts,
 * and status messages to the user.
 */

class NotificationManager {
	constructor() {
		this.container = null;
		this.defaultDuration = 5000; // 5 seconds
		this.notificationCount = 0;
		this.init();
	}

	init() {
		// Create container if it doesn't exist
		if (!this.container) {
			this.container = document.createElement("div");
			this.container.className = "notification-container";
			document.body.appendChild(this.container);
		}
	}

	/**
	 * Show a notification
	 *
	 * @param {Object} options - Notification options
	 * @param {string} options.message - The notification message
	 * @param {string} options.type - Type of notification: 'success', 'error', 'warning', 'info'
	 * @param {number} options.duration - How long to show the notification (ms). Default is 5000ms
	 * @param {boolean} options.dismissible - Whether the notification can be dismissed by clicking. Default is true
	 * @param {string} options.icon - Custom icon class (optional)
	 */
	show(options) {
		const {
			message,
			type = "info",
			duration = this.defaultDuration,
			dismissible = true,
			icon,
		} = options;

		// Create notification element
		const notificationId = `notification-${Date.now()}-${this
			.notificationCount++}`;
		const notification = document.createElement("div");
		notification.className = `notification ${type}`;
		notification.id = notificationId;

		// Create icon
		let iconElement = "";
		if (icon) {
			iconElement = `<div class="notification-icon">${icon}</div>`;
		} else {
			// Default icons based on type
			let defaultIcon = "";
			switch (type) {
				case "success":
					defaultIcon = "✓";
					break;
				case "error":
					defaultIcon = "✗";
					break;
				case "warning":
					defaultIcon = "⚠";
					break;
				case "info":
				default:
					defaultIcon = "ℹ";
					break;
			}
			iconElement = `<div class="notification-icon">${defaultIcon}</div>`;
		}

		// Create message content
		const messageElement = `<div class="notification-message">${message}</div>`;

		// Create close button if dismissible
		let closeButton = "";
		if (dismissible) {
			closeButton = `<button class="notification-close" aria-label="Close notification">×</button>`;
		}

		// Create progress bar for auto-dismissal
		const progressBar = `<div class="notification-progress"></div>`;

		// Build notification HTML
		notification.innerHTML = `${iconElement}${messageElement}${closeButton}${progressBar}`;

		// Add to container
		this.container.appendChild(notification);

		// Trigger animation
		setTimeout(() => {
			notification.classList.add("show");
		}, 10);

		// Set up progress bar animation
		const progress = notification.querySelector(".notification-progress");
		progress.style.animation = `progress-bar ${
			duration / 1000
		}s linear forwards`;

		// Set up auto dismiss
		const dismissTimeout = setTimeout(() => {
			this.dismiss(notificationId);
		}, duration);

		// Set up click dismiss
		if (dismissible) {
			const closeBtn = notification.querySelector(".notification-close");
			closeBtn.addEventListener("click", () => {
				clearTimeout(dismissTimeout);
				this.dismiss(notificationId);
			});
		}

		return notificationId;
	}

	/**
	 * Dismiss a notification by ID
	 *
	 * @param {string} id - Notification ID
	 */
	dismiss(id) {
		const notification = document.getElementById(id);
		if (notification) {
			notification.classList.remove("show");

			// Remove after animation completes
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 300);
		}
	}

	/**
	 * Show a success notification
	 *
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options to override defaults
	 */
	success(message, options = {}) {
		return this.show({
			message,
			type: "success",
			...options,
		});
	}

	/**
	 * Show an error notification
	 *
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options to override defaults
	 */
	error(message, options = {}) {
		return this.show({
			message,
			type: "error",
			...options,
		});
	}

	/**
	 * Show a warning notification
	 *
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options to override defaults
	 */
	warning(message, options = {}) {
		return this.show({
			message,
			type: "warning",
			...options,
		});
	}

	/**
	 * Show an info notification
	 *
	 * @param {string} message - The notification message
	 * @param {Object} options - Additional options to override defaults
	 */
	info(message, options = {}) {
		return this.show({
			message,
			type: "info",
			...options,
		});
	}

	/**
	 * Clear all notifications
	 */
	clearAll() {
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
	}
}

// Create a global instance
const notifications = new NotificationManager();

// Add style for progress bar animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes progress-bar {
    0% { width: 100%; }
    100% { width: 0%; }
  }
`;
document.head.appendChild(styleSheet);

// Export the instance
export default notifications;
