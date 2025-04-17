/**
 * Główny skrypt aplikacji ISO 20022 Generator
 *
 * Zawiera funkcje do generowania, przetwarzania i zarządzania dokumentami ISO 20022
 */

document.addEventListener("DOMContentLoaded", function () {
	// Inicjalizacja komponentów
	initApp();
});

/**
 * Inicjalizacja aplikacji
 */
function initApp() {
	// Załaduj wszystkie komponenty
	if (typeof loadAllComponents === "function") {
		loadAllComponents();
	}

	// Inicjalizacja słuchaczy zdarzeń
	initEventListeners();

	// Sprawdzanie stanu lokalnych dokumentów
	checkLocalStorage();

	console.log("Aplikacja ISO 20022 Generator została zainicjalizowana");
}

/**
 * Inicjalizacja globalnych słuchaczy zdarzeń
 */
function initEventListeners() {
	// Nawigacja
	const navLinks = document.querySelectorAll("[data-nav-target]");
	navLinks.forEach(link => {
		link.addEventListener("click", e => {
			e.preventDefault();
			const targetId = link.getAttribute("data-nav-target");
			if (typeof navigateTo === "function") {
				navigateTo(targetId);
			}
		});
	});

	// Obsługa formularzy
	document.addEventListener("submit", handleFormSubmit);

	// Obsługa zmiany motywu
	document.addEventListener("theme:changed", e => {
		console.log(`Motyw zmieniony na: ${e.detail.theme}`);
	});

	// Obsługa zapisywania do XML
	const saveButtons = document.querySelectorAll(".btn-save-xml");
	saveButtons.forEach(button => {
		button.addEventListener("click", e => {
			e.preventDefault();
			const formId = button.getAttribute("data-form-id");
			saveFormToXml(formId);
		});
	});

	// Obsługa importu XML
	const importButtons = document.querySelectorAll(".btn-import-xml");
	importButtons.forEach(button => {
		button.addEventListener("click", e => {
			e.preventDefault();
			promptForXmlImport();
		});
	});
}

/**
 * Obsługa przesyłania formularzy
 * @param {Event} e - Zdarzenie formularza
 */
function handleFormSubmit(e) {
	// Jeśli formularz ma klasę xml-form, przetwórz go
	if (e.target.classList.contains("xml-form")) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const xmlData = generateXml(formData, e.target.id);

		if (xmlData) {
			displayXmlResult(xmlData, e.target.id);
			saveToLocalStorage(e.target.id, xmlData);
		}
	}
}

/**
 * Generuje dokument XML na podstawie danych formularza
 * @param {FormData} formData - Dane z formularza
 * @param {string} formId - Identyfikator formularza
 * @returns {string} Wygenerowany dokument XML
 */
function generateXml(formData, formId) {
	try {
		// Pobierz mapowanie pól formularza do tagów XML
		const mappings = getXmlMappings(formId);
		if (!mappings) {
			console.error("Brak mapowania XML dla formularza", formId);
			return null;
		}

		// Utwórz obiekt dokumentu XML
		const xmlDoc = document.implementation.createDocument(
			null,
			"Document",
			null
		);
		const root = xmlDoc.documentElement;

		// Dodaj przestrzenie nazw
		root.setAttribute(
			"xmlns",
			"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.13"
		);
		root.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

		// Iteruj przez pola formularza i twórz strukturę XML
		for (const [fieldName, fieldValue] of formData.entries()) {
			if (!mappings[fieldName]) continue;

			const mapping = mappings[fieldName];
			createXmlNode(xmlDoc, root, mapping.path, fieldValue);
		}

		// Konwertuj dokument XML na string
		const serializer = new XMLSerializer();
		let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xmlString += serializer.serializeToString(xmlDoc);

		// Popraw formatowanie
		return formatXml(xmlString);
	} catch (error) {
		console.error("Błąd podczas generowania XML:", error);
		alert(
			"Wystąpił błąd podczas generowania dokumentu XML. Sprawdź logi konsoli."
		);
		return null;
	}
}

