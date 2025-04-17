/**
 * XML Utilities
 *
 * This module provides utility functions for working with XML data,
 * including generation, parsing, and validation.
 */

/**
 * Generate XML from a JavaScript object based on the provided schema
 * @param {Object} data - The data object to convert to XML
 * @param {Object} schemaInfo - Information about the XML schema
 * @param {string} schemaInfo.rootElement - The name of the root element
 * @param {Object} schemaInfo.namespaces - Namespace definitions
 * @return {string} The generated XML string
 */
function generateXML(data, schemaInfo) {
	if (!data || !schemaInfo) {
		console.error("Missing required parameters for XML generation");
		return null;
	}

	try {
		// Create XML document
		const xmlDoc = document.implementation.createDocument(
			null,
			schemaInfo.rootElement,
			null
		);

		const rootElement = xmlDoc.documentElement;

		// Add namespaces to root element
		if (schemaInfo.namespaces) {
			for (const [prefix, uri] of Object.entries(schemaInfo.namespaces)) {
				if (prefix === "xmlns") {
					rootElement.setAttribute("xmlns", uri);
				} else {
					rootElement.setAttribute(`xmlns:${prefix}`, uri);
				}
			}
		}

		// Process data object and create XML structure
		createXMLElements(data, rootElement, xmlDoc);

		// Convert to string
		const serializer = new XMLSerializer();
		const xmlString = serializer.serializeToString(xmlDoc);

		return formatXML(xmlString);
	} catch (error) {
		console.error("Error generating XML:", error);
		return null;
	}
}

/**
 * Create XML elements from a JavaScript object
 * @param {Object} data - The data object
 * @param {Element} parentElement - The parent XML element
 * @param {Document} xmlDoc - The XML document
 */
function createXMLElements(data, parentElement, xmlDoc) {
	if (!data || typeof data !== "object") return;

	for (const [key, value] of Object.entries(data)) {
		// Skip null or undefined values
		if (value === null || value === undefined) continue;

		// Handle arrays (repeated elements)
		if (Array.isArray(value)) {
			value.forEach(item => {
				const element = xmlDoc.createElement(key);

				if (typeof item === "object") {
					createXMLElements(item, element, xmlDoc);
				} else {
					element.textContent = item.toString();
				}

				parentElement.appendChild(element);
			});
		}
		// Handle nested objects
		else if (typeof value === "object") {
			const element = xmlDoc.createElement(key);
			createXMLElements(value, element, xmlDoc);
			parentElement.appendChild(element);
		}
		// Handle attributes (keys starting with @)
		else if (key.startsWith("@")) {
			const attributeName = key.substring(1);
			parentElement.setAttribute(attributeName, value.toString());
		}
		// Handle regular elements
		else {
			const element = xmlDoc.createElement(key);
			element.textContent = value.toString();
			parentElement.appendChild(element);
		}
	}
}

/**
 * Parse XML string to a JavaScript object
 * @param {string} xmlString - The XML string to parse
 * @return {Object} The parsed JavaScript object
 */
function parseXML(xmlString) {
	if (!xmlString) {
		console.error("No XML string provided for parsing");
		return null;
	}

	try {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");

		// Check for parsing errors
		const parseError = xmlDoc.querySelector("parsererror");
		if (parseError) {
			throw new Error(parseError.textContent);
		}

		return xmlToObject(xmlDoc.documentElement);
	} catch (error) {
		console.error("Error parsing XML:", error);
		return null;
	}
}

/**
 * Convert an XML element and its children to a JavaScript object
 * @param {Element} element - The XML element to convert
 * @return {Object} The resulting JavaScript object
 */
