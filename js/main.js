/**
 * Main application script
 * Initializes the application and handles core functionality
 */

import componentLoader from "./component-loader.js";
import { validateXml, generateXmlFromForm } from "./xml-utils.js";

// Available message types configuration
const MESSAGE_TYPES = [
	{
		id: "pacs.008",
		name: "PACS.008",
		description: "Customer Credit Transfer",
		icon: "arrow-right",
		features: [
			"Debtor information",
			"Creditor information",
			"Amount and currency",
			"Remittance information",
		],
	},
	{
		id: "pacs.002",
		name: "PACS.002",
		description: "Payment Status Report",
		icon: "check-circle",
		features: [
			"Original message reference",
			"Status information",
			"Reason codes",
		],
	},
	{
		id: "pacs.004",
		name: "PACS.004",
		description: "Payment Return",
		icon: "arrow-left",
		features: [
			"Return reason",
			"Original transaction reference",
			"Return amount",
		],
	},
];

// DOM elements cache
let cachedElements = {};

/**
 * Initialize the application
 */
async function initApp() {
	console.log("Initializing PACS Message Generator application...");

	// Set custom path for templates
	componentLoader.setTemplatesPath("/messages/templates/");

	// Cache frequently used DOM elements
	cacheElements();

	// Set up event listeners
	setupEventListeners();

	// Load message type selector
	await loadMessageSelector();

	// Initialize theme
	initializeTheme();

	console.log("Application initialized successfully");
}

/**
 * Cache frequently used DOM elements for better performance
 */
function cacheElements() {
	cachedElements = {
		mainContent: document.getElementById("main-content"),
		messageSelector: document.getElementById("message-selector"),
		themeToggle: document.getElementById("theme-toggle"),
		xmlOutput: document.getElementById("xml-output"),
		validateBtn: document.getElementById("validate-btn"),
		generateBtn: document.getElementById("generate-btn"),
		messageForm: document.getElementById("message-form"),
	};
}

/**
 * Set up main event listeners
 */
function setupEventListeners() {
	// Theme toggle
	if (cachedElements.themeToggle) {
		cachedElements.themeToggle.addEventListener("click", toggleTheme);
	}

	// XML generation
	if (cachedElements.generateBtn) {
		cachedElements.generateBtn.addEventListener("click", handleGenerateXml);
	}

	// XML validation
	if (cachedElements.validateBtn) {
		cachedElements.validateBtn.addEventListener("click", handleValidateXml);
	}

	// Global event delegation for dynamic elements
	document.addEventListener("click", handleGlobalClick);
}

/**
 * Handle global click events through event delegation
 * @param {Event} event - The click event
 */
function handleGlobalClick(event) {
	// Handle message type selection
	if (event.target.closest(".message-card")) {
		const card = event.target.closest(".message-card");
		const messageType = card.dataset.messageType;
		if (messageType) {
			selectMessageType(messageType);
		}
	}

	// Handle form section toggles
	if (event.target.closest(".section-toggle")) {
		const toggle = event.target.closest(".section-toggle");
		const section = toggle.closest(".form-section");
		if (section) {
			section.classList.toggle("collapsed");
		}
	}

	// Handle tab navigation
	if (event.target.closest(".tab")) {
		const tab = event.target.closest(".tab");
		const tabGroup = tab.closest(".tabs");
		const target = tab.dataset.target;

		// Update active tab
		tabGroup
			.querySelectorAll(".tab")
			.forEach(t => t.classList.remove("active"));
		tab.classList.add("active");

		// Show target pane
		tabGroup.querySelectorAll(".tab-pane").forEach(pane => {
			pane.classList.remove("active");
			if (pane.id === target) {
				pane.classList.add("active");
			}
		});
	}
}

/**
 * Load the message type selector component
 */
async function loadMessageSelector() {
	if (!cachedElements.messageSelector) return;

	// Create message cards from configuration
	const messageCards = MESSAGE_TYPES.map(type => createMessageCard(type)).join(
		""
	);

	// Set the content
	cachedElements.messageSelector.innerHTML = `
        <h2>Select Message Type</h2>
        <div class="message-grid">
            ${messageCards}
        </div>
    `;
}