/**
 * Tworzy węzeł XML na podstawie ścieżki do węzła
 * @param {XMLDocument} xmlDoc - Dokument XML
 * @param {Element} root - Element root
 * @param {string} path - Ścieżka do węzła (np. "FIToFICstmrCdtTrf/GrpHdr/MsgId")
 * @param {string} value - Wartość węzła
 */
function createXmlNode(xmlDoc, root, path, value) {
	const pathParts = path.split("/");
	let currentNode = root;

	// Twórz każdy poziom ścieżki
	for (let i = 0; i < pathParts.length; i++) {
		const partName = pathParts[i];

		// Sprawdź czy węzeł już istnieje
		let nextNode = null;
		for (let j = 0; j < currentNode.childNodes.length; j++) {
			if (currentNode.childNodes[j].nodeName === partName) {
				nextNode = currentNode.childNodes[j];
				break;
			}
		}

		// Jeśli nie, utwórz nowy węzeł
		if (!nextNode) {
			nextNode = xmlDoc.createElement(partName);
			currentNode.appendChild(nextNode);
		}

		// Jeśli to ostatni element ścieżki, ustaw wartość
		if (i === pathParts.length - 1) {
			nextNode.textContent = value;
		}

		currentNode = nextNode;
	}
}

/**
 * Pobiera mapowanie pól formularza do ścieżek XML
 * @param {string} formId - Identyfikator formularza
 * @returns {Object} Mapowanie pól na ścieżki XML
 */
function getXmlMappings(formId) {
	// W przyszłości można pobrać to z plików konfiguracyjnych
	const mappings = {
		pacs008Form: {
			msgId: { path: "FIToFICstmrCdtTrf/GrpHdr/MsgId" },
			creationDate: { path: "FIToFICstmrCdtTrf/GrpHdr/CreDtTm" },
			numberOfTxs: { path: "FIToFICstmrCdtTrf/GrpHdr/NbOfTxs" },
			settlementMethod: { path: "FIToFICstmrCdtTrf/GrpHdr/SttlmInf/SttlmMtd" },
			instructingAgentBIC: {
				path: "FIToFICstmrCdtTrf/GrpHdr/InstgAgt/FinInstnId/BICFI",
			},
			instructedAgentBIC: {
				path: "FIToFICstmrCdtTrf/GrpHdr/InstdAgt/FinInstnId/BICFI",
			},
			endToEndId: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/EndToEndId" },
			txId: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/TxId" },
			amount: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/IntrBkSttlmAmt" },
			currency: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/IntrBkSttlmAmt/@Ccy" },
			debtorName: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/Dbtr/Nm" },
			debtorAccountId: {
				path: "FIToFICstmrCdtTrf/CdtTrfTxInf/DbtrAcct/Id/IBAN",
			},
			debtorAgentBIC: {
				path: "FIToFICstmrCdtTrf/CdtTrfTxInf/DbtrAgt/FinInstnId/BICFI",
			},
			creditorName: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/Cdtr/Nm" },
			creditorAccountId: {
				path: "FIToFICstmrCdtTrf/CdtTrfTxInf/CdtrAcct/Id/IBAN",
			},
			creditorAgentBIC: {
				path: "FIToFICstmrCdtTrf/CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI",
			},
			remittanceInfo: { path: "FIToFICstmrCdtTrf/CdtTrfTxInf/RmtInf/Ustrd" },
		},
	};

	return mappings[formId] || null;
}

/**
 * Wyświetla wynik XML
 * @param {string} xmlString - Wygenerowany dokument XML
 * @param {string} sourceId - Identyfikator źródłowego formularza
 */