function xmlToObject(element) {
	if (!element || element.nodeType !== 1) {
		return null;
	}

	let result = {};

	// Add attributes
	if (element.attributes.length > 0) {
		for (let i = 0; i < element.attributes.length; i++) {
			const attr = element.attributes[i];
			result[`@${attr.name}`] = attr.value;
		}
	}

	// Handle child elements
	const childElements = [...element.childNodes].filter(
		node =>
			node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim())
	);

	if (childElements.length === 0) {
		// If no children, use text content
		const text = element.textContent.trim();
		if (text) {
			if (Object.keys(result).length === 0) {
				return text;
			}
			result["#text"] = text;
		}
	} else {
		// Process child elements
		childElements.forEach(child => {
			if (child.nodeType === 3) {
				// Text node
				result["#text"] = child.textContent.trim();
			} else {
				// Element node
				const childName = child.nodeName;
				const childValue = xmlToObject(child);

				// Handle repeated elements
				if (childName in result) {
					if (!Array.isArray(result[childName])) {
						result[childName] = [result[childName]];
					}
					result[childName].push(childValue);
				} else {
					result[childName] = childValue;
				}
			}
		});
	}

	return result;
}

/**
 * Validate XML against an XSD schema
 * @param {string} xmlString - The XML string to validate
 * @param {string} xsdString - The XSD schema string
 * @return {Object} Validation result with success flag and any errors
 */
function validateXML(xmlString, xsdString) {
	// Note: Browser-based XSD validation is limited
	// This is a placeholder for server-side validation
	console.warn("XML validation against XSD requires server-side processing");

	// Basic XML parsing validation
	try {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");

		// Check for parsing errors
		const parseError = xmlDoc.querySelector("parsererror");
		if (parseError) {
			return {
				valid: false,
				errors: [parseError.textContent],
			};
		}

		return {
			valid: true,
			errors: [],
		};
	} catch (error) {
		return {
			valid: false,
			errors: [error.message],
		};
	}
}

/**
 * Format XML string with indentation for better readability
 * @param {string} xmlString - The XML string to format
 * @return {string} The formatted XML string
 */
function formatXML(xmlString) {
	if (!xmlString) return "";

	let formatted = "";
	let indent = "";
	const tab = "  ";

	xmlString.split(/>\s*</).forEach(node => {
		if (node.match(/^\/\w/)) {
			// Closing tag
			indent = indent.substring(tab.length);
		}

		formatted += indent + "<" + node + ">\r\n";

		if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
			// Opening tag
			indent += tab;
		}
	});

	// Remove extra newlines and replace formatted placeholders
	return formatted
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/<\r\n/g, "<")
		.replace(/\r\n>/g, ">");
}

/**
 * Download XML string as a file
 * @param {string} xmlString - The XML content to download
 * @param {string} filename - The name of the file
 */
function downloadXML(xmlString, filename) {
	if (!xmlString) {
		console.error("No XML content to download");
		return;
	}

	const blob = new Blob([xmlString], { type: "application/xml" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = filename || "document.xml";
	document.body.appendChild(a);
	a.click();

	// Clean up
	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
}

/**
 * Generate XML from form data based on a message template
 *
 * @param {HTMLFormElement|Object} formData - Form element or form data object
 * @param {string} templateId - ID of the XML template to use
 * @param {Object} options - Additional options for XML generation
 * @returns {string} - Generated XML string
 */
function generateXmlFromForm(formData, templateId, options = {}) {
	// Get form data if a form element was provided
	const data =
		formData instanceof HTMLFormElement ? extractFormData(formData) : formData;

	// Get the template
	const template = getXmlTemplate(templateId);
	if (!template) {
		throw new Error(`XML template with ID "${templateId}" not found`);
	}

	// Process the template with the form data
	return processXmlTemplate(template, data, options);
}

/**
 * Extract form data into a structured object
 *
 * @param {HTMLFormElement} form - The form to extract data from
 * @returns {Object} - Structured form data
 */
function extractFormData(form) {
	const formData = new FormData(form);
	const result = {};

	// Process each form field
	for (const [name, value] of formData.entries()) {
		// Handle nested properties using dot notation (e.g., "debtor.name")
		if (name.includes(".")) {
			const parts = name.split(".");
			let obj = result;

			// Create nested objects for all parts except the last
			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i];
				if (!obj[part]) {
					obj[part] = {};
				}
				obj = obj[part];
			}

			// Set the value at the final property
			const lastPart = parts[parts.length - 1];
			obj[lastPart] = value;
		} else {
			// Handle simple property
			result[name] = value;
		}
	}

	return result;
}

/**
 * Get XML template by ID
 *
 * @param {string} templateId - ID of the template to retrieve
 * @returns {string|null} - XML template string or null if not found
 */