/**
 * Create a message card HTML
 * @param {Object} messageType - Message type configuration
 * @returns {string} - HTML for the message card
 */
function createMessageCard(messageType) {
	const features = messageType.features
		.map(
			feature => `<li class="feature"><i class="icon-check"></i>${feature}</li>`
		)
		.join("");

	return `
        <div class="message-card" data-message-type="${messageType.id}">
            <div class="card-header">
                <i class="icon-${messageType.icon}"></i>
                <h3>${messageType.name}</h3>
                <span class="badge">${messageType.id}</span>
            </div>
            <div class="card-body">
                <p>${messageType.description}</p>
                <ul class="features">
                    ${features}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Handle message type selection
 * @param {string} messageType - Selected message type ID
 */
async function selectMessageType(messageType) {
	console.log(`Selected message type: ${messageType}`);

	// Find the message type configuration
	const messageConfig = MESSAGE_TYPES.find(type => type.id === messageType);
	if (!messageConfig) {
		console.error(`Unknown message type: ${messageType}`);
		return;
	}

	// Clear existing content
	if (cachedElements.mainContent) {
		cachedElements.mainContent.innerHTML =
			'<div class="loading">Loading message form...</div>';

		try {
			// Load the message component
			await componentLoader.loadComponent(messageType, "#main-content", {
				messageType: messageConfig,
			});

			// Re-cache form element as it's now created
			cachedElements.messageForm = document.getElementById("message-form");

			// Initialize form functionality
			initializeForm();
		} catch (error) {
			cachedElements.mainContent.innerHTML = `
                <div class="error">
                    <h3>Error Loading Form</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">Go Back</button>
                </div>
            `;
			console.error("Error loading message form:", error);
		}
	}
}

/**
 * Initialize form functionality
 */
function initializeForm() {
	// Add form validation listeners
	if (cachedElements.messageForm) {
		cachedElements.messageForm.addEventListener("submit", event => {
			event.preventDefault();
			handleGenerateXml();
		});

		// Add input validation
		const inputs = cachedElements.messageForm.querySelectorAll(
			"input, select, textarea"
		);
		inputs.forEach(input => {
			input.addEventListener("blur", validateInput);
			input.addEventListener("input", clearValidationError);
		});
	}
}

/**
 * Validate a single input field
 * @param {Event} event - The blur event
 */
function validateInput(event) {
	const input = event.target;
	const value = input.value.trim();
	const isRequired = input.hasAttribute("required");
	const validationType = input.dataset.validation;

	let isValid = true;
	let errorMessage = "";

	// Check required fields
	if (isRequired && value === "") {
		isValid = false;
		errorMessage = "This field is required";
	} else if (value !== "" && validationType) {
		// Apply specific validation based on data-validation attribute
		switch (validationType) {
			case "email":
				isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
				errorMessage = "Please enter a valid email address";
				break;
			case "number":
				isValid = !isNaN(value) && value !== "";
				errorMessage = "Please enter a valid number";
				break;
			case "currency":
				isValid = /^\d+(\.\d{1,2})?$/.test(value);
				errorMessage = "Please enter a valid currency amount";
				break;
			case "date":
				isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);
				errorMessage = "Please enter a valid date in YYYY-MM-DD format";
				break;
			case "bicfi":
				isValid = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value);
				errorMessage = "Please enter a valid BIC/BEI code";
				break;
			case "lei":
				isValid = /^[A-Z0-9]{18}[0-9]{2}$/.test(value);
				errorMessage = "Please enter a valid LEI (20 characters)";
				break;
		}
	}

	// Update UI with validation result
	if (!isValid) {
		input.classList.add("invalid");

		// Find or create error message element
		let errorEl = input.nextElementSibling;
		if (!errorEl || !errorEl.classList.contains("error-message")) {
			errorEl = document.createElement("div");
			errorEl.className = "error-message";
			input.parentNode.insertBefore(errorEl, input.nextElementSibling);
		}
		errorEl.textContent = errorMessage;
	} else {
		input.classList.remove("invalid");
		const errorEl = input.nextElementSibling;
		if (errorEl && errorEl.classList.contains("error-message")) {
			errorEl.remove();
		}
	}

	return isValid;
}

/**
 * Clear validation error when user starts typing
 * @param {Event} event - The input event
 */
function clearValidationError(event) {
	const input = event.target;
	input.classList.remove("invalid");
	const errorEl = input.nextElementSibling;
	if (errorEl && errorEl.classList.contains("error-message")) {
		errorEl.remove();
	}
}

/**
 * Handle XML generation from form
 */
function handleGenerateXml() {
	if (!cachedElements.messageForm || !cachedElements.xmlOutput) return;

	// Validate form before submission
	const inputs = cachedElements.messageForm.querySelectorAll(
		"input, select, textarea"
	);
	let isValid = true;

	inputs.forEach(input => {
		// Create a blur event to trigger validation
		const event = new Event("blur", { bubbles: true });
		input.dispatchEvent(event);

		// Check validation result
		if (input.classList.contains("invalid")) {
			isValid = false;
		}
	});

	if (!isValid) {
		// Show error message for form
		const errorMsg = document.createElement("div");
		errorMsg.className = "alert alert-danger";
		errorMsg.textContent =
			"Please correct the errors in the form before generating XML";

		// Remove any existing error message
		const existingError = cachedElements.messageForm.querySelector(".alert");
		if (existingError) existingError.remove();

		cachedElements.messageForm.insertBefore(
			errorMsg,
			cachedElements.messageForm.firstChild
		);

		// Scroll to first error
		const firstError = cachedElements.messageForm.querySelector(".invalid");
		if (firstError) {
			firstError.scrollIntoView({ behavior: "smooth", block: "center" });
		}

		return;
	}

	try {
		// Get message type from form data-message-type attribute
		const messageType = cachedElements.messageForm.dataset.messageType;

		// Generate XML from form data
		const xml = generateXmlFromForm(cachedElements.messageForm, messageType);

		// Display formatted XML
		displayXmlOutput(xml);

		// Enable validation button
		if (cachedElements.validateBtn) {
			cachedElements.validateBtn.disabled = false;
		}
	} catch (error) {
		console.error("Error generating XML:", error);

		// Show error in XML output
		cachedElements.xmlOutput.innerHTML = `
            <div class="error">
                <h3>Error Generating XML</h3>
                <p>${error.message}</p>
            </div>
        `;
	}
}

/**
 * Display XML output with syntax highlighting
 * @param {string} xml - XML string to display
 */
function displayXmlOutput(xml) {
	if (!cachedElements.xmlOutput) return;

	// Create pre and code elements for formatting
	const pre = document.createElement("pre");
	const code = document.createElement("code");

	// Apply syntax highlighting if available
	if (window.hljs) {
		code.className = "language-xml";
		code.textContent = xml;
		hljs.highlightElement(code);
	} else {
		// Basic formatting without highlighting
		code.textContent = xml;
	}

	pre.appendChild(code);

	// Clear and update XML output
	cachedElements.xmlOutput.innerHTML = "";
	cachedElements.xmlOutput.appendChild(pre);

	// Add copy button
	const copyBtn = document.createElement("button");
	copyBtn.className = "btn btn-sm btn-icon copy-btn";
	copyBtn.innerHTML = '<i class="icon-copy"></i> Copy XML';
	copyBtn.addEventListener("click", () => {
		navigator.clipboard
			.writeText(xml)
			.then(() => {
				copyBtn.innerHTML = '<i class="icon-check"></i> Copied!';
				setTimeout(() => {
					copyBtn.innerHTML = '<i class="icon-copy"></i> Copy XML';
				}, 2000);
			})
			.catch(err => {
				console.error("Failed to copy XML:", err);
				copyBtn.innerHTML = '<i class="icon-warning"></i> Failed to copy';
				setTimeout(() => {
					copyBtn.innerHTML = '<i class="icon-copy"></i> Copy XML';
				}, 2000);
			});
	});

	cachedElements.xmlOutput.insertBefore(copyBtn, pre);
}

/**
 * Handle XML validation
 */
function handleValidateXml() {
	if (!cachedElements.xmlOutput) return;

	// Get XML content
	const preElement = cachedElements.xmlOutput.querySelector("pre code");
	if (!preElement) {
		console.error("No XML content found to validate");
		return;
	}

	const xml = preElement.textContent;

	// Get message type from form
	const messageType = cachedElements.messageForm.dataset.messageType;

	try {
		// Validate XML against schema
		const validationResult = validateXml(xml, messageType);

		if (validationResult.valid) {
			// Show success message
			const validationMsg = document.createElement("div");
			validationMsg.className = "alert alert-success";
			validationMsg.innerHTML = '<i class="icon-check"></i> XML is valid';

			// Remove any existing validation message
			const existingMsg = cachedElements.xmlOutput.querySelector(".alert");
			if (existingMsg) existingMsg.remove();

			cachedElements.xmlOutput.insertBefore(
				validationMsg,
				cachedElements.xmlOutput.firstChild
			);
		} else {
			// Show validation errors
			const validationMsg = document.createElement("div");
			validationMsg.className = "alert alert-danger";
			validationMsg.innerHTML = `
                <h4><i class="icon-warning"></i> XML Validation Errors</h4>
                <ul>
                    ${validationResult.errors
											.map(error => `<li>${error}</li>`)
											.join("")}
                </ul>
            `;

			// Remove any existing validation message
			const existingMsg = cachedElements.xmlOutput.querySelector(".alert");
			if (existingMsg) existingMsg.remove();

			cachedElements.xmlOutput.insertBefore(
				validationMsg,
				cachedElements.xmlOutput.firstChild
			);
		}
	} catch (error) {
		console.error("Error validating XML:", error);

		// Show error message
		const errorMsg = document.createElement("div");
		errorMsg.className = "alert alert-danger";
		errorMsg.innerHTML = `<i class="icon-warning"></i> Error validating XML: ${error.message}`;

		// Remove any existing validation message
		const existingMsg = cachedElements.xmlOutput.querySelector(".alert");
		if (existingMsg) existingMsg.remove();

		cachedElements.xmlOutput.insertBefore(
			errorMsg,
			cachedElements.xmlOutput.firstChild
		);
	}
}

/**
 * Initialize theme based on user preference or system setting
 */
function initializeTheme() {
	const savedTheme = localStorage.getItem("theme");

	if (savedTheme) {
		// Apply saved theme preference
		document.documentElement.setAttribute("data-theme", savedTheme);
	} else if (
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	) {
		// Apply system preference if no saved preference
		document.documentElement.setAttribute("data-theme", "dark");
	}

	// Update theme toggle button if it exists
	updateThemeToggleButton();
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
	const currentTheme =
		document.documentElement.getAttribute("data-theme") || "light";
	const newTheme = currentTheme === "light" ? "dark" : "light";

	// Apply new theme
	document.documentElement.setAttribute("data-theme", newTheme);

	// Save preference
	localStorage.setItem("theme", newTheme);

	// Update toggle button
	updateThemeToggleButton();
}

/**
 * Update theme toggle button icon and text
 */
function updateThemeToggleButton() {
	if (!cachedElements.themeToggle) return;

	const currentTheme =
		document.documentElement.getAttribute("data-theme") || "light";

	if (currentTheme === "dark") {
		cachedElements.themeToggle.innerHTML =
			'<i class="icon-sun"></i> Light Mode';
	} else {
		cachedElements.themeToggle.innerHTML =
			'<i class="icon-moon"></i> Dark Mode';
	}
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);

// Export public functions and configurations
export {
	MESSAGE_TYPES,
	selectMessageType,
	handleGenerateXml,
	handleValidateXml,
	toggleTheme,
};