function displayXmlResult(xmlString, sourceId) {
	const resultId = `${sourceId}-result`;
	const resultElement = document.getElementById(resultId);

	if (resultElement) {
		// Pokaż wynik
		const preElement =
			resultElement.querySelector("pre") || document.createElement("pre");
		preElement.textContent = xmlString;

		// Jeśli pre nie jest częścią resultElement, dodaj je
		if (!resultElement.contains(preElement)) {
			resultElement.appendChild(preElement);
		}

		// Pokaż element wyniku
		resultElement.style.display = "block";

		// Przewiń do wyniku
		resultElement.scrollIntoView({ behavior: "smooth" });
	} else {
		console.warn(`Element wyniku o ID ${resultId} nie został znaleziony`);

		// Utwórz element modalny z wynikiem
		const modal = document.createElement("div");
		modal.className = "modal";
		modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Wygenerowany dokument XML</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <pre>${xmlString}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary copy-xml">Kopiuj</button>
                    <button class="btn btn-secondary download-xml">Pobierz</button>
                    <button class="btn close-modal">Zamknij</button>
                </div>
            </div>
        `;

		document.body.appendChild(modal);

		// Obsługa zamykania modalu
		modal.querySelectorAll(".close-modal").forEach(button => {
			button.addEventListener("click", () => {
				modal.remove();
			});
		});

		// Obsługa kopiowania XML
		modal.querySelector(".copy-xml").addEventListener("click", () => {
			navigator.clipboard
				.writeText(xmlString)
				.then(() => alert("XML skopiowany do schowka"))
				.catch(err => console.error("Błąd podczas kopiowania:", err));
		});

		// Obsługa pobierania XML
		modal.querySelector(".download-xml").addEventListener("click", () => {
			downloadXml(
				xmlString,
				`${sourceId}_${new Date().toISOString().replace(/:/g, "-")}.xml`
			);
		});

		// Pokaż modal
		setTimeout(() => modal.classList.add("show"), 50);
	}
}

/**
 * Formatuje dokument XML (dodaje wcięcia)
 * @param {string} xmlString - Nieformatowany XML
 * @returns {string} Sformatowany XML
 */
function formatXml(xmlString) {
	let formatted = "";
	let indent = "";
	const tab = "  "; // Dwa znaki spacji jako wcięcie

	xmlString.split(/>\s*</).forEach(node => {
		if (node.match(/^\/\w/)) {
			// Zamykający tag
			indent = indent.substring(tab.length);
		}

		formatted += indent + "<" + node + ">\n";

		if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
			// Otwierający tag, nie samozamykający
			indent += tab;
		}
	});

	return formatted.substring(1, formatted.length - 2);
}

/**
 * Pobiera dokument XML jako plik
 * @param {string} xmlString - Dokument XML do pobrania
 * @param {string} filename - Nazwa pliku
 */
function downloadXml(xmlString, filename) {
	const blob = new Blob([xmlString], { type: "application/xml" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.style.display = "none";
	a.href = url;
	a.download = filename;

	document.body.appendChild(a);
	a.click();

	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
}

/**
 * Zapisuje dokument XML do localStorage
 * @param {string} formId - Identyfikator formularza
 * @param {string} xmlData - Dokument XML
 */
function saveToLocalStorage(formId, xmlData) {
	try {
		// Pobierz istniejącą listę dokumentów lub utwórz nową
		const savedDocs = JSON.parse(localStorage.getItem("savedXmlDocs")) || {};

		// Dodaj nowy dokument
		savedDocs[formId] = {
			timestamp: new Date().toISOString(),
			xml: xmlData,
		};

		// Zapisz z powrotem do localStorage
		localStorage.setItem("savedXmlDocs", JSON.stringify(savedDocs));

		console.log(
			`Dokument z formularza ${formId} zapisany do lokalnego magazynu`
		);
	} catch (error) {
		console.error("Błąd podczas zapisywania do localStorage:", error);
	}
}

/**
 * Sprawdza localStorage pod kątem zapisanych dokumentów
 */
function checkLocalStorage() {
	try {
		const savedDocs = JSON.parse(localStorage.getItem("savedXmlDocs")) || {};
		const count = Object.keys(savedDocs).length;

		if (count > 0) {
			console.log(
				`Znaleziono ${count} zapisanych dokumentów XML w lokalnym magazynie`
			);

			// Tutaj można dodać powiadomienie dla użytkownika
			const savedDocsButton = document.getElementById("saved-docs-button");
			if (savedDocsButton) {
				savedDocsButton.innerText = `Zapisane dokumenty (${count})`;
				savedDocsButton.classList.remove("hidden");
			}
		}
	} catch (error) {
		console.error("Błąd podczas sprawdzania localStorage:", error);
	}
}

/**
 * Zapisuje aktualny formularz do pliku XML
 * @param {string} formId - Identyfikator formularza
 */
function saveFormToXml(formId) {
	const form = document.getElementById(formId);
	if (!form) {
		console.error(`Formularz o ID ${formId} nie został znaleziony`);
		return;
	}

	const formData = new FormData(form);
	const xmlData = generateXml(formData, formId);

	if (xmlData) {
		// Generuj nazwę pliku na podstawie ID formularza i daty
		const filename = `${formId}_${new Date()
			.toISOString()
			.replace(/:/g, "-")}.xml`;
		downloadXml(xmlData, filename);

		// Zapisz również w localStorage
		saveToLocalStorage(formId, xmlData);
	}
}

/**
 * Wyświetla okno wyboru pliku do importu XML
 */
function promptForXmlImport() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".xml";

	input.addEventListener("change", e => {
		if (e.target.files.length > 0) {
			const file = e.target.files[0];
			const reader = new FileReader();

			reader.onload = e => {
				const xmlContent = e.target.result;
				importXmlDocument(xmlContent);
			};

			reader.readAsText(file);
		}
	});

	input.click();
}

/**
 * Importuje dokument XML i wypełnia odpowiedni formularz
 * @param {string} xmlContent - Treść dokumentu XML
 */
function importXmlDocument(xmlContent) {
	try {
		// Parsuj dokument XML
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

		// Sprawdź typ dokumentu
		const rootName = xmlDoc.documentElement.nodeName;
		if (rootName !== "Document") {
			throw new Error(
				`Nieprawidłowy format dokumentu XML. Oczekiwano 'Document', otrzymano '${rootName}'`
			);
		}

		// Identyfikuj typ wiadomości ISO 20022
		let messageType = "";
		if (xmlDoc.querySelector("FIToFICstmrCdtTrf")) {
			messageType = "pacs.008";
		} else {
			throw new Error("Nieobsługiwany typ wiadomości ISO 20022");
		}

		// Przejdź do odpowiedniego formularza
		if (typeof navigateTo === "function") {
			navigateTo(`${messageType}-form`);
		}

		// Pobierz formularz
		const formId = `${messageType.replace(".", "")}Form`;
		const form = document.getElementById(formId);

		if (!form) {
			throw new Error(
				`Formularz dla typu ${messageType} nie został znaleziony`
			);
		}

		// Pobierz mapowanie pól
		const mappings = getXmlMappings(formId);
		if (!mappings) {
			throw new Error(`Brak mapowania dla formularza ${formId}`);
		}

		// Wypełnij formularz na podstawie mapowania XML
		for (const fieldName in mappings) {
			const mapping = mappings[fieldName];
			const path = mapping.path.split("/");

			// Znajdź wartość w XML
			const value = extractValueFromXml(xmlDoc, path);

			// Znajdź pole w formularzu
			const field = form.elements[fieldName];
			if (field && value !== null) {
				field.value = value;
			}
		}

		// Powiadom użytkownika
		alert(
			`Dokument XML typu ${messageType} został zaimportowany i formularz wypełniony.`
		);
	} catch (error) {
		console.error("Błąd podczas importu XML:", error);
		alert(`Wystąpił błąd podczas importu dokumentu XML: ${error.message}`);
	}
}

/**
 * Wyciąga wartość z dokumentu XML na podstawie ścieżki
 * @param {Document} xmlDoc - Dokument XML
 * @param {Array} pathArray - Ścieżka do węzła jako tablica
 * @returns {string|null} - Znaleziona wartość lub null
 */
function extractValueFromXml(xmlDoc, pathArray) {
	let currentNode = xmlDoc;

	// Przejdź przez ścieżkę
	for (let i = 0; i < pathArray.length; i++) {
		let part = pathArray[i];

		// Sprawdź, czy jest to atrybut
		if (part.startsWith("@")) {
			const attrName = part.substring(1);
			return currentNode.getAttribute(attrName);
		}

		// Znajdź węzeł potomny
		const childNodes = currentNode.getElementsByTagName(part);
		if (childNodes.length === 0) {
			return null;
		}

		currentNode = childNodes[0];

		// Jeśli to ostatni element ścieżki, zwróć wartość
		if (i === pathArray.length - 1) {
			return currentNode.textContent;
		}
	}

	return null;
}

/**
 * Main JavaScript for PACS Message Generator
 * Handles theme switching, navigation, and form processing
 */

// Initialize component loader
const componentLoader = new ComponentLoader();

/**
 * Theme Management
 */
function initializeTheme() {
	const savedTheme = localStorage.getItem("theme") || "light";
	document.documentElement.setAttribute("data-theme", savedTheme);
	updateThemeIcon(savedTheme);
}

function toggleTheme() {
	const currentTheme = document.documentElement.getAttribute("data-theme");
	const newTheme = currentTheme === "light" ? "dark" : "light";

	document.documentElement.setAttribute("data-theme", newTheme);
	localStorage.setItem("theme", newTheme);
	updateThemeIcon(newTheme);

	showNotification(`Theme changed to ${newTheme} mode`);
}

function updateThemeIcon(theme) {
	const themeToggleBtn = document.getElementById("theme-toggle-btn");
	if (themeToggleBtn) {
		themeToggleBtn.querySelector(".icon").textContent =
			theme === "light" ? "🌙" : "☀️";
	}
}

/**
 * Navigation and Form Loading
 */
function navigateToMessageForm(messageType) {
	// Show loading state
	const formContainer = document.getElementById("message-form-container");
	formContainer.innerHTML = '<div class="loading">Loading form...</div>';
	formContainer.style.display = "block";

	// Hide message selection and output
	document.querySelector(".message-selection").style.display = "none";
	document.getElementById("message-output-container").style.display = "none";

	// Load the appropriate form component
	componentLoader
		.loadComponent(
			`messages/${messageType}/${messageType}-form.html`,
			"message-form-container",
			{ messageType }
		)
		.then(() => {
			// Initialize form validation and other events
			initializeFormEvents(messageType);

			// Check for saved draft
			loadSavedDraft(messageType);
		})
		.catch(error => {
			formContainer.innerHTML = `
			<div class="error-message">
				<h3>Error Loading Form</h3>
				<p>${error.message}</p>
				<button class="btn btn-primary" onclick="backToMessageSelection()">Back to Message Selection</button>
			</div>
		`;
			console.error("Error loading component:", error);
		});
}

function backToMessageSelection() {
	// Hide form and output containers
	document.getElementById("message-form-container").style.display = "none";
	document.getElementById("message-output-container").style.display = "none";

	// Show message selection area
	document.querySelector(".message-selection").style.display = "block";
}

function initializeFormEvents(messageType) {
	const form = document.querySelector(`#${messageType}-form`);
	if (!form) return;

	// Set up form submission
	form.addEventListener("submit", function (event) {
		event.preventDefault();
		generateXML(messageType);
	});

	// Set up auto-save to local storage
	const formInputs = form.querySelectorAll("input, select, textarea");
	formInputs.forEach(input => {
		input.addEventListener("change", () => {
			saveFormDraft(messageType);
		});
	});

	// Set up conditional field visibility
	setupConditionalFields();

	// Add back button
	const backButton = form.querySelector(".back-button");
	if (backButton) {
		backButton.addEventListener("click", backToMessageSelection);
	}
}

/**
 * Form Utilities
 */
function setupConditionalFields() {
	document.querySelectorAll("[data-depends-on]").forEach(field => {
		const dependsOn = field.getAttribute("data-depends-on");
		const [dependentFieldId, requiredValue] = dependsOn.split(":");
		const dependentField = document.getElementById(dependentFieldId);

		if (dependentField) {
			// Initial check
			toggleFieldVisibility(field, dependentField, requiredValue);

			// Add listener for changes
			dependentField.addEventListener("change", () => {
				toggleFieldVisibility(field, dependentField, requiredValue);
			});
		}
	});
}

function toggleFieldVisibility(field, dependentField, requiredValue) {
	const fieldContainer = field.closest(".form-group") || field;

	if (dependentField.type === "checkbox") {
		fieldContainer.style.display =
			dependentField.checked === (requiredValue === "true") ? "block" : "none";
	} else {
		fieldContainer.style.display =
			dependentField.value === requiredValue ? "block" : "none";
	}

	// If field is now hidden, clear its value
	if (fieldContainer.style.display === "none") {
		if (field.tagName === "SELECT") {
			field.selectedIndex = 0;
		} else {
			field.value = "";
		}
	}
}

/**
 * XML Generation and Management
 */
function generateXML(messageType) {
	const form = document.querySelector(`#${messageType}-form`);
	if (!form) return;

	try {
		// Show loading indicator
		document.getElementById("xml-output").textContent = "Generating XML...";
		document.getElementById("message-output-container").style.display = "block";

		// Extract form data
		const formData = extractFormData(form);

		// Generate XML
		generateXmlFromForm(formData, messageType)
			.then(xml => {
				displayGeneratedXml(xml);
				saveFormDraft(messageType);
			})
			.catch(error => {
				document.getElementById(
					"xml-output"
				).textContent = `Error generating XML: ${error.message}`;
				showNotification("Error generating XML", "error");
			});
	} catch (error) {
		document.getElementById(
			"xml-output"
		).textContent = `Error: ${error.message}`;
		showNotification("Error generating XML", "error");
	}
}

function displayGeneratedXml(xml) {
	const xmlOutput = document.getElementById("xml-output");
	const formattedXml = formatXml(xml);
	xmlOutput.textContent = formattedXml;
	xmlOutput.classList.add("xml-highlighted");

	// Apply syntax highlighting if code highlighting library is available
	if (typeof hljs !== "undefined") {
		hljs.highlightElement(xmlOutput);
	}

	// Show success notification
	showNotification("XML generated successfully");
}

function copyXmlToClipboard() {
	const xmlOutput = document.getElementById("xml-output");

	navigator.clipboard
		.writeText(xmlOutput.textContent)
		.then(() => {
			showNotification("XML copied to clipboard");
		})
		.catch(err => {
			showNotification("Failed to copy XML: " + err, "error");
		});
}

function downloadXml() {
	const xmlContent = document.getElementById("xml-output").textContent;
	const messageType = document.querySelector("form").id.replace("-form", "");
	const fileName = `${messageType}-${new Date()
		.toISOString()
		.slice(0, 10)}.xml`;

	const blob = new Blob([xmlContent], { type: "application/xml" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	showNotification("XML downloaded successfully");
}

function validateXml() {
	const xmlContent = document.getElementById("xml-output").textContent;
	const messageType = document.querySelector("form").id.replace("-form", "");
	const validationResult = document.getElementById("validation-result");

	validationResult.innerHTML = '<div class="loading">Validating...</div>';

	// Fetch XSD schema and validate
	fetch(`schemas/${messageType}.xsd`)
		.then(response => {
			if (!response.ok) {
				throw new Error("Schema not found");
			}
			return response.text();
		})
		.then(xsdContent => {
			// Use the XML utils validation function
			validateXml(xmlContent, xsdContent).then(result => {
				if (result.valid) {
					validationResult.innerHTML =
						'<div class="validation-success">✓ XML is valid</div>';
					showNotification("XML is valid", "success");
				} else {
					validationResult.innerHTML = `
							<div class="validation-error">
								<h4>❌ XML Validation Failed</h4>
								<p>${result.error}</p>
							</div>
						`;
					showNotification("XML validation failed", "error");
				}
			});
		})
		.catch(error => {
			validationResult.innerHTML = `
				<div class="validation-warning">
					<h4>⚠️ Cannot validate XML</h4>
					<p>${error.message}</p>
				</div>
			`;
			showNotification("Cannot validate XML: " + error.message, "warning");
		});
}

function promptForXmlImport() {
	// Create a hidden file input
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = ".xml";
	fileInput.style.display = "none";
	document.body.appendChild(fileInput);

	// Trigger file selection dialog
	fileInput.click();

	// Handle file selection
	fileInput.addEventListener("change", function () {
		if (this.files && this.files.length > 0) {
			const reader = new FileReader();
			reader.onload = function (e) {
				try {
					const xmlContent = e.target.result;
					processImportedXml(xmlContent);
				} catch (error) {
					showNotification("Error importing XML: " + error.message, "error");
				}
			};
			reader.readAsText(this.files[0]);
		}
		document.body.removeChild(fileInput);
	});
}

function processImportedXml(xmlContent) {
	// Parse XML to identify message type
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

	// Extract message type from document
	const rootNode = xmlDoc.documentElement;
	let messageType = "";

	if (rootNode.nodeName.includes("Document")) {
		if (rootNode.innerHTML.includes("FIToFICstmrCdtTrf")) {
			messageType = "pacs.008";
		} else if (rootNode.innerHTML.includes("FIToFIPmtStsRpt")) {
			messageType = "pacs.002";
		} else if (rootNode.innerHTML.includes("PmtRtr")) {
			messageType = "pacs.004";
		} else if (rootNode.innerHTML.includes("FICdtTrf")) {
			messageType = "pacs.009";
		}
	}

	if (!messageType) {
		showNotification("Could not determine message type from XML", "error");
		return;
	}

	// Load the appropriate form
	navigateToMessageForm(messageType);

	// Wait for form to load then populate fields
	setTimeout(() => {
		populateFormFromXml(xmlDoc, messageType);
		showNotification("XML imported successfully", "success");
	}, 1000);
}

function populateFormFromXml(xmlDoc, messageType) {
	// This function would extract data from XML and populate the form
	// This is a simplified implementation - a real one would map XML nodes to form fields
	const form = document.querySelector(`#${messageType}-form`);
	if (!form) return;

	// Map XML fields to form fields (simplified example)
	const mappings = {
		"pacs.008": {
			"//MsgId": "message-id",
			"//CreDtTm": "creation-date",
			"//DbtrNm": "debtor-name",
			"//DbtrAcct/IBAN": "debtor-iban",
			"//CdtrNm": "creditor-name",
			"//CdtrAcct/IBAN": "creditor-iban",
			"//IntrBkSttlmAmt": "amount",
		},
	};

	// Simple XML node extraction using XPath-like syntax
	const getNodeValue = xpath => {
		// Simplified XPath-like navigation (a real implementation would use proper XPath)
		const parts = xpath.split("/").filter(p => p);
		let node = xmlDoc.documentElement;

		for (const part of parts) {
			if (!node) break;
			const childNodes = node.getElementsByTagName(part);
			if (childNodes.length > 0) {
				node = childNodes[0];
			} else {
				node = null;
				break;
			}
		}

		return node ? node.textContent : "";
	};

	// Apply values to form
	const fieldMap = mappings[messageType] || {};
	for (const [xpath, fieldId] of Object.entries(fieldMap)) {
		const value = getNodeValue(xpath);
		const field = document.getElementById(fieldId);
		if (field && value) {
			field.value = value;

			// Trigger change event to activate dependent fields
			const event = new Event("change");
			field.dispatchEvent(event);
		}
	}
}

/**
 * Local Storage Management
 */
function saveFormDraft(messageType) {
	const form = document.querySelector(`#${messageType}-form`);
	if (!form) return;

	const formData = {};
	const formInputs = form.querySelectorAll("input, select, textarea");

	formInputs.forEach(input => {
		if (input.id) {
			if (input.type === "checkbox") {
				formData[input.id] = input.checked;
			} else {
				formData[input.id] = input.value;
			}
		}
	});

	const savedForms = JSON.parse(localStorage.getItem("savedForms") || "{}");
	savedForms[messageType] = {
		data: formData,
		timestamp: new Date().toISOString(),
	};

	localStorage.setItem("savedForms", JSON.stringify(savedForms));
}

function loadSavedDraft(messageType) {
	const savedForms = JSON.parse(localStorage.getItem("savedForms") || "{}");
	const savedForm = savedForms[messageType];

	if (savedForm && savedForm.data) {
		const form = document.querySelector(`#${messageType}-form`);
		if (!form) return;

		for (const [id, value] of Object.entries(savedForm.data)) {
			const field = document.getElementById(id);
			if (field) {
				if (field.type === "checkbox") {
					field.checked = value;
				} else {
					field.value = value;
				}

				// Trigger change event to activate dependent fields
				const event = new Event("change");
				field.dispatchEvent(event);
			}
		}

		showNotification(
			`Loaded saved draft from ${new Date(
				savedForm.timestamp
			).toLocaleString()}`
		);
	}
}

function checkLocalStorage() {
	const savedFormsLink = document.getElementById("saved-drafts-link");
	if (!savedFormsLink) return;

	const savedForms = JSON.parse(localStorage.getItem("savedForms") || "{}");
	const hasSavedForms = Object.keys(savedForms).length > 0;

	savedFormsLink.style.display = hasSavedForms ? "inline" : "none";

	savedFormsLink.addEventListener("click", function (e) {
		e.preventDefault();
		showSavedFormsDialog();
	});
}

function showSavedFormsDialog() {
	const savedForms = JSON.parse(localStorage.getItem("savedForms") || "{}");

	// Create modal element
	const modal = document.createElement("div");
	modal.className = "modal";
	modal.innerHTML = `
		<div class="modal-content">
			<div class="modal-header">
				<h3>Saved Drafts</h3>
				<button class="close-btn">&times;</button>
			</div>
			<div class="modal-body">
				${
					Object.keys(savedForms).length > 0
						? `<ul class="saved-forms-list">
						${Object.entries(savedForms)
							.map(
								([type, data]) => `
							<li>
								<div class="saved-form-info">
									<strong>${type.toUpperCase()}</strong>
									<span class="timestamp">Saved on: ${new Date(
										data.timestamp
									).toLocaleString()}</span>
								</div>
								<div class="saved-form-actions">
									<button class="btn btn-sm btn-primary load-btn" data-type="${type}">Load</button>
									<button class="btn btn-sm btn-danger delete-btn" data-type="${type}">Delete</button>
								</div>
							</li>
						`
							)
							.join("")}
					   </ul>`
						: "<p>No saved drafts found.</p>"
				}
			</div>
		</div>
	`;

	// Add modal to the document
	document.body.appendChild(modal);

	// Show modal
	setTimeout(() => {
		modal.classList.add("show");
	}, 10);

	// Close button handler
	modal.querySelector(".close-btn").addEventListener("click", () => {
		modal.classList.remove("show");
		setTimeout(() => {
			modal.remove();
		}, 300);
	});

	// Load buttons handler
	modal.querySelectorAll(".load-btn").forEach(btn => {
		btn.addEventListener("click", function () {
			const messageType = this.getAttribute("data-type");
			navigateToMessageForm(messageType);
			modal.classList.remove("show");
			setTimeout(() => {
				modal.remove();
			}, 300);
		});
	});

	// Delete buttons handler
	modal.querySelectorAll(".delete-btn").forEach(btn => {
		btn.addEventListener("click", function () {
			const messageType = this.getAttribute("data-type");
			const savedForms = JSON.parse(localStorage.getItem("savedForms") || "{}");
			delete savedForms[messageType];
			localStorage.setItem("savedForms", JSON.stringify(savedForms));

			this.closest("li").remove();

			if (Object.keys(savedForms).length === 0) {
				modal.querySelector(".modal-body").innerHTML =
					"<p>No saved drafts found.</p>";
				document.getElementById("saved-drafts-link").style.display = "none";
			}

			showNotification(`Deleted ${messageType} draft`, "info");
		});
	});
}
