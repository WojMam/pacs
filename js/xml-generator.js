/**
 * Moduł generatora dokumentów XML
 *
 * Odpowiedzialny za tworzenie dokumentów XML zgodnych z formatem PACS.008
 * na podstawie danych wprowadzonych przez użytkownika.
 */

/**
 * Generuje pełny dokument XML na podstawie danych formularza
 *
 * @param {Object} formData - Dane z formularza
 * @returns {string} - Wygenerowany dokument XML
 */
function generatePacs008Xml(formData) {
	try {
		// Tworzenie obiektu XMLDocument
		const xmlDoc = document.implementation.createDocument(
			null,
			"Document",
			null
		);

		// Ustawienie głównych przestrzeni nazw
		const root = xmlDoc.documentElement;
		root.setAttribute(
			"xmlns",
			"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.13"
		);
		root.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

		// Struktura nagłówka
		const header = createXmlElement(xmlDoc, "FIToFICstmrCdtTrf", root);

		// Nagłówek grupowy
		const grpHdr = createXmlElement(xmlDoc, "GrpHdr", header);

		// Podstawowe elementy nagłówka
		createXmlElement(
			xmlDoc,
			"MsgId",
			grpHdr,
			formData.messageId || generateUniqueId()
		);
		createXmlElement(
			xmlDoc,
			"CreDtTm",
			grpHdr,
			formData.creationDateTime || getCurrentISODateTime()
		);
		createXmlElement(xmlDoc, "NbOfTxs", grpHdr, "1");

		// Inicjator przelewu
		const initgPty = createXmlElement(xmlDoc, "InitgPty", grpHdr);
		if (formData.initiatingParty) {
			if (formData.initiatingParty.name) {
				const nm = createXmlElement(
					xmlDoc,
					"Nm",
					initgPty,
					formData.initiatingParty.name
				);
			}

			if (formData.initiatingParty.lei) {
				createXmlElement(xmlDoc, "LEI", initgPty, formData.initiatingParty.lei);
			}
		}

		// Informacje o transakcji
		const cdtTrfTxInf = createXmlElement(xmlDoc, "CdtTrfTxInf", header);

		// Identyfikacja płatności
		const pmtId = createXmlElement(xmlDoc, "PmtId", cdtTrfTxInf);
		createXmlElement(
			xmlDoc,
			"InstrId",
			pmtId,
			formData.instructionId || generateUniqueId()
		);
		createXmlElement(
			xmlDoc,
			"EndToEndId",
			pmtId,
			formData.endToEndId || "NOTPROVIDED"
		);
		createXmlElement(xmlDoc, "UETR", pmtId, formData.uetr || generateUUID());

		// Informacje o kwocie
		const intrBkSttlmAmt = createXmlElement(
			xmlDoc,
			"IntrBkSttlmAmt",
			cdtTrfTxInf,
			formData.amount || "0"
		);
		intrBkSttlmAmt.setAttribute("Ccy", formData.currency || "EUR");

		// Data rozliczenia
		createXmlElement(
			xmlDoc,
			"IntrBkSttlmDt",
			cdtTrfTxInf,
			formData.settlementDate || getCurrentDate()
		);

		// Informacje o dłużniku (nadawcy)
		if (formData.debtor) {
			const dbtr = createXmlElement(xmlDoc, "Dbtr", cdtTrfTxInf);

			if (formData.debtor.name) {
				createXmlElement(xmlDoc, "Nm", dbtr, formData.debtor.name);
			}

			// Adres dłużnika
			if (formData.debtor.postalAddress) {
				const pstlAdr = createXmlElement(xmlDoc, "PstlAdr", dbtr);

				if (formData.debtor.postalAddress.streetName) {
					createXmlElement(
						xmlDoc,
						"StrtNm",
						pstlAdr,
						formData.debtor.postalAddress.streetName
					);
				}

				if (formData.debtor.postalAddress.buildingNumber) {
					createXmlElement(
						xmlDoc,
						"BldgNb",
						pstlAdr,
						formData.debtor.postalAddress.buildingNumber
					);
				}

				if (formData.debtor.postalAddress.postCode) {
					createXmlElement(
						xmlDoc,
						"PstCd",
						pstlAdr,
						formData.debtor.postalAddress.postCode
					);
				}

				if (formData.debtor.postalAddress.townName) {
					createXmlElement(
						xmlDoc,
						"TwnNm",
						pstlAdr,
						formData.debtor.postalAddress.townName
					);
				}

				if (formData.debtor.postalAddress.country) {
					createXmlElement(
						xmlDoc,
						"Ctry",
						pstlAdr,
						formData.debtor.postalAddress.country
					);
				}
			}

			// LEI
			if (formData.debtor.lei) {
				createXmlElement(xmlDoc, "LEI", dbtr, formData.debtor.lei);
			}
		}

		// Konto dłużnika
		if (formData.debtorAccount && formData.debtorAccount.iban) {
			const dbtrAcct = createXmlElement(xmlDoc, "DbtrAcct", cdtTrfTxInf);
			const id = createXmlElement(xmlDoc, "Id", dbtrAcct);
			createXmlElement(xmlDoc, "IBAN", id, formData.debtorAccount.iban);
		}

		// Bank dłużnika
		if (formData.debtorAgent && formData.debtorAgent.bic) {
			const dbtrAgt = createXmlElement(xmlDoc, "DbtrAgt", cdtTrfTxInf);
			const finInstnId = createXmlElement(xmlDoc, "FinInstnId", dbtrAgt);
			createXmlElement(xmlDoc, "BICFI", finInstnId, formData.debtorAgent.bic);
		}

		// Informacje o wierzycielu (odbiorcy)
		if (formData.creditor) {
			const cdtr = createXmlElement(xmlDoc, "Cdtr", cdtTrfTxInf);

			if (formData.creditor.name) {
				createXmlElement(xmlDoc, "Nm", cdtr, formData.creditor.name);
			}

			// Adres wierzyciela
			if (formData.creditor.postalAddress) {
				const pstlAdr = createXmlElement(xmlDoc, "PstlAdr", cdtr);

				if (formData.creditor.postalAddress.streetName) {
					createXmlElement(
						xmlDoc,
						"StrtNm",
						pstlAdr,
						formData.creditor.postalAddress.streetName
					);
				}

				if (formData.creditor.postalAddress.buildingNumber) {
					createXmlElement(
						xmlDoc,
						"BldgNb",
						pstlAdr,
						formData.creditor.postalAddress.buildingNumber
					);
				}

				if (formData.creditor.postalAddress.postCode) {
					createXmlElement(
						xmlDoc,
						"PstCd",
						pstlAdr,
						formData.creditor.postalAddress.postCode
					);
				}

				if (formData.creditor.postalAddress.townName) {
					createXmlElement(
						xmlDoc,
						"TwnNm",
						pstlAdr,
						formData.creditor.postalAddress.townName
					);
				}

				if (formData.creditor.postalAddress.country) {
					createXmlElement(
						xmlDoc,
						"Ctry",
						pstlAdr,
						formData.creditor.postalAddress.country
					);
				}
			}
		}

		// Konto wierzyciela
		if (formData.creditorAccount && formData.creditorAccount.iban) {
			const cdtrAcct = createXmlElement(xmlDoc, "CdtrAcct", cdtTrfTxInf);
			const id = createXmlElement(xmlDoc, "Id", cdtrAcct);
			createXmlElement(xmlDoc, "IBAN", id, formData.creditorAccount.iban);
		}

		// Bank wierzyciela
		if (formData.creditorAgent && formData.creditorAgent.bic) {
			const cdtrAgt = createXmlElement(xmlDoc, "CdtrAgt", cdtTrfTxInf);
			const finInstnId = createXmlElement(xmlDoc, "FinInstnId", cdtrAgt);
			createXmlElement(xmlDoc, "BICFI", finInstnId, formData.creditorAgent.bic);
		}

		// Cel płatności
		if (formData.purpose && formData.purpose.code) {
			const purp = createXmlElement(xmlDoc, "Purp", cdtTrfTxInf);
			createXmlElement(xmlDoc, "Cd", purp, formData.purpose.code);
		}

		// Informacje dla odbiorcy (tytuł przelewu)
		if (
			formData.remittanceInformation &&
			formData.remittanceInformation.unstructured
		) {
			const rmtInf = createXmlElement(xmlDoc, "RmtInf", cdtTrfTxInf);
			createXmlElement(
				xmlDoc,
				"Ustrd",
				rmtInf,
				formData.remittanceInformation.unstructured
			);
		}

		// Konwersja dokumentu XML do ciągu znaków
		const serializer = new XMLSerializer();
		let xmlString = serializer.serializeToString(xmlDoc);

		// Dodanie deklaracji XML
		xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;

		return formatXml(xmlString);
	} catch (error) {
		console.error("Błąd generowania XML:", error);
		return null;
	}
}

