document.addEventListener("DOMContentLoaded", function () {
	// DOM Elements
	const sourceFormatSelect = document.getElementById("sourceFormat");
	const targetFormatSelect = document.getElementById("targetFormat");
	const convertDirectionBtn = document.getElementById("convertDirection");
	const sourceEditor = document.getElementById("sourceEditor");
	const targetEditor = document.getElementById("targetEditor");
	const mappingContainer = document.getElementById("mappingContainer");
	const convertDataBtn = document.getElementById("convertData");
	const newFileBtn = document.getElementById("newFile");
	const loadFileBtn = document.getElementById("loadFile");
	const saveFileBtn = document.getElementById("saveFile");
	const loadTemplateBtn = document.getElementById("loadTemplate");
	const saveTemplateBtn = document.getElementById("saveTemplate");
	const formatSourceBtn = document.getElementById("formatSource");
	const clearSourceBtn = document.getElementById("clearSource");
	const loadSourceExampleBtn = document.getElementById("loadSourceExample");
	const resetMappingBtn = document.getElementById("resetMapping");
	const formatTargetBtn = document.getElementById("formatTarget");
	const copyTargetBtn = document.getElementById("copyTarget");
	const toggleThemeBtn = document.getElementById("toggleTheme");
	const toggleThemeText = document.querySelector(".toggle-text");
	const toggleOptionsBtn = document.getElementById("toggleOptions");
	const fileInput = document.getElementById("fileInput");
	const templatesModal = document.getElementById("templatesModal");
	const closeModalBtn = document.querySelector(".close-modal");
	const notification = document.getElementById("notification");
	const notificationMessage = document.getElementById("notificationMessage");
	const xmlOptionsSection = document.getElementById("xmlOptions");
	const csvOptionsSection = document.getElementById("csvOptions");
	const swapFormatsBtn = document.getElementById("swapFormats");

	// CodeMirror instances
	let sourceCodeMirror = CodeMirror.fromTextArea(sourceEditor, {
		lineNumbers: true,
		mode: "xml",
		theme: "mdn-like",
		lineWrapping: true,
		indentUnit: 2,
		extraKeys: { "Ctrl-Space": "autocomplete" },
	});

	let targetCodeMirror = CodeMirror.fromTextArea(targetEditor, {
		lineNumbers: true,
		mode: "javascript",
		theme: "mdn-like",
		lineWrapping: true,
		indentUnit: 2,
		readOnly: true,
	});

	// Configuration and state
	let currentMapping = [];
	let currentSourceFormat = "xml";
	let currentTargetFormat = "json";
	let optionsPanelVisible = true;

	// Initialize the UI
	initTheme();
	updateFormatSpecificOptions();

	// Event Listeners
	sourceFormatSelect.addEventListener("change", () => {
		currentSourceFormat = sourceFormatSelect.value;
		updateSourceEditorMode(currentSourceFormat);
		updateFormatSpecificOptions();
	});

	targetFormatSelect.addEventListener("change", () => {
		currentTargetFormat = targetFormatSelect.value;
		updateTargetEditorMode(currentTargetFormat);
		updateFormatSpecificOptions();
	});

	convertDirectionBtn.addEventListener("click", swapFormats);
	swapFormatsBtn.addEventListener("click", swapFormats);
	convertDataBtn.addEventListener("click", convertData);
	newFileBtn.addEventListener("click", newFile);
	loadFileBtn.addEventListener("click", () => fileInput.click());
	saveFileBtn.addEventListener("click", saveFile);
	loadTemplateBtn.addEventListener("click", openTemplatesModal);
	saveTemplateBtn.addEventListener("click", saveAsTemplate);
	formatSourceBtn.addEventListener("click", formatSource);
	clearSourceBtn.addEventListener("click", clearSource);
	loadSourceExampleBtn.addEventListener("click", loadExample);
	resetMappingBtn.addEventListener("click", resetMapping);
	formatTargetBtn.addEventListener("click", formatTarget);
	copyTargetBtn.addEventListener("click", copyTargetToClipboard);
	toggleThemeBtn.addEventListener("click", toggleTheme);
	toggleOptionsBtn.addEventListener("click", toggleOptions);

	fileInput.addEventListener("change", handleFileSelect);
	closeModalBtn.addEventListener("click", closeTemplatesModal);

	// Close the templates modal when clicking outside
	window.addEventListener("click", e => {
		if (e.target === templatesModal) {
			closeTemplatesModal();
		}
	});

	// Select template when clicked
	document.querySelectorAll(".template-item").forEach(item => {
		item.addEventListener("click", () =>
			loadTemplateData(item.dataset.template)
		);
	});

	// CodeMirror change event - update mapping when source changes
	sourceCodeMirror.on(
		"change",
		debounce(function () {
			if (document.querySelector(".mapping-field")) {
				updateMappingPreview();
			}
		}, 500)
	);

	// Helper Functions

	// Initialize theme based on saved preference
	function initTheme() {
		const darkModePreferred = localStorage.getItem("darkMode") === "true";
		if (darkModePreferred) {
			document.documentElement.classList.add("dark-mode");
			sourceCodeMirror.setOption("theme", "material-darker");
			targetCodeMirror.setOption("theme", "material-darker");
		} else {
			document.documentElement.classList.remove("dark-mode");
			sourceCodeMirror.setOption("theme", "mdn-like");
			targetCodeMirror.setOption("theme", "mdn-like");
		}
		updateThemeText();
	}

	// Update theme toggle button text
	function updateThemeText() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		toggleThemeText.textContent = isDarkMode ? "Tryb jasny" : "Tryb ciemny";
	}

	// Toggle between light and dark theme
	function toggleTheme() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");

		if (isDarkMode) {
			document.documentElement.classList.remove("dark-mode");
			sourceCodeMirror.setOption("theme", "mdn-like");
			targetCodeMirror.setOption("theme", "mdn-like");
		} else {
			document.documentElement.classList.add("dark-mode");
			sourceCodeMirror.setOption("theme", "material-darker");
			targetCodeMirror.setOption("theme", "material-darker");
		}

		updateThemeText();
		localStorage.setItem("darkMode", !isDarkMode);
	}

	// Update the CodeMirror mode for source editor based on selected format
	function updateSourceEditorMode(format) {
		switch (format) {
			case "xml":
				sourceCodeMirror.setOption("mode", "xml");
				break;
			case "json":
				sourceCodeMirror.setOption("mode", "application/json");
				break;
			case "yaml":
				sourceCodeMirror.setOption("mode", "yaml");
				break;
			case "csv":
				sourceCodeMirror.setOption("mode", "text/plain");
				break;
			default:
				sourceCodeMirror.setOption("mode", "text/plain");
		}
	}

	// Update the CodeMirror mode for target editor based on selected format
	function updateTargetEditorMode(format) {
		switch (format) {
			case "xml":
				targetCodeMirror.setOption("mode", "xml");
				break;
			case "json":
				targetCodeMirror.setOption("mode", "application/json");
				break;
			case "yaml":
				targetCodeMirror.setOption("mode", "yaml");
				break;
			case "csv":
				targetCodeMirror.setOption("mode", "text/plain");
				break;
			default:
				targetCodeMirror.setOption("mode", "text/plain");
		}
	}

	// Show or hide format-specific options based on selected formats
	function updateFormatSpecificOptions() {
		// Show/hide XML options
		if (currentSourceFormat === "xml" || currentTargetFormat === "xml") {
			xmlOptionsSection.style.display = "block";
		} else {
			xmlOptionsSection.style.display = "none";
		}

		// Show/hide CSV options
		if (currentSourceFormat === "csv" || currentTargetFormat === "csv") {
			csvOptionsSection.style.display = "block";
		} else {
			csvOptionsSection.style.display = "none";
		}
	}

	// Display a notification message
	function showNotification(message, type = "success") {
		notificationMessage.textContent = message;

		// Set notification type
		notification.className = "notification";
		notification.classList.add(`notification-${type}`);

		// Show notification
		notification.style.display = "block";

		// Hide after a delay
		setTimeout(() => {
			notification.style.display = "none";
		}, 3000);
	}

	// Toggle options panel visibility
	function toggleOptions() {
		const optionsContent = document.querySelector(
			".options-panel .panel-content"
		);
		const icon = toggleOptionsBtn.querySelector("i");

		if (optionsPanelVisible) {
			optionsContent.style.display = "none";
			icon.className = "fas fa-chevron-down";
		} else {
			optionsContent.style.display = "block";
			icon.className = "fas fa-chevron-up";
		}

		optionsPanelVisible = !optionsPanelVisible;
	}

	// Open templates modal
	function openTemplatesModal() {
		templatesModal.style.display = "flex";
	}

	// Close templates modal
	function closeTemplatesModal() {
		templatesModal.style.display = "none";
	}

	// Swap source and target formats
	function swapFormats() {
		// Store current values
		const tempSourceFormat = sourceFormatSelect.value;
		const tempTargetFormat = targetFormatSelect.value;
		const tempSourceContent = sourceCodeMirror.getValue();
		const tempTargetContent = targetCodeMirror.getValue();

		// Swap formats
		sourceFormatSelect.value = tempTargetFormat;
		targetFormatSelect.value = tempSourceFormat;

		// Update current format variables
		currentSourceFormat = tempTargetFormat;
		currentTargetFormat = tempSourceFormat;

		// Update editor modes
		updateSourceEditorMode(currentSourceFormat);
		updateTargetEditorMode(currentTargetFormat);

		// Swap content if target has content
		if (tempTargetContent.trim()) {
			sourceCodeMirror.setValue(tempTargetContent);
			targetCodeMirror.setValue("");
		}

		// Update options
		updateFormatSpecificOptions();

		// Reset mapping
		resetMapping();

		showNotification("Formaty zostały zamienione");
	}

	// Format the source code
	function formatSource() {
		const sourceText = sourceCodeMirror.getValue();
		if (!sourceText.trim()) return;

		try {
			const formattedText = formatByType(sourceText, currentSourceFormat);
			sourceCodeMirror.setValue(formattedText);
			showNotification("Kod źródłowy został sformatowany");
		} catch (error) {
			console.error("Error formatting source:", error);
			showNotification("Błąd podczas formatowania kodu źródłowego", "error");
		}
	}

	// Format the target code
	function formatTarget() {
		const targetText = targetCodeMirror.getValue();
		if (!targetText.trim()) return;

		try {
			const formattedText = formatByType(targetText, currentTargetFormat);
			targetCodeMirror.setValue(formattedText);
			showNotification("Kod wynikowy został sformatowany");
		} catch (error) {
			console.error("Error formatting target:", error);
			showNotification("Błąd podczas formatowania kodu wynikowego", "error");
		}
	}

	// Format text based on its type
	function formatByType(text, type) {
		switch (type) {
			case "json":
				return JSON.stringify(JSON.parse(text), null, 2);
			case "xml":
				return formatXmlString(text);
			case "yaml":
				return jsyaml.dump(jsyaml.load(text), { indent: 2 });
			case "csv":
				// Simple CSV formatting - just ensure consistent line endings
				return text.replace(/\r\n|\n|\r/g, "\n");
			default:
				return text;
		}
	}

	// Format XML string (reused from xml-generator)
	function formatXmlString(xmlString) {
		let formatted = "";
		let indent = "";
		const tab = "  ";

		xmlString.split(/>\s*</).forEach(function (node, index) {
			if (node.match(/^\/\w/)) {
				// If this tag is a closing tag
				indent = indent.substring(tab.length);
			}

			formatted += indent + "<" + node + ">\r\n";

			if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
				// If this tag is an opening tag and not a self-closing tag
				indent += tab;
			}
		});

		// Remove extra new lines
		return formatted
			.replace(/(<\/.*?>)\r\n/g, "$1\r\n")
			.replace(/^\s*[\r\n]/gm, "");
	}

	// Clear source editor
	function clearSource() {
		if (confirm("Czy na pewno chcesz wyczyścić dane źródłowe?")) {
			sourceCodeMirror.setValue("");
			resetMapping();
			showNotification("Dane źródłowe zostały wyczyszczone");
		}
	}

	// Reset the mapping panel
	function resetMapping() {
		mappingContainer.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i> Wprowadź dane źródłowe i kliknij "Konwertuj" aby
                wygenerować mapowanie pól.
            </div>
        `;
		currentMapping = [];
	}

	// New file operation
	function newFile() {
		if (
			confirm(
				"Czy na pewno chcesz utworzyć nowy plik? Wszystkie niezapisane zmiany zostaną utracone."
			)
		) {
			sourceCodeMirror.setValue("");
			targetCodeMirror.setValue("");
			resetMapping();
			showNotification("Utworzono nowy plik");
		}
	}

	// Load example data based on the selected source format
	function loadExample() {
		let exampleData = "";

		switch (currentSourceFormat) {
			case "xml":
				exampleData = `<?xml version="1.0" encoding="UTF-8"?>
<contacts>
  <contact id="1">
    <name>Jan Kowalski</name>
    <email>jan.kowalski@example.com</email>
    <phone type="mobile">+48 123 456 789</phone>
    <address>
      <street>ul. Przykładowa 1</street>
      <city>Warszawa</city>
      <postalCode>00-001</postalCode>
      <country>Polska</country>
    </address>
  </contact>
  <contact id="2">
    <name>Anna Nowak</name>
    <email>anna.nowak@example.com</email>
    <phone type="home">+48 987 654 321</phone>
    <address>
      <street>ul. Testowa 5</street>
      <city>Kraków</city>
      <postalCode>30-001</postalCode>
      <country>Polska</country>
    </address>
  </contact>
</contacts>`;
				break;

			case "json":
				exampleData = `{
  "products": [
    {
      "id": 1,
      "name": "Laptop XYZ",
      "price": 3499.99,
      "inStock": true,
      "specs": {
        "cpu": "Intel Core i7",
        "ram": "16GB",
        "storage": "512GB SSD"
      },
      "colors": ["silver", "black", "white"]
    },
    {
      "id": 2,
      "name": "Smartfon ABC",
      "price": 1999.99,
      "inStock": false,
      "specs": {
        "screen": "6.5 inch",
        "camera": "48MP",
        "battery": "4500mAh"
      },
      "colors": ["black", "blue", "red"]
    }
  ],
  "store": {
    "name": "Elektronika Express",
    "location": "Warszawa",
    "established": 2010
  }
}`;
				break;

			case "yaml":
				exampleData = `# Przykładowa konfiguracja
server:
  port: 8080
  host: localhost
  timeout: 30s
  
database:
  host: db.example.com
  port: 5432
  credentials:
    username: admin
    password: secure_password
  
logging:
  level: info
  file: /var/log/app.log
  
features:
  authentication: true
  caching: true
  metrics: false`;
				break;

			case "csv":
				exampleData = `id,name,email,department,salary
1,Jan Kowalski,jan.kowalski@example.com,IT,7500
2,Anna Nowak,anna.nowak@example.com,HR,6800
3,Piotr Wiśniewski,piotr.wisniewski@example.com,Marketing,7200
4,Katarzyna Dąbrowska,katarzyna.dabrowska@example.com,Finance,8100
5,Michał Lewandowski,michal.lewandowski@example.com,IT,7900`;
				break;
		}

		sourceCodeMirror.setValue(exampleData);
		showNotification("Załadowano przykładowe dane");
	}

	// Handle file selection for loading
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (e) {
			sourceCodeMirror.setValue(e.target.result);

			// Try to auto-detect format from file extension if not matching current
			const extension = file.name.split(".").pop().toLowerCase();

			if (extension === "json" && currentSourceFormat !== "json") {
				sourceFormatSelect.value = "json";
				currentSourceFormat = "json";
				updateSourceEditorMode("json");
			} else if (
				(extension === "xml" || extension === "xsd") &&
				currentSourceFormat !== "xml"
			) {
				sourceFormatSelect.value = "xml";
				currentSourceFormat = "xml";
				updateSourceEditorMode("xml");
			} else if (
				(extension === "yml" || extension === "yaml") &&
				currentSourceFormat !== "yaml"
			) {
				sourceFormatSelect.value = "yaml";
				currentSourceFormat = "yaml";
				updateSourceEditorMode("yaml");
			} else if (extension === "csv" && currentSourceFormat !== "csv") {
				sourceFormatSelect.value = "csv";
				currentSourceFormat = "csv";
				updateSourceEditorMode("csv");
			}

			updateFormatSpecificOptions();
			showNotification(`Wczytano plik ${file.name}`);
		};
		reader.readAsText(file);

		// Reset the input to allow selecting the same file again
		event.target.value = "";
	}

	// Save file
	function saveFile() {
		const content = targetCodeMirror.getValue();
		if (!content.trim()) {
			showNotification("Brak danych do zapisania", "error");
			return;
		}

		let extension;
		switch (currentTargetFormat) {
			case "json":
				extension = ".json";
				break;
			case "xml":
				extension = ".xml";
				break;
			case "yaml":
				extension = ".yaml";
				break;
			case "csv":
				extension = ".csv";
				break;
			default:
				extension = ".txt";
		}

		const fileName = `converted_data${extension}`;

		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.style.display = "none";

		document.body.appendChild(a);
		a.click();

		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);

		showNotification(`Plik zapisany jako ${fileName}`);
	}

	// Copy target content to clipboard
	function copyTargetToClipboard() {
		const content = targetCodeMirror.getValue();
		if (!content.trim()) {
			showNotification("Brak danych do skopiowania", "error");
			return;
		}

		try {
			navigator.clipboard.writeText(content).then(
				function () {
					showNotification("Skopiowano do schowka");
				},
				function (err) {
					console.error("Nie udało się skopiować:", err);
					showNotification("Błąd podczas kopiowania do schowka", "error");
				}
			);
		} catch (error) {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = content;
			document.body.appendChild(textarea);
			textarea.select();

			try {
				document.execCommand("copy");
				showNotification("Skopiowano do schowka");
			} catch (err) {
				console.error("Nie udało się skopiować:", err);
				showNotification("Błąd podczas kopiowania do schowka", "error");
			}

			document.body.removeChild(textarea);
		}
	}

	// Load template data
	function loadTemplateData(templateId) {
		if (!templateId) return;

		let sourceData = "";
		let targetFormatVal = "";
		let sourceFormatVal = "";

		switch (templateId) {
			case "contact-xml-json":
				sourceFormatVal = "xml";
				targetFormatVal = "json";
				sourceData = `<?xml version="1.0" encoding="UTF-8"?>
<contacts>
  <contact id="1">
    <name>Jan Kowalski</name>
    <email>jan.kowalski@example.com</email>
    <phone type="mobile">+48 123 456 789</phone>
    <address>
      <street>ul. Przykładowa 1</street>
      <city>Warszawa</city>
      <postalCode>00-001</postalCode>
      <country>Polska</country>
    </address>
  </contact>
</contacts>`;
				break;

			case "invoice-json-xml":
				sourceFormatVal = "json";
				targetFormatVal = "xml";
				sourceData = `{
  "invoice": {
    "invoiceNumber": "FV/2024/06/001",
    "date": "2024-06-15",
    "seller": {
      "name": "Firma XYZ Sp. z o.o.",
      "address": "ul. Biznesowa 10, 00-001 Warszawa",
      "taxId": "PL1234567890"
    },
    "buyer": {
      "name": "Klient ABC S.A.",
      "address": "ul. Klientów 5, 00-002 Warszawa",
      "taxId": "PL0987654321"
    },
    "items": [
      {
        "name": "Produkt 1",
        "quantity": 2,
        "unitPrice": 100.00,
        "currency": "PLN",
        "totalPrice": 200.00,
        "taxRate": "23%"
      },
      {
        "name": "Usługa 1",
        "quantity": 1,
        "unitPrice": 300.00,
        "currency": "PLN",
        "totalPrice": 300.00,
        "taxRate": "23%"
      }
    ],
    "summary": {
      "totalNet": 500.00,
      "totalTax": 115.00,
      "totalGross": 615.00,
      "currency": "PLN"
    }
  }
}`;
				break;

			case "csv-json":
				sourceFormatVal = "csv";
				targetFormatVal = "json";
				sourceData = `id,name,email,department,salary
1,Jan Kowalski,jan.kowalski@example.com,IT,7500
2,Anna Nowak,anna.nowak@example.com,HR,6800
3,Piotr Wiśniewski,piotr.wisniewski@example.com,Marketing,7200`;
				break;

			case "config-yaml-json":
				sourceFormatVal = "yaml";
				targetFormatVal = "json";
				sourceData = `# Configuration
server:
  port: 8080
  host: localhost
  timeout: 30s
  
database:
  host: db.example.com
  port: 5432
  credentials:
    username: admin
    password: secure_password
  
logging:
  level: info
  file: /var/log/app.log`;
				break;
		}

		// Update source and target formats
		sourceFormatSelect.value = sourceFormatVal;
		targetFormatSelect.value = targetFormatVal;
		currentSourceFormat = sourceFormatVal;
		currentTargetFormat = targetFormatVal;

		// Update editor modes
		updateSourceEditorMode(currentSourceFormat);
		updateTargetEditorMode(currentTargetFormat);

		// Set source data
		sourceCodeMirror.setValue(sourceData);

		// Clear target
		targetCodeMirror.setValue("");

		// Update options
		updateFormatSpecificOptions();

		// Convert the data immediately
		convertData();

		closeTemplatesModal();
		showNotification("Załadowano szablon");
	}

	// Save current configuration as template (in a real app, this would be stored)
	function saveAsTemplate() {
		if (!sourceCodeMirror.getValue().trim()) {
			showNotification("Brak danych do zapisania jako szablon", "error");
			return;
		}

		const templateName = prompt("Podaj nazwę szablonu:");
		if (!templateName) return;

		showNotification(`Szablon "${templateName}" został zapisany`);
		// In a real app, this would store the template
	}

	// Main conversion function
	function convertData() {
		const sourceText = sourceCodeMirror.getValue();
		if (!sourceText.trim()) {
			showNotification("Wprowadź dane źródłowe", "error");
			return;
		}

		try {
			// Parse source data
			const sourceData = parseSourceData(sourceText, currentSourceFormat);

			// Generate field mapping if not already exists
			if (!currentMapping.length) {
				currentMapping = generateMapping(
					sourceData,
					currentSourceFormat,
					currentTargetFormat
				);
				displayMapping(currentMapping);
			}

			// Convert data based on mapping
			const convertedData = convertDataWithMapping(
				sourceData,
				currentMapping,
				currentTargetFormat
			);

			// Format and display the result
			const formattedResult = formatResult(convertedData, currentTargetFormat);
			targetCodeMirror.setValue(formattedResult);

			showNotification("Dane zostały przekonwertowane");
		} catch (error) {
			console.error("Error converting data:", error);
			showNotification(`Błąd konwersji: ${error.message}`, "error");
		}
	}

	// Parse source data based on format
	function parseSourceData(text, format) {
		try {
			switch (format) {
				case "json":
					return JSON.parse(text);

				case "xml":
					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(text, "text/xml");

					// Check for parsing errors
					const parseError = xmlDoc.querySelector("parsererror");
					if (parseError) {
						throw new Error("Invalid XML: " + parseError.textContent);
					}

					return xmlToJson(xmlDoc);

				case "yaml":
					return jsyaml.load(text);

				case "csv":
					const delimiter = document.getElementById("delimiter").value;
					const includeHeaders =
						document.getElementById("includeHeaders").checked;

					const parseResult = Papa.parse(text, {
						header: includeHeaders,
						delimiter: delimiter,
						skipEmptyLines: true,
					});

					if (parseResult.errors && parseResult.errors.length > 0) {
						console.warn("CSV parsing warnings:", parseResult.errors);
					}

					return parseResult.data;

				default:
					throw new Error("Nieobsługiwany format źródłowy");
			}
		} catch (error) {
			throw new Error(`Błąd parsowania danych: ${error.message}`);
		}
	}

	// Format result based on target format
	function formatResult(data, format) {
		try {
			switch (format) {
				case "json":
					return JSON.stringify(data, null, 2);

				case "xml":
					const rootName =
						document.getElementById("rootElement").value || "root";
					const useAttributes =
						document.getElementById("useAttributes").checked;
					return jsonToXml(data, rootName, useAttributes);

				case "yaml":
					return jsyaml.dump(data);

				case "csv":
					const delimiter = document.getElementById("delimiter").value;

					// Handle non-array data for CSV
					let arrayData = Array.isArray(data) ? data : [data];

					// If we have objects, we need to extract headers
					if (arrayData.length > 0 && typeof arrayData[0] === "object") {
						const includeHeaders =
							document.getElementById("includeHeaders").checked;

						// Get all possible headers from all objects
						const headers = new Set();
						arrayData.forEach(item => {
							Object.keys(item).forEach(key => headers.add(key));
						});

						const headerArray = Array.from(headers);

						// Create CSV rows
						let csvContent = includeHeaders
							? headerArray.join(delimiter) + "\n"
							: "";

						arrayData.forEach(item => {
							const row = headerArray.map(header => {
								const value = item[header];
								// Handle commas and quotes in values
								if (value === null || value === undefined) return "";
								const stringValue = String(value);
								return stringValue.includes(delimiter) ||
									stringValue.includes('"')
									? `"${stringValue.replace(/"/g, '""')}"`
									: stringValue;
							});
							csvContent += row.join(delimiter) + "\n";
						});

						return csvContent;
					} else {
						return arrayData.map(item => String(item)).join("\n");
					}

				default:
					throw new Error("Nieobsługiwany format docelowy");
			}
		} catch (error) {
			throw new Error(`Błąd formatowania wyniku: ${error.message}`);
		}
	}

	// Convert XML to JSON (recursive)
	function xmlToJson(xml) {
		// Create the return object
		let obj = {};

		if (xml.nodeType === 1) {
			// element
			// Handle attributes
			if (xml.attributes.length > 0) {
				obj["@attributes"] = {};
				for (let i = 0; i < xml.attributes.length; i++) {
					const attr = xml.attributes.item(i);
					obj["@attributes"][attr.nodeName] = attr.nodeValue;
				}
			}
		} else if (xml.nodeType === 3) {
			// text
			return xml.nodeValue.trim();
		}

		// Handle children
		if (xml.hasChildNodes()) {
			for (let i = 0; i < xml.childNodes.length; i++) {
				const child = xml.childNodes.item(i);
				const nodeName = child.nodeName;

				if (child.nodeType === 3 && child.nodeValue.trim() === "") {
					continue; // Skip empty text nodes
				}

				if (child.nodeType === 1) {
					const childObj = xmlToJson(child);

					if (obj[nodeName] === undefined) {
						// First occurrence of the node name
						obj[nodeName] = childObj;
					} else {
						// Multiple same-named nodes, convert to array
						if (Array.isArray(obj[nodeName])) {
							obj[nodeName].push(childObj);
						} else {
							obj[nodeName] = [obj[nodeName], childObj];
						}
					}
				} else if (child.nodeType === 3) {
					// text
					const text = child.nodeValue.trim();
					if (text) {
						obj["#text"] = text;
					}
				}
			}
		}

		// If only text content and possibly attributes, simplify
		if (obj["#text"] && Object.keys(obj).length === 1) {
			return obj["#text"];
		} else if (
			obj["#text"] &&
			Object.keys(obj).length === 2 &&
			obj["@attributes"]
		) {
			return {
				"@attributes": obj["@attributes"],
				"#text": obj["#text"],
			};
		}

		return obj;
	}

	// Convert JSON to XML (recursive)
	function jsonToXml(data, rootName, useAttributes = false) {
		// Start with XML declaration
		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

		// Add root element
		xml += objectToXmlElement(data, rootName, useAttributes);

		return xml;
	}

	// Helper function to convert object to XML element (recursive)
	function objectToXmlElement(
		obj,
		tagName,
		useAttributes = false,
		indent = ""
	) {
		if (obj === null || obj === undefined) {
			return `${indent}<${tagName}/>\n`;
		}

		const nextIndent = indent + "  ";
		let xml = "";

		// Handle different data types
		if (typeof obj === "object") {
			if (Array.isArray(obj)) {
				// For arrays, create multiple elements with the same tag
				return obj
					.map(item => objectToXmlElement(item, tagName, useAttributes, indent))
					.join("");
			} else {
				xml += `${indent}<${tagName}`;

				// Handle attributes if enabled
				if (useAttributes && obj["@attributes"]) {
					Object.entries(obj["@attributes"]).forEach(([key, value]) => {
						xml += ` ${key}="${escapeXml(value)}"`;
					});
					delete obj["@attributes"];
				}

				// Check if we have content or just need to close the tag
				if (Object.keys(obj).length === 0) {
					xml += "/>\n";
					return xml;
				}

				xml += ">\n";

				// Special case for text content
				if (obj["#text"] !== undefined) {
					xml += `${nextIndent}${escapeXml(
						obj["#text"]
					)}\n${indent}</${tagName}>\n`;
					return xml;
				}

				// Process all child elements
				for (const [key, value] of Object.entries(obj)) {
					// Skip attributes if already processed
					if (key === "@attributes") continue;

					// Skip special keys if attributes are enabled
					if (useAttributes && key.startsWith("@")) continue;

					xml += objectToXmlElement(value, key, useAttributes, nextIndent);
				}

				xml += `${indent}</${tagName}>\n`;
			}
		} else {
			// Primitive types
			xml += `${indent}<${tagName}>${escapeXml(obj)}</${tagName}>\n`;
		}

		return xml;
	}

	// Escape XML special characters
	function escapeXml(text) {
		if (text === null || text === undefined) return "";

		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");
	}

	// Generate mapping between source and target data structures
	function generateMapping(sourceData, sourceFormat, targetFormat) {
		const mapping = [];

		// Function to recursively extract paths from object
		function extractPaths(obj, currentPath = "", result = []) {
			if (obj === null || obj === undefined) return result;

			if (typeof obj === "object") {
				if (Array.isArray(obj)) {
					// For first item in array, add a path with [*] notation
					if (obj.length > 0) {
						const arrayPath = currentPath ? `${currentPath}[*]` : "[*]";
						extractPaths(obj[0], arrayPath, result);
					}
				} else {
					// For objects, process each property
					for (const key in obj) {
						const newPath = currentPath ? `${currentPath}.${key}` : key;
						result.push(newPath);
						extractPaths(obj[key], newPath, result);
					}
				}
			}

			return result;
		}

		const paths = extractPaths(sourceData);

		// Create simple 1:1 mapping for each path
		paths.forEach(path => {
			if (!path.includes("@attributes")) {
				// Skip attribute paths for simplicity
				mapping.push({
					source: path,
					target: path, // Default to same path
					enabled: true,
				});
			}
		});

		return mapping;
	}

	// Display mapping UI
	function displayMapping(mapping) {
		mappingContainer.innerHTML = "";

		if (mapping.length === 0) {
			mappingContainer.innerHTML = `
				<div class="info-message">
					<i class="fas fa-info-circle"></i> Nie znaleziono pól do mapowania.
				</div>
			`;
			return;
		}

		// Create a mapping field for each mapping item
		mapping.forEach((item, index) => {
			const fieldElement = document.createElement("div");
			fieldElement.className = "mapping-field";

			const sourceElement = document.createElement("div");
			sourceElement.className = "mapping-source";
			const sourceInput = document.createElement("input");
			sourceInput.type = "text";
			sourceInput.value = item.source;
			sourceInput.dataset.index = index;
			sourceInput.disabled = true; // Source paths are read-only
			sourceElement.appendChild(sourceInput);

			const directionElement = document.createElement("div");
			directionElement.className = "mapping-direction";
			directionElement.innerHTML = '<i class="fas fa-arrow-right"></i>';

			const targetElement = document.createElement("div");
			targetElement.className = "mapping-target";
			const targetInput = document.createElement("input");
			targetInput.type = "text";
			targetInput.value = item.target;
			targetInput.dataset.index = index;
			targetInput.addEventListener("input", e => {
				const idx = parseInt(e.target.dataset.index);
				currentMapping[idx].target = e.target.value;
				updateMappingPreview();
			});
			targetElement.appendChild(targetInput);

			fieldElement.appendChild(sourceElement);
			fieldElement.appendChild(directionElement);
			fieldElement.appendChild(targetElement);

			mappingContainer.appendChild(fieldElement);
		});
	}

	// Update preview based on mapping changes
	function updateMappingPreview() {
		try {
			const sourceText = sourceCodeMirror.getValue();
			if (!sourceText.trim()) return;

			const sourceData = parseSourceData(sourceText, currentSourceFormat);
			const convertedData = convertDataWithMapping(
				sourceData,
				currentMapping,
				currentTargetFormat
			);
			const formattedResult = formatResult(convertedData, currentTargetFormat);

			targetCodeMirror.setValue(formattedResult);
		} catch (error) {
			console.error("Error updating mapping preview:", error);
			// Silently fail for preview updates - don't show error notifications
		}
	}

	// Convert data using the specified mapping
	function convertDataWithMapping(sourceData, mapping, targetFormat) {
		// Process based on source and target formats
		let result = {};

		// Helper to get value at a path
		function getValueAtPath(obj, path) {
			// Handle array paths with [*]
			if (path.includes("[*]")) {
				const parts = path.split("[*]");
				const arrayPath = parts[0];
				const remainingPath = parts[1]
					? parts[1].startsWith(".")
						? parts[1].substr(1)
						: parts[1]
					: "";

				// Get the array
				const array = getValueAtPath(obj, arrayPath);
				if (Array.isArray(array)) {
					return array.map(item =>
						remainingPath ? getValueAtPath(item, remainingPath) : item
					);
				}
				return undefined;
			}

			const parts = path.split(".");
			let current = obj;

			for (const part of parts) {
				if (current === null || current === undefined) return undefined;
				current = current[part];
			}

			return current;
		}

		// Helper to set value at a path
		function setValueAtPath(obj, path, value) {
			// Handle array paths with [*]
			if (path.includes("[*]")) {
				const parts = path.split("[*]");
				const arrayPath = parts[0];
				const remainingPath = parts[1]
					? parts[1].startsWith(".")
						? parts[1].substr(1)
						: parts[1]
					: "";

				// Get or create the array path
				let array = getValueAtPath(obj, arrayPath);
				if (!array) {
					setValueAtPath(obj, arrayPath, []);
					array = getValueAtPath(obj, arrayPath);
				}

				// If we have values to map
				if (Array.isArray(value)) {
					if (remainingPath) {
						// For each item in the source array, set the remaining path in target
						value.forEach((item, index) => {
							// Ensure array has enough items
							while (array.length <= index) {
								array.push({});
							}

							setValueAtPath(array[index], remainingPath, item);
						});
					} else {
						// Direct array assignment
						setValueAtPath(obj, arrayPath, value);
					}
				}

				return;
			}

			const parts = path.split(".");
			let current = obj;

			// Navigate through the path, creating objects as needed
			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i];
				if (current[part] === undefined) {
					current[part] = {};
				}
				current = current[part];
			}

			// Set the final property
			const lastPart = parts[parts.length - 1];
			current[lastPart] = value;
		}

		// Apply each enabled mapping rule
		mapping
			.filter(m => m.enabled)
			.forEach(map => {
				const value = getValueAtPath(sourceData, map.source);
				if (value !== undefined) {
					setValueAtPath(result, map.target, value);
				}
			});

		return result;
	}

	// Utility functions
	function debounce(func, wait) {
		let timeout;
		return function () {
			const context = this;
			const args = arguments;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				func.apply(context, args);
			}, wait);
		};
	}
});
