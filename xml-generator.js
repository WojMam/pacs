document.addEventListener("DOMContentLoaded", function () {
	// DOM References
	const xmlPreviewElement = document.getElementById("xmlPreview");
	const xmlTree = document.getElementById("xmlTree");
	const elementPropertiesForm = document.getElementById(
		"elementPropertiesForm"
	);
	const elementNameInput = document.getElementById("elementName");
	const elementValueInput = document.getElementById("elementValue");
	const attributesContainer = document.getElementById("attributesContainer");
	const addAttributeBtn = document.getElementById("addAttribute");
	const applyPropertiesBtn = document.getElementById("applyProperties");
	const deleteElementBtn = document.getElementById("deleteElement");
	const templatesModal = document.getElementById("templatesModal");
	const validationResults = document.getElementById("validationResults");
	const notification = document.getElementById("notification");
	const notificationMessage = document.getElementById("notificationMessage");
	const toggleThemeBtn = document.getElementById("toggleTheme");
	const toggleThemeText = toggleThemeBtn.querySelector(".toggle-text");

	// File Input References
	const schemaFileInput = document.getElementById("schemaFileInput");
	const xmlFileInput = document.getElementById("xmlFileInput");

	// Menu Buttons
	const newXmlBtn = document.getElementById("newXml");
	const loadXmlBtn = document.getElementById("loadXml");
	const saveXmlBtn = document.getElementById("saveXml");
	const loadSchemaBtn = document.getElementById("loadSchema");
	const validateXmlBtn = document.getElementById("validateXml");
	const loadTemplateBtn = document.getElementById("loadTemplate");
	const saveTemplateBtn = document.getElementById("saveTemplate");
	const formatXmlBtn = document.getElementById("formatXml");
	const copyXmlBtn = document.getElementById("copyXml");
	const clearValidationBtn = document.getElementById("clearValidation");

	// State variables
	let currentXmlDoc = null;
	let currentSchema = null;
	let selectedElement = null;
	let xmlEditor = null;

	// Initialize CodeMirror
	xmlEditor = CodeMirror.fromTextArea(xmlPreviewElement, {
		mode: "xml",
		lineNumbers: true,
		theme: "default",
		indentUnit: 2,
		smartIndent: true,
		lineWrapping: true,
		scrollbarStyle: null,
		matchBrackets: true,
		autoCloseBrackets: true,
		extraKeys: {
			"Ctrl-Space": "autocomplete",
		},
	});

	// Initialize the theme
	initTheme();

	// Create initial XML document
	createNewDocument();

	// Event Listeners
	xmlTree.addEventListener("click", handleTreeClick);
	addAttributeBtn.addEventListener("click", addNewAttribute);
	applyPropertiesBtn.addEventListener("click", applyElementProperties);
	deleteElementBtn.addEventListener("click", deleteSelectedElement);

	// Menu Button Events
	newXmlBtn.addEventListener("click", handleNewXml);
	loadXmlBtn.addEventListener("click", () => xmlFileInput.click());
	saveXmlBtn.addEventListener("click", handleSaveXml);
	loadSchemaBtn.addEventListener("click", () => schemaFileInput.click());
	validateXmlBtn.addEventListener("click", validateXmlAgainstSchema);
	loadTemplateBtn.addEventListener("click", openTemplatesModal);
	saveTemplateBtn.addEventListener("click", saveAsTemplate);
	formatXmlBtn.addEventListener("click", formatXml);
	copyXmlBtn.addEventListener("click", copyXmlToClipboard);
	clearValidationBtn.addEventListener("click", clearValidationResults);

	// File Input Events
	schemaFileInput.addEventListener("change", handleSchemaFileSelect);
	xmlFileInput.addEventListener("change", handleXmlFileSelect);

	// Theme Toggle Event
	toggleThemeBtn.addEventListener("click", function () {
		document.documentElement.classList.toggle("dark-mode");
		updateThemeText();
		saveThemePreference();
	});

	// Templates Modal Events
	document
		.querySelector(".close-modal")
		.addEventListener("click", closeTemplatesModal);
	document.querySelectorAll(".template-item").forEach(item => {
		item.addEventListener("click", () =>
			loadTemplateData(item.dataset.template)
		);
	});

	// CodeMirror Change Event - sync with tree view when code is edited directly
	xmlEditor.on(
		"change",
		debounce(function () {
			try {
				updateDocumentFromCode();
			} catch (error) {
				console.error("Error parsing XML from editor:", error);
			}
		}, 500)
	);

	// Helper Functions

	// Initialize theme based on saved preference
	function initTheme() {
		const darkModePreferred = localStorage.getItem("darkMode") === "true";
		if (darkModePreferred) {
			document.documentElement.classList.add("dark-mode");
		} else {
			document.documentElement.classList.remove("dark-mode");
		}
		updateThemeText();
	}

	// Update theme toggle button text
	function updateThemeText() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		toggleThemeText.textContent = isDarkMode ? "Tryb jasny" : "Tryb ciemny";
	}

	// Save theme preference to localStorage
	function saveThemePreference() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		localStorage.setItem("darkMode", isDarkMode);
	}

	// XML Manipulation Functions

	// Create a new empty XML document
	function createNewDocument() {
		const parser = new DOMParser();
		currentXmlDoc = parser.parseFromString("<document></document>", "text/xml");
		updateTreeView();
		updateXmlPreview();
		clearElementPropertiesForm();
		showNotification("Utworzono nowy dokument");
	}

	// Handle tree view clicks (element selection)
	function handleTreeClick(e) {
		const target = e.target;

		// Check if clicked on "add child" button
		if (target.closest(".add-child")) {
			const treeItem = target.closest(".tree-item");
			const elementId = treeItem.dataset.elementId;
			addChildElement(getElementByTreeId(elementId));
			e.stopPropagation();
			return;
		}

		// Check if clicked on "delete" button
		if (target.closest(".delete-element")) {
			const treeItem = target.closest(".tree-item");
			const elementId = treeItem.dataset.elementId;
			deleteElement(getElementByTreeId(elementId));
			e.stopPropagation();
			return;
		}

		// Select the element when clicking on tree item
		if (target.closest(".tree-item-content")) {
			const treeItem = target.closest(".tree-item");

			// Don't proceed if we clicked on a button
			if (target.closest("button")) {
				return;
			}

			const elementId = treeItem.dataset.elementId;
			selectElement(getElementByTreeId(elementId));
		}
	}

	// Select an element and populate the properties form
	function selectElement(element) {
		// Remove previous selection
		const prevSelected = document.querySelector(".tree-item-content.selected");
		if (prevSelected) {
			prevSelected.classList.remove("selected");
		}

		if (!element) return;

		selectedElement = element;

		// Update selection in tree view
		const treeItem = document.querySelector(
			`.tree-item[data-element-id="${getTreeId(element)}"] .tree-item-content`
		);
		if (treeItem) {
			treeItem.classList.add("selected");
		}

		// Populate the properties form
		populateElementPropertiesForm(element);
	}

	// Add a new child element to the specified parent
	function addChildElement(parentElement) {
		if (!parentElement || !currentXmlDoc) return;

		const newElement = currentXmlDoc.createElement("new-element");
		parentElement.appendChild(newElement);

		updateTreeView();
		updateXmlPreview();
		selectElement(newElement);

		// Set focus on the name input to allow immediate renaming
		elementNameInput.focus();
		elementNameInput.select();
	}

	// Delete an element from the document
	function deleteElement(element) {
		if (!element || element === currentXmlDoc.documentElement) {
			showNotification("Nie można usunąć głównego elementu dokumentu", "error");
			return;
		}

		// Keep reference to parent for selection after deletion
		const parentElement = element.parentNode;

		// Remove the element
		element.parentNode.removeChild(element);

		// Update the tree view and preview
		updateTreeView();
		updateXmlPreview();

		// Select the parent element
		selectElement(parentElement);

		showNotification("Element został usunięty");
	}

	// Delete the currently selected element
	function deleteSelectedElement() {
		if (selectedElement && selectedElement !== currentXmlDoc.documentElement) {
			deleteElement(selectedElement);
		} else {
			showNotification("Nie można usunąć głównego elementu dokumentu", "error");
		}
	}

	// Apply the properties from the form to the selected element
	function applyElementProperties() {
		if (!selectedElement) {
			showNotification("Nie wybrano żadnego elementu", "error");
			return;
		}

		const newName = elementNameInput.value.trim();
		if (!newName) {
			showNotification("Nazwa elementu nie może być pusta", "error");
			return;
		}

		try {
			// Rename element if needed (create new and replace)
			if (selectedElement.nodeName !== newName) {
				const newElement = currentXmlDoc.createElement(newName);

				// Copy all attributes
				Array.from(selectedElement.attributes).forEach(attr => {
					newElement.setAttribute(attr.name, attr.value);
				});

				// Copy all child nodes
				while (selectedElement.firstChild) {
					newElement.appendChild(selectedElement.firstChild);
				}

				// Replace old element with new one
				selectedElement.parentNode.replaceChild(newElement, selectedElement);
				selectedElement = newElement;
			}

			// Set text content (only if element has no children)
			if (
				!selectedElement.hasChildNodes() ||
				(selectedElement.childNodes.length === 1 &&
					selectedElement.firstChild.nodeType === Node.TEXT_NODE)
			) {
				selectedElement.textContent = elementValueInput.value;
			}

			// Clear existing attributes
			while (selectedElement.attributes.length > 0) {
				selectedElement.removeAttribute(selectedElement.attributes[0].name);
			}

			// Set new attributes
			const attributeRows =
				attributesContainer.querySelectorAll(".attribute-row");
			attributeRows.forEach(row => {
				const nameInput = row.querySelector(".attribute-name");
				const valueInput = row.querySelector(".attribute-value");

				const name = nameInput.value.trim();
				const value = valueInput.value;

				if (name) {
					selectedElement.setAttribute(name, value);
				}
			});

			// Update tree view and XML preview
			updateTreeView();
			updateXmlPreview();

			// Re-select the element to refresh the form
			selectElement(selectedElement);

			showNotification("Zmiany zostały zastosowane");
		} catch (error) {
			console.error("Error applying properties:", error);
			showNotification(
				"Błąd podczas zastosowywania zmian: " + error.message,
				"error"
			);
		}
	}

	// Update the tree view to reflect the current XML document
	function updateTreeView() {
		if (!currentXmlDoc) return;

		// Get the root element of the document
		const rootElement = currentXmlDoc.documentElement;
		const rootTreeItem = xmlTree.querySelector(".root-item");

		// Update the root element name and ID
		rootTreeItem.dataset.elementId = getTreeId(rootElement);
		rootTreeItem.querySelector(".element-name").textContent =
			rootElement.nodeName;

		// Clear existing children
		const rootChildrenContainer = rootTreeItem.querySelector(".tree-children");
		rootChildrenContainer.innerHTML = "";

		// Add child elements
		Array.from(rootElement.children).forEach(child => {
			appendElementToTree(child, rootChildrenContainer);
		});
	}

	// Recursively append elements to the tree view
	function appendElementToTree(element, parentContainer) {
		// Create the tree item
		const treeItem = document.createElement("li");
		treeItem.className = "tree-item";
		treeItem.dataset.elementId = getTreeId(element);

		// Create item content
		const itemContent = document.createElement("div");
		itemContent.className = "tree-item-content";

		// Element name
		const elementName = document.createElement("span");
		elementName.className = "element-name";
		elementName.textContent = element.nodeName;
		itemContent.appendChild(elementName);

		// Item actions
		const itemActions = document.createElement("div");
		itemActions.className = "tree-item-actions";

		// Add child button
		const addChildBtn = document.createElement("button");
		addChildBtn.className = "tree-action-btn add-child";
		addChildBtn.title = "Dodaj element podrzędny";
		addChildBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
		itemActions.appendChild(addChildBtn);

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.className = "tree-action-btn delete-element";
		deleteBtn.title = "Usuń element";
		deleteBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
		itemActions.appendChild(deleteBtn);

		itemContent.appendChild(itemActions);
		treeItem.appendChild(itemContent);

		// Create container for children
		const childrenContainer = document.createElement("ul");
		childrenContainer.className = "tree-children";

		// Recursively add child elements
		Array.from(element.children).forEach(child => {
			appendElementToTree(child, childrenContainer);
		});

		treeItem.appendChild(childrenContainer);
		parentContainer.appendChild(treeItem);
	}

	// Update the XML preview to reflect the current document
	function updateXmlPreview() {
		if (!currentXmlDoc) return;

		const serializer = new XMLSerializer();
		const xmlString = formatXmlString(
			serializer.serializeToString(currentXmlDoc)
		);

		xmlEditor.setValue(xmlString);
	}

	// Update the document based on the code in the editor
	function updateDocumentFromCode() {
		const xmlString = xmlEditor.getValue();
		if (!xmlString) return;

		try {
			const parser = new DOMParser();
			const newDoc = parser.parseFromString(xmlString, "text/xml");

			// Check for parsing errors
			const parseError = newDoc.querySelector("parsererror");
			if (parseError) {
				throw new Error("Invalid XML: " + parseError.textContent);
			}

			currentXmlDoc = newDoc;
			updateTreeView();

			// If an element was selected, try to find the equivalent in the new document
			if (selectedElement) {
				const path = getElementXPath(selectedElement);
				try {
					const newSelectedElement = evaluateXPath(path, currentXmlDoc);
					if (newSelectedElement) {
						selectElement(newSelectedElement);
					} else {
						clearElementPropertiesForm();
					}
				} catch (e) {
					clearElementPropertiesForm();
				}
			}
		} catch (error) {
			console.error("Error parsing XML:", error);
			// Don't update if there's a parse error
		}
	}

	// Populate the properties form with the element's data
	function populateElementPropertiesForm(element) {
		if (!element) return;

		// Set element name
		elementNameInput.value = element.nodeName;

		// Set element value (text content)
		if (
			!element.hasChildNodes() ||
			(element.childNodes.length === 1 &&
				element.firstChild.nodeType === Node.TEXT_NODE)
		) {
			elementValueInput.value = element.textContent;
			elementValueInput.disabled = false;
		} else {
			elementValueInput.value =
				"(Element zawiera elementy podrzędne, edycja tekstu niedostępna)";
			elementValueInput.disabled = true;
		}

		// Clear attributes container
		attributesContainer.innerHTML = "";

		// Add existing attributes
		Array.from(element.attributes).forEach(attr => {
			addAttributeRow(attr.name, attr.value);
		});
	}

	// Clear the element properties form
	function clearElementPropertiesForm() {
		elementNameInput.value = "";
		elementValueInput.value = "";
		attributesContainer.innerHTML = "";
		selectedElement = null;
	}

	// Add a new empty attribute input row
	function addNewAttribute() {
		addAttributeRow("", "");
	}

	// Add an attribute row with the specified name and value
	function addAttributeRow(name, value) {
		const row = document.createElement("div");
		row.className = "attribute-row";

		// Name input
		const nameInput = document.createElement("input");
		nameInput.type = "text";
		nameInput.className = "attribute-name";
		nameInput.placeholder = "Nazwa";
		nameInput.value = name;

		// Value input
		const valueInput = document.createElement("input");
		valueInput.type = "text";
		valueInput.className = "attribute-value";
		valueInput.placeholder = "Wartość";
		valueInput.value = value;

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.className = "attribute-delete";
		deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
		deleteBtn.addEventListener("click", function () {
			row.remove();
		});

		// Add elements to row
		row.appendChild(nameInput);
		row.appendChild(valueInput);
		row.appendChild(deleteBtn);

		// Add row to container
		attributesContainer.appendChild(row);

		// Focus on name input if it's empty
		if (!name) {
			nameInput.focus();
		}
	}

	// Display a notification message
	function showNotification(message, type = "success") {
		notificationMessage.textContent = message;

		// Set notification type (success, error, warning)
		notification.className = "notification";
		notification.classList.add(`notification-${type}`);

		// Show notification
		notification.style.display = "block";

		// Hide after a delay
		setTimeout(() => {
			notification.style.display = "none";
		}, 3000);
	}

	// Handle New XML button click
	function handleNewXml() {
		if (
			confirm(
				"Czy na pewno chcesz utworzyć nowy dokument? Wszystkie niezapisane zmiany zostaną utracone."
			)
		) {
			createNewDocument();
		}
	}

	// Handle Save XML button click
	function handleSaveXml() {
		if (!currentXmlDoc) return;

		const serializer = new XMLSerializer();
		const xmlString = formatXmlString(
			serializer.serializeToString(currentXmlDoc)
		);

		// Create blob and download link
		const blob = new Blob([xmlString], { type: "application/xml" });
		const url = URL.createObjectURL(blob);

		const downloadLink = document.createElement("a");
		downloadLink.href = url;
		downloadLink.download = "document.xml";
		downloadLink.click();

		// Clean up
		URL.revokeObjectURL(url);
		showNotification("Plik XML został zapisany");
	}

	// Handle XML file selection
	function handleXmlFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

				// Check for parsing errors
				const parseError = xmlDoc.querySelector("parsererror");
				if (parseError) {
					throw new Error("Invalid XML: " + parseError.textContent);
				}

				currentXmlDoc = xmlDoc;
				updateTreeView();
				updateXmlPreview();
				clearElementPropertiesForm();

				showNotification(`Wczytano plik: ${file.name}`);
			} catch (error) {
				console.error("Error loading XML file:", error);
				showNotification(
					"Błąd podczas wczytywania pliku XML: " + error.message,
					"error"
				);
			}
		};

		reader.readAsText(file);
		// Reset file input for future selections
		event.target.value = "";
	}

	// Handle schema file selection
	function handleSchemaFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				currentSchema = e.target.result;
				showNotification(`Wczytano schemat: ${file.name}`);
			} catch (error) {
				console.error("Error loading schema file:", error);
				showNotification(
					"Błąd podczas wczytywania schematu XSD: " + error.message,
					"error"
				);
				currentSchema = null;
			}
		};

		reader.readAsText(file);
		// Reset file input for future selections
		event.target.value = "";
	}

	// Validate XML against schema
	function validateXmlAgainstSchema() {
		if (!currentXmlDoc) {
			showNotification("Brak dokumentu XML do walidacji", "error");
			return;
		}

		if (!currentSchema) {
			showNotification("Brak schematu XSD. Wczytaj najpierw schemat.", "error");
			return;
		}

		clearValidationResults();

		try {
			// In a real implementation, this would use a proper XSD validation library
			// For this demo, we'll just pretend to validate

			// Simulated validation - in a real app, use a proper validation library
			simulateValidation();
		} catch (error) {
			console.error("Error during validation:", error);
			showNotification("Błąd podczas walidacji: " + error.message, "error");
		}
	}

	// Clear validation results panel
	function clearValidationResults() {
		validationResults.innerHTML = "";
	}

	// Simulate XML schema validation (in a real app, use a proper library)
	function simulateValidation() {
		// This is a placeholder for actual XML schema validation
		// In a real application, you would use a proper XML Schema validation library

		// For demo purposes, just show some random messages
		const valid = Math.random() > 0.3; // 70% chance of valid document

		if (valid) {
			addValidationMessage("Dokument jest zgodny ze schematem XSD.", "success");
		} else {
			const errorCount = Math.floor(Math.random() * 3) + 1;
			for (let i = 0; i < errorCount; i++) {
				const errors = [
					'Element "customer" nie spełnia warunków zdefiniowanych w schemacie.',
					'Atrybut "currency" jest wymagany w elemencie "price".',
					'Wartość elementu "code" nie jest poprawnym kodem pocztowym.',
					'Element "address" powinien zawierać element "city".',
				];

				addValidationMessage(
					errors[Math.floor(Math.random() * errors.length)],
					"error"
				);
			}

			const warningCount = Math.floor(Math.random() * 2);
			for (let i = 0; i < warningCount; i++) {
				const warnings = [
					'Element "email" nie zawiera wartości, ale nie jest oznaczony jako wymagany.',
					'Zalecane jest używanie atrybutu "type" w elemencie "phone".',
				];

				addValidationMessage(
					warnings[Math.floor(Math.random() * warnings.length)],
					"warning"
				);
			}
		}
	}

	// Add a message to the validation results panel
	function addValidationMessage(message, type) {
		const messageElement = document.createElement("div");
		messageElement.className = `validation-${type}`;

		const icon = document.createElement("i");
		icon.className = "fas";

		switch (type) {
			case "error":
				icon.className += " fa-times-circle";
				break;
			case "warning":
				icon.className += " fa-exclamation-triangle";
				break;
			case "success":
				icon.className += " fa-check-circle";
				break;
			case "info":
				icon.className += " fa-info-circle";
				break;
		}

		messageElement.appendChild(icon);
		messageElement.appendChild(document.createTextNode(" " + message));

		validationResults.appendChild(messageElement);
	}

	// Format XML string with proper indentation
	function formatXmlString(xmlString) {
		let formatted = "";
		let indent = "";
		const tab = "  ";
		let lastLineWasEmpty = false;

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

	// Format the XML preview
	function formatXml() {
		updateXmlPreview();
	}

	// Copy XML to clipboard
	function copyXmlToClipboard() {
		const xmlString = xmlEditor.getValue();

		try {
			navigator.clipboard.writeText(xmlString).then(
				function () {
					showNotification("XML skopiowano do schowka");
				},
				function (err) {
					console.error("Nie udało się skopiować: ", err);
					showNotification("Błąd podczas kopiowania do schowka", "error");
				}
			);
		} catch (error) {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = xmlString;
			document.body.appendChild(textarea);
			textarea.select();

			try {
				document.execCommand("copy");
				showNotification("XML skopiowano do schowka");
			} catch (err) {
				console.error("Nie udało się skopiować: ", err);
				showNotification("Błąd podczas kopiowania do schowka", "error");
			}

			document.body.removeChild(textarea);
		}
	}

	// Template modal functions
	function openTemplatesModal() {
		templatesModal.style.display = "flex";
	}

	function closeTemplatesModal() {
		templatesModal.style.display = "none";
	}

	// Load template data
	function loadTemplateData(templateId) {
		if (!templateId) return;

		let xmlString = "";

		// Predefined templates
		switch (templateId) {
			case "empty":
				xmlString = "<document></document>";
				break;

			case "contact":
				xmlString = `
<contacts>
  <contact>
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

			case "invoice":
				xmlString = `
<invoice invoiceNumber="FV/2024/06/001" date="2024-06-15">
  <seller>
    <name>Firma XYZ Sp. z o.o.</name>
    <address>ul. Biznesowa 10, 00-001 Warszawa</address>
    <taxId>PL1234567890</taxId>
  </seller>
  <buyer>
    <name>Klient ABC S.A.</name>
    <address>ul. Klientów 5, 00-002 Warszawa</address>
    <taxId>PL0987654321</taxId>
  </buyer>
  <items>
    <item>
      <name>Produkt 1</name>
      <quantity>2</quantity>
      <unitPrice currency="PLN">100.00</unitPrice>
      <totalPrice currency="PLN">200.00</totalPrice>
      <taxRate>23%</taxRate>
    </item>
    <item>
      <name>Usługa 1</name>
      <quantity>1</quantity>
      <unitPrice currency="PLN">300.00</unitPrice>
      <totalPrice currency="PLN">300.00</totalPrice>
      <taxRate>23%</taxRate>
    </item>
  </items>
  <summary>
    <totalNet currency="PLN">500.00</totalNet>
    <totalTax currency="PLN">115.00</totalTax>
    <totalGross currency="PLN">615.00</totalGross>
  </summary>
</invoice>`;
				break;

			case "config":
				xmlString = `
<configuration version="1.0">
  <settings>
    <setting id="general">
      <name>General Settings</name>
      <property key="language">pl</property>
      <property key="theme">light</property>
      <property key="notifications">true</property>
    </setting>
    <setting id="display">
      <name>Display Settings</name>
      <property key="fontSize">14</property>
      <property key="colorScheme">default</property>
    </setting>
  </settings>
</configuration>`;
				break;
		}

		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlString.trim(), "text/xml");

			// Check for parsing errors
			const parseError = xmlDoc.querySelector("parsererror");
			if (parseError) {
				throw new Error("Invalid XML in template: " + parseError.textContent);
			}

			currentXmlDoc = xmlDoc;
			updateTreeView();
			updateXmlPreview();
			clearElementPropertiesForm();

			showNotification("Wczytano szablon");
			closeTemplatesModal();
		} catch (error) {
			console.error("Error loading template:", error);
			showNotification(
				"Błąd podczas wczytywania szablonu: " + error.message,
				"error"
			);
		}
	}

	// Save current document as a template (in a real app, this would be stored)
	function saveAsTemplate() {
		if (!currentXmlDoc) {
			showNotification("Brak dokumentu do zapisania jako szablon", "error");
			return;
		}

		const templateName = prompt("Podaj nazwę szablonu:");
		if (!templateName) return;

		showNotification(`Szablon "${templateName}" został zapisany`);
		// In a real app, this would store the template
	}

	// Utility functions

	// Generate a unique ID for tree elements
	function getTreeId(element) {
		if (!element._treeId) {
			element._treeId = "elem_" + Math.random().toString(36).substr(2, 9);
		}
		return element._treeId;
	}

	// Get element by tree ID
	function getElementByTreeId(id) {
		// This is a simplified version - in a real app, you'd need a more robust approach
		// to find elements by their tree ID, possibly with a Map

		function findElement(element) {
			if (getTreeId(element) === id) {
				return element;
			}

			for (let i = 0; i < element.children.length; i++) {
				const result = findElement(element.children[i]);
				if (result) {
					return result;
				}
			}

			return null;
		}

		return findElement(currentXmlDoc.documentElement);
	}

	// Get XPath for an element
	function getElementXPath(element) {
		// This is a simplified function to get a basic XPath to an element
		// In a real app, you'd need a more robust approach

		if (!element) return "";

		const paths = [];
		while (element && element.nodeType === Node.ELEMENT_NODE) {
			let index = 1;
			for (
				let sibling = element.previousSibling;
				sibling;
				sibling = sibling.previousSibling
			) {
				if (
					sibling.nodeType === Node.ELEMENT_NODE &&
					sibling.nodeName === element.nodeName
				) {
					index++;
				}
			}

			const pathIndex = index > 1 ? `[${index}]` : "";
			paths.unshift(`${element.nodeName}${pathIndex}`);
			element = element.parentNode;
		}

		return "/" + paths.join("/");
	}

	// Evaluate XPath to find an element
	function evaluateXPath(path, doc) {
		// This is a very simplified function for basic XPath evaluation
		// In a real app, you'd need a more robust approach

		try {
			const result = doc.evaluate(
				path,
				doc,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			);
			return result.singleNodeValue;
		} catch (e) {
			console.error("Error evaluating XPath:", e);
			return null;
		}
	}

	// Debounce function to limit frequent calls
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