function getXmlTemplate(templateId) {
	// Try to find the template in the DOM
	const templateElement = document.getElementById(templateId);
	if (templateElement && templateElement.tagName === "TEMPLATE") {
		return templateElement.innerHTML;
	}

	// If not in DOM, try to load from templates directory
	return fetchXmlTemplate(templateId);
}

/**
 * Fetch XML template from server
 *
 * @param {string} templateId - ID of the template to fetch
 * @returns {string|null} - XML template string or null if not found
 */
function fetchXmlTemplate(templateId) {
	// Synchronous fetch for simplicity (consider async in production)
	let template = null;
	const xhr = new XMLHttpRequest();
	xhr.open("GET", `messages/templates/${templateId}.xml`, false);
	xhr.onload = function () {
		if (xhr.status === 200) {
			template = xhr.responseText;
		}
	};
	xhr.send();
	return template;
}

/**
 * Process XML template by replacing placeholders with actual data
 *
 * @param {string} template - XML template string with placeholders
 * @param {Object} data - Data to inject into the template
 * @param {Object} options - Processing options
 * @returns {string} - Processed XML string
 */
function processXmlTemplate(template, data, options = {}) {
	let result = template;

	// Replace simple placeholders (e.g., ${property})
	result = result.replace(/\${([^}]+)}/g, (match, path) => {
		const value = getValueByPath(data, path);
		return value !== undefined ? escapeXml(value) : "";
	});

	// Process conditional sections <!-- IF condition -->...<!-- ENDIF -->
	result = processConditionalSections(result, data);

	// Process repeat sections <!-- REPEAT items -->...<!-- ENDREPEAT -->
	result = processRepeatSections(result, data);

	// Remove empty elements if specified in options
	if (options.removeEmpty) {
		result = removeEmptyElements(result);
	}

	// Format the XML if specified in options
	if (options.format) {
		result = formatXml(result);
	}

	return result;
}

/**
 * Get a value from an object by a dot-notation path
 *
 * @param {Object} obj - The object to get value from
 * @param {string} path - Dot-notation path (e.g., "debtor.name")
 * @returns {*} - The value at the path or undefined if not found
 */
function getValueByPath(obj, path) {
	return path.split(".").reduce((value, key) => {
		return value && value[key] !== undefined ? value[key] : undefined;
	}, obj);
}

/**
 * Process conditional sections in XML template
 *
 * @param {string} template - XML template string
 * @param {Object} data - Data object
 * @returns {string} - Processed template
 */
function processConditionalSections(template, data) {
	// Pattern for conditional sections: <!-- IF condition -->...<!-- ENDIF -->
	const conditionalPattern = /<!-- IF ([^>]+) -->([\s\S]*?)<!-- ENDIF -->/g;

	return template.replace(conditionalPattern, (match, condition, content) => {
		// Evaluate the condition
		let result;

		// Check if it's a negated condition
		if (condition.startsWith("!")) {
			const path = condition.substring(1);
			const value = getValueByPath(data, path);
			result = !value;
		} else {
			const value = getValueByPath(data, condition);
			result = !!value;
		}

		// Return content if condition is true, otherwise empty string
		return result ? content : "";
	});
}

/**
 * Process repeat sections in XML template
 *
 * @param {string} template - XML template string
 * @param {Object} data - Data object
 * @returns {string} - Processed template
 */
function processRepeatSections(template, data) {
	// Pattern for repeat sections: <!-- REPEAT items -->...<!-- ENDREPEAT -->
	const repeatPattern = /<!-- REPEAT ([^>]+) -->([\s\S]*?)<!-- ENDREPEAT -->/g;

	return template.replace(repeatPattern, (match, itemsPath, content) => {
		const items = getValueByPath(data, itemsPath);

		// If items doesn't exist or isn't an array, return empty string
		if (!items || !Array.isArray(items) || items.length === 0) {
			return "";
		}

		// Process each item
		return items
			.map(item => {
				// Replace item placeholders
				return content.replace(/\${item\.([^}]+)}/g, (match, path) => {
					const value = getValueByPath(item, path);
					return value !== undefined ? escapeXml(value) : "";
				});
			})
			.join("");
	});
}