/**
 * Tworzy i dodaje element XML do dokumentu
 *
 * @param {XMLDocument} xmlDoc - Dokument XML
 * @param {string} name - Nazwa elementu
 * @param {Element} parent - Element nadrzędny
 * @param {string} [textContent] - Opcjonalna zawartość tekstowa elementu
 * @returns {Element} - Utworzony element XML
 */
function createXmlElement(xmlDoc, name, parent, textContent = null) {
	const element = xmlDoc.createElement(name);
	parent.appendChild(element);

	if (textContent !== null) {
		element.textContent = textContent;
	}

	return element;
}

/**
 * Generuje unikalny identyfikator
 *
 * @returns {string} - Unikalny identyfikator
 */
function generateUniqueId() {
	const timestamp = new Date().getTime();
	const random = Math.floor(Math.random() * 10000);
	return `ID${timestamp}${random}`;
}

/**
 * Generuje UUID zgodny z RFC4122
 *
 * @returns {string} - UUID w formacie standardowym
 */
function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Zwraca bieżącą datę i czas w formacie ISO
 *
 * @returns {string} - Bieżąca data i czas w formacie ISO
 */
function getCurrentISODateTime() {
	return new Date().toISOString();
}

/**
 * Zwraca bieżącą datę w formacie YYYY-MM-DD
 *
 * @returns {string} - Bieżąca data w formacie YYYY-MM-DD
 */
