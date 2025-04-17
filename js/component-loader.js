/**
 * Component Loader
 *
 * This utility provides functions to dynamically load HTML components and templates
 * into the main application. It supports loading components from different directories
 * and injecting them into specified containers.
 */

class ComponentLoader {
	constructor() {
		this.components = {};
		this.templates = {};
	}

	/**
	 * Load a component from a URL and inject it into a target element
	 *
	 * @param {string} url - URL of the component to load
	 * @param {HTMLElement|string} target - Target element or selector to inject the component into
	 * @param {Object} data - Optional data to use when processing the component template
	 * @param {Function} callback - Optional callback to execute after the component is loaded
	 * @returns {Promise} - Promise that resolves when the component is loaded
	 */
	async loadComponent(url, target, data = {}, callback = null) {
		try {
			// Convert target to element if it's a string
			const targetElement =
				typeof target === "string" ? document.querySelector(target) : target;

			if (!targetElement) {
				throw new Error(`Target element not found: ${target}`);
			}

			// Show loading indicator
			targetElement.innerHTML =
				'<div class="loading">Loading component...</div>';

			// Fetch the component
			let component;
			if (this.components[url]) {
				// Use cached component
				component = this.components[url];
			} else {
				// Fetch the component
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(
						`Failed to load component from ${url}: ${response.statusText}`
					);
				}

				component = await response.text();
				this.components[url] = component;
			}

			// Process template with data
			const processedComponent = this._processTemplate(component, data);

			// Inject component into target
			targetElement.innerHTML = processedComponent;

			// Initialize scripts in the component
			this._initializeComponentScripts(targetElement);

			// Execute callback if provided
			if (callback && typeof callback === "function") {
				callback(targetElement);
			}

			return targetElement;
		} catch (error) {
			console.error("Component loading error:", error);
			throw error;
		}
	}

	/**
	 * Process a template with data using simple variable substitution
	 *
	 * @param {string} template - The template string
	 * @param {Object} data - Data object with values to substitute
	 * @returns {string} - Processed template
	 */
	_processTemplate(template, data) {
		return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
			const trimmedKey = key.trim();
			return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
		});
	}

	/**
	 * Initialize any scripts found in a component
	 *
	 * @param {HTMLElement} element - The component element
	 */
	_initializeComponentScripts(element) {
		const scripts = element.querySelectorAll("script");
		scripts.forEach(oldScript => {
			const newScript = document.createElement("script");
			Array.from(oldScript.attributes).forEach(attr => {
				newScript.setAttribute(attr.name, attr.value);
			});
			newScript.textContent = oldScript.textContent;
			oldScript.parentNode.replaceChild(newScript, oldScript);
		});
	}

	/**
	 * Load multiple components at once
	 *
	 * @param {Array<Object>} components - Array of component objects with url, target, and optional data
	 * @returns {Promise} - Promise that resolves when all components are loaded
	 */
	async loadMultipleComponents(components) {
		const promises = components.map(component => {
			return this.loadComponent(
				component.url,
				component.target,
				component.data || {},
				component.callback
			);
		});

		return Promise.all(promises);
	}

	/**
	 * Unload a component from a target element
	 *
	 * @param {HTMLElement|string} target - Target element or selector
	 */
	unloadComponent(target) {
		const targetElement =
			typeof target === "string" ? document.querySelector(target) : target;

		if (targetElement) {
			targetElement.innerHTML = "";
		}
	}

	/**
	 * Preload a template for later use
	 *
	 * @param {string} templateId - Identifier for the template
	 * @param {string} url - URL of the template to load
	 * @returns {Promise} - Promise that resolves when the template is loaded
	 */
	async preloadTemplate(templateId, url) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to load template from ${url}: ${response.statusText}`
				);
			}

			const template = await response.text();
			this.templates[templateId] = template;

			return template;
		} catch (error) {
			console.error("Template loading error:", error);
			throw error;
		}
	}

	/**
	 * Get a preloaded template
	 *
	 * @param {string} templateId - Identifier for the template
	 * @returns {string|null} - The template string or null if not found
	 */
	getTemplate(templateId) {
		return this.templates[templateId] || null;
	}

	/**
	 * Render a template with data
	 *
	 * @param {string} templateId - Identifier for the template
	 * @param {Object} data - Data to use when rendering the template
	 * @returns {string} - Rendered template
	 */
	renderTemplate(templateId, data = {}) {
		const template = this.getTemplate(templateId);

		if (!template) {
			console.warn(`Template not found: ${templateId}`);
			return "";
		}

		return this._processTemplate(template, data);
	}
}

// Create global instance
const componentLoader = new ComponentLoader();

// Export the instance
window.componentLoader = componentLoader;