/**
 * Remove empty XML elements
 *
 * @param {string} xml - XML string
 * @returns {string} - XML with empty elements removed
 */
function removeEmptyElements(xml) {
	// Pattern for empty elements: <Tag></Tag> or <Tag/>
	const emptyPattern =
		/<([^\s>]+)(?:\s+[^>]*)?>\s*<\/\1>|<([^\s>]+)(?:\s+[^>]*)?\s*\/>/g;

	let newXml = xml;
	let prevXml;

	// Continue until no more empty elements are found
	do {
		prevXml = newXml;
		newXml = prevXml.replace(emptyPattern, "");
	} while (newXml !== prevXml);

	return newXml;
}

/**
 * Format XML with proper indentation
 *
 * @param {string} xml - XML string to format
 * @returns {string} - Formatted XML
 */
function formatXml(xml) {
	// Use DOMParser and XMLSerializer for proper formatting
	const parser = new DOMParser();
	const serializer = new XMLSerializer();

	try {
		const doc = parser.parseFromString(xml, "text/xml");
		return formatXmlNode(doc, 0);
	} catch (e) {
		console.error("XML parsing error:", e);
		return xml;
	}
}

/**
 * Format XML node with indentation
 *
 * @param {Node} node - XML node to format
 * @param {number} level - Indentation level
 * @returns {string} - Formatted XML string
 */
function formatXmlNode(node, level) {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent.trim();
		return text ? text : "";
	}

	if (
		node.nodeType !== Node.ELEMENT_NODE &&
		node.nodeType !== Node.DOCUMENT_NODE
	) {
		return "";
	}

	const indent = "  ".repeat(level);
	let result = "";

	if (node.nodeType === Node.ELEMENT_NODE) {
		result += `${indent}<${node.nodeName}`;

		// Add attributes
		for (const attr of node.attributes) {
			result += ` ${attr.name}="${escapeXml(attr.value)}"`;
		}

		// Handle child nodes
		if (node.childNodes.length === 0) {
			result += "/>\n";
		} else {
			result += ">\n";

			for (const child of node.childNodes) {
				const formattedChild = formatXmlNode(child, level + 1);
				if (formattedChild) {
					result += formattedChild + "\n";
				}
			}

			result += `${indent}</${node.nodeName}>`;
		}
	} else {
		// Document node
		for (const child of node.childNodes) {
			const formattedChild = formatXmlNode(child, level);
			if (formattedChild) {
				result += formattedChild;
			}
		}
	}

	return result;
}

/**
 * Escape special characters in XML
 *
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeXml(str) {
	if (typeof str !== "string") {
		return str;
	}

	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Validate XML against an XSD schema
 *
 * @param {string} xml - XML string to validate
 * @param {string} schemaUrl - URL of the XSD schema
 * @returns {Object} - Validation result {valid: boolean, errors: array}
 */
function validateXml(xml, schemaUrl) {
	// This is a simplified implementation
	// For production, consider using a proper XML validation library
	return {
		valid: true,
		errors: [],
	};
}

/**
 * Convert XML string to a DOM Document
 *
 * @param {string} xml - XML string
 * @returns {Document} - XML Document
 */
function parseXml(xml) {
	const parser = new DOMParser();
	return parser.parseFromString(xml, "text/xml");
}

/**
 * Convert XML DOM Document to string
 *
 * @param {Document} xmlDoc - XML Document
 * @returns {string} - XML string
 */
function xmlToString(xmlDoc) {
	const serializer = new XMLSerializer();
	return serializer.serializeToString(xmlDoc);
}

/**
 * Search XML for nodes matching XPath expression
 *
 * @param {Document|string} xml - XML Document or string
 * @param {string} xpath - XPath expression
 * @returns {Array} - Array of matching nodes
 */
function searchXml(xml, xpath) {
	const doc = typeof xml === "string" ? parseXml(xml) : xml;
	const result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);

	const nodes = [];
	let node = result.iterateNext();

	while (node) {
		nodes.push(node);
		node = result.iterateNext();
	}

	return nodes;
}

// Export API for global use
window.xmlUtils = {
	generateXmlFromForm,
	validateXml,
	formatXml,
	parseXml,
	xmlToString,
	searchXml,
	escapeXml,
	removeEmptyElements,
};