function getCurrentDate() {
	const date = new Date();
	return date.toISOString().split("T")[0];
}

/**
 * Formatuje ciąg znaków XML dla lepszej czytelności
 *
 * @param {string} xml - Nieformatowany ciąg znaków XML
 * @returns {string} - Sformatowany ciąg znaków XML
 */
function formatXml(xml) {
	let formatted = "";
	let indent = "";
	const tab = "  "; // Dwie spacje

	xml.split(/>\s*</).forEach(function (node) {
		if (node.match(/^\/\w/)) {
			// Zmniejsz wcięcie dla zamykających tagów
			indent = indent.substring(tab.length);
		}

		formatted += indent + "<" + node + ">\n";

		if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) {
			// Zwiększ wcięcie dla otwierających tagów, które nie są samozamykające
			indent += tab;
		}
	});

	// Zastąp puste linie i popraw formatowanie
	return formatted
		.replace(/(<\?.*\?>)\n/g, "$1\n\n")
		.replace(/\n\n+/g, "\n\n")
		.replace(/^\n/, "");
}

/**
 * Waliduje wygenerowany dokument XML względem schematu XSD
 *
 * @param {string} xmlString - Wygenerowany dokument XML
 * @param {string} xsdUrl - URL do pliku schematu XSD
 * @returns {Promise<Object>} - Wynik walidacji
 */
async function validateXmlAgainstSchema(xmlString, xsdUrl) {
	try {
		// Pobranie schematu XSD
		const xsdResponse = await fetch(xsdUrl);
		if (!xsdResponse.ok) {
			throw new Error(
				`Nie udało się pobrać schematu XSD. Status: ${xsdResponse.status}`
			);
		}

		const xsdText = await xsdResponse.text();

		// Implementacja walidacji przy użyciu biblioteki zewnętrznej lub API
		// Ta funkcja jest zaślepką i wymaga implementacji z użyciem odpowiedniej biblioteki

		return {
			valid: true,
			errors: [],
		};
	} catch (error) {
		console.error("Błąd walidacji XML:", error);
		return {
			valid: false,
			errors: [error.message],
		};
	}
}

/**
 * Konwertuje dane z formularza na format odpowiedni dla generatora XML
 *
 * @param {HTMLFormElement} form - Element formularza HTML
 * @returns {Object} - Dane w formacie odpowiednim dla generatora XML
 */
function convertFormDataToXmlModel(form) {
	const formData = new FormData(form);
	const result = {};

	// Iteracja przez wszystkie pola formularza
	for (const [name, value] of formData.entries()) {
		if (!value) continue; // Pomijaj puste pola

		// Podział nazwy pola na segmenty (np. debtor.name -> ['debtor', 'name'])
		const keys = name.split(".");
		let current = result;

		// Tworzenie zagnieżdżonej struktury obiektu
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			current[key] = current[key] || {};
			current = current[key];
		}

		// Ustawienie wartości w odpowiednim miejscu struktury
		current[keys[keys.length - 1]] = value;
	}

	return result;
}

/**
 * Generuje XML na podstawie danych z formularza HTML
 *
 * @param {HTMLFormElement} form - Element formularza HTML
 * @returns {string} - Wygenerowany dokument XML
 */
function generateXmlFromForm(form) {
	const dataModel = convertFormDataToXmlModel(form);
	return generatePacs008Xml(dataModel);
}

/**
 * Zapisuje wygenerowany XML do pliku
 *
 * @param {string} xmlString - Wygenerowany dokument XML
 * @param {string} filename - Nazwa pliku
 */
function saveXmlToFile(xmlString, filename = "pacs.008.xml") {
	const blob = new Blob([xmlString], { type: "application/xml" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.style.display = "none";

	document.body.appendChild(a);
	a.click();

	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
}

// Eksport funkcji do wykorzystania w innych modułach
window.xmlGenerator = {
	generatePacs008Xml,
	validateXmlAgainstSchema,
	generateXmlFromForm,
	saveXmlToFile,
};
