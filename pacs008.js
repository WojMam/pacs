document.addEventListener("DOMContentLoaded", function () {
	// Referencje do elementów DOM
	const pacsForm = document.getElementById("pacsForm");
	const fillRequiredFieldsBtn = document.getElementById("fillRequiredFields");
	const fillOptionalFieldsBtn = document.getElementById("fillOptionalFields");
	const generateXmlBtn = document.getElementById("generateXml");
	const downloadXmlBtn = document.getElementById("downloadXml");
	const xmlOutput = document.getElementById("xmlOutput");
	const xmlTooltip = document.getElementById("xmlTooltip");
	const xmlTooltipContent = document.getElementById("xmlTooltipContent");
	const treeTooltip = document.getElementById("treeTooltip");
	const treeTooltipContent = document.getElementById("treeTooltipContent");
	const copyNotification = document.getElementById("copyNotification");
	const toggleThemeBtn = document.getElementById("toggleTheme");
	const toggleThemeText = toggleThemeBtn.querySelector(".toggle-text");
	const includePmtTpInf = document.getElementById("includePmtTpInf");
	const pmtTpInfContainer = document.getElementById("pmtTpInfContainer");

	// Inicjalizacja trybu kolorystycznego
	initTheme();

	// Obsługa przełącznika trybu jasnego/ciemnego
	toggleThemeBtn.addEventListener("click", function () {
		document.documentElement.classList.toggle("dark-mode");
		updateThemeText();
		saveThemePreference();
	});

	// Funkcja inicjalizująca tryb kolorystyczny na podstawie zapisanych preferencji
	function initTheme() {
		const darkModePreferred = localStorage.getItem("darkMode") === "true";
		if (darkModePreferred) {
			document.documentElement.classList.add("dark-mode");
		} else {
			document.documentElement.classList.remove("dark-mode");
		}
		updateThemeText();
	}

	// Funkcja aktualizująca tekst przycisku przełącznika
	function updateThemeText() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		toggleThemeText.textContent = isDarkMode ? "Tryb jasny" : "Tryb ciemny";
	}

	// Funkcja zapisująca preferencje trybu
	function saveThemePreference() {
		const isDarkMode = document.documentElement.classList.contains("dark-mode");
		localStorage.setItem("darkMode", isDarkMode);
	}

	// Obsługa tooltipów XML (najechanie)
	document.addEventListener("mouseover", function (e) {
		if (e.target.classList.contains("xml-icon")) {
			const xmlExample = e.target.getAttribute("data-xml");
			xmlTooltipContent.textContent = xmlExample;

			const rect = e.target.getBoundingClientRect();
			xmlTooltip.style.top = rect.bottom + window.scrollY + 10 + "px";
			xmlTooltip.style.left = rect.left + "px";
			xmlTooltip.style.display = "block";
		} else if (e.target.classList.contains("tree-icon")) {
			const treeStructure = e.target.getAttribute("data-tree");
			treeTooltipContent.textContent = treeStructure;

			const rect = e.target.getBoundingClientRect();
			treeTooltip.style.top = rect.bottom + window.scrollY + 10 + "px";
			treeTooltip.style.left = rect.left + "px";
			treeTooltip.style.display = "block";
		}
	});

	// Ukrywanie tooltipów (zjechanie myszą)
	document.addEventListener("mouseout", function (e) {
		if (e.target.classList.contains("xml-icon")) {
			xmlTooltip.style.display = "none";
		} else if (e.target.classList.contains("tree-icon")) {
			treeTooltip.style.display = "none";
		}
	});

	// Obsługa kopiowania XML do schowka (kliknięcie)
	document.addEventListener("click", function (e) {
		if (e.target.classList.contains("xml-icon")) {
			const xmlExample = e.target.getAttribute("data-xml");

			// Kopiowanie do schowka
			navigator.clipboard.writeText(xmlExample).then(
				function () {
					// Powiadomienie o skopiowaniu
					showCopyNotification();
				},
				function (err) {
					console.error("Nie udało się skopiować: ", err);
				}
			);
		}
	});

	// Funkcja wyświetlająca powiadomienie o skopiowaniu do schowka
	function showCopyNotification() {
		copyNotification.style.display = "block";
		setTimeout(function () {
			copyNotification.style.display = "none";
		}, 2500);
	}

	// Funkcja do wypełniania pól wymaganych
	fillRequiredFieldsBtn.addEventListener("click", function (e) {
		e.preventDefault();
		fillRequiredFields();
	});

	// Funkcja do wypełniania pól opcjonalnych
	fillOptionalFieldsBtn.addEventListener("click", function (e) {
		e.preventDefault();
		fillOptionalFields();
	});

	// Funkcja do generowania XML
	generateXmlBtn.addEventListener("click", function (e) {
		e.preventDefault();
		const xml = generateXML();
		displayXML(xml);

		// Przewinięcie do wyniku XML
		const xmlOutputElement = document.querySelector(".xml-output");
		if (xmlOutputElement) {
			xmlOutputElement.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	});

	// Funkcja do pobierania XML jako pliku
	downloadXmlBtn.addEventListener("click", function (e) {
		e.preventDefault();
		const xml = generateXML();
		downloadXML(xml);
	});

	// Funkcja do obsługi checkboxów opcjonalnych pól
	document.addEventListener("change", function (e) {
		if (e.target.classList.contains("include-field")) {
			const fieldId = e.target.getAttribute("data-field");
			const fieldInput = document.getElementById(fieldId);

			// Sprawdzenie czy istnieje powiązane pole (np. dla waluty)
			const relatedFieldId = e.target.getAttribute("data-related-field");
			const relatedField = relatedFieldId
				? document.getElementById(relatedFieldId)
				: null;

			if (fieldInput) {
				fieldInput.disabled = !e.target.checked;
				if (e.target.checked) {
					fieldInput.focus();
				}
			}

			// Aktywacja/dezaktywacja powiązanego pola
			if (relatedField) {
				relatedField.disabled = !e.target.checked;
			}
		}

		// Obsługa pokazywania/ukrywania kontenera PmtTpInf
		if (e.target.id === "includePmtTpInf") {
			pmtTpInfContainer.style.display = e.target.checked ? "block" : "none";
		}

		// Obsługa pokazywania/ukrywania kontenera txPmtTpInf (Transaction Payment Type Information)
		if (e.target.id === "includeTxPmtTpInf") {
			const txPmtTpInfContainer = document.getElementById(
				"txPmtTpInfContainer"
			);
			if (txPmtTpInfContainer) {
				txPmtTpInfContainer.style.display = e.target.checked ? "block" : "none";
			}
		}
	});

	// Funkcja generująca XML na podstawie danych z formularza
	function generateXML() {
		// Generowanie UETR (Unique End-to-End Transaction Reference) - format UUID
		const uetr = generateUETR();

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml +=
			'<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
		xml += "  <FIToFICstmrCdtTrf>\n";

		// GrpHdr
		xml += "    <GrpHdr>\n";

		// MsgId
		const msgId = document.getElementById("msgId").value;
		if (msgId) {
			xml += `      <MsgId>${escapeXml(msgId)}</MsgId>\n`;
		}

		// CreDtTm
		const creDtTm = document.getElementById("creDtTm").value;
		if (creDtTm) {
			// Przekształcenie formatu datetime-local na ISO String
			const dateObj = new Date(creDtTm);
			const isoString = dateObj.toISOString().replace(/\.\d{3}Z$/, "");
			xml += `      <CreDtTm>${isoString}</CreDtTm>\n`;
		}

		// XpryDtTm (opcjonalne)
		const includeXpryDtTm = document.getElementById("includeXpryDtTm").checked;
		if (includeXpryDtTm) {
			const xpryDtTm = document.getElementById("xpryDtTm").value;
			if (xpryDtTm) {
				const dateObj = new Date(xpryDtTm);
				const isoString = dateObj.toISOString().replace(/\.\d{3}Z$/, "");
				xml += `      <XpryDtTm>${isoString}</XpryDtTm>\n`;
			}
		}

		// BtchBookg (opcjonalne)
		const includeBtchBookg =
			document.getElementById("includeBtchBookg").checked;
		if (includeBtchBookg) {
			const btchBookg = document.getElementById("btchBookg").value;
			xml += `      <BtchBookg>${btchBookg}</BtchBookg>\n`;
		}

		// NbOfTxs
		const nbOfTxs = document.getElementById("nbOfTxs").value;
		if (nbOfTxs) {
			xml += `      <NbOfTxs>${escapeXml(nbOfTxs)}</NbOfTxs>\n`;
		}

		// CtrlSum (opcjonalne)
		const includeCtrlSum = document.getElementById("includeCtrlSum").checked;
		if (includeCtrlSum) {
			const ctrlSum = document.getElementById("ctrlSum").value;
			if (ctrlSum) {
				xml += `      <CtrlSum>${ctrlSum}</CtrlSum>\n`;
			}
		}

		// TtlIntrBkSttlmAmt (opcjonalne)
		const includeTtlIntrBkSttlmAmt = document.getElementById(
			"includeTtlIntrBkSttlmAmt"
		).checked;
		if (includeTtlIntrBkSttlmAmt) {
			const ttlIntrBkSttlmAmt =
				document.getElementById("ttlIntrBkSttlmAmt").value;
			const currency = document.getElementById("ttlIntrBkSttlmAmtCcy").value;
			if (ttlIntrBkSttlmAmt && currency) {
				xml += `      <TtlIntrBkSttlmAmt Ccy="${currency}">${ttlIntrBkSttlmAmt}</TtlIntrBkSttlmAmt>\n`;
			}
		}

		// IntrBkSttlmDt (opcjonalne)
		const includeIntrBkSttlmDt = document.getElementById(
			"includeIntrBkSttlmDt"
		).checked;
		if (includeIntrBkSttlmDt) {
			const intrBkSttlmDt = document.getElementById("intrBkSttlmDt").value;
			if (intrBkSttlmDt) {
				xml += `      <IntrBkSttlmDt>${intrBkSttlmDt}</IntrBkSttlmDt>\n`;
			}
		}

		// SttlmInf (wymagane)
		xml += "      <SttlmInf>\n";

		// SttlmMtd (wymagane)
		const sttlmMtd = document.getElementById("sttlmMtd").value;
		if (sttlmMtd) {
			xml += `        <SttlmMtd>${sttlmMtd}</SttlmMtd>\n`;
		}

		// ClrSys (opcjonalne)
		const includeClrSys = document.getElementById("includeClrSys").checked;
		if (includeClrSys) {
			const clrSysCd = document.getElementById("clrSysCd").value;
			if (clrSysCd) {
				xml += "        <ClrSys>\n";
				xml += `          <Cd>${clrSysCd}</Cd>\n`;
				xml += "        </ClrSys>\n";
			}
		}

		// Tutaj będą dodawane opcjonalne elementy SttlmInf

		xml += "      </SttlmInf>\n";

		// PmtTpInf (opcjonalne)
		const includePmtTpInf = document.getElementById("includePmtTpInf").checked;
		if (includePmtTpInf) {
			xml += "      <PmtTpInf>\n";

			// InstrPrty (opcjonalne)
			const includeInstrPrty =
				document.getElementById("includeInstrPrty").checked;
			if (includeInstrPrty) {
				const instrPrty = document.getElementById("instrPrty").value;
				if (instrPrty) {
					xml += `        <InstrPrty>${instrPrty}</InstrPrty>\n`;
				}
			}

			// Tutaj będą dodawane inne opcjonalne elementy PmtTpInf

			xml += "      </PmtTpInf>\n";
		}

		// PmtTpInf (Payment Type Information) w CdtTrfTxInf - opcjonalne
		const includeTxPmtTpInf =
			document.getElementById("includeTxPmtTpInf")?.checked;

		// Sprawdź czy którykolwiek z elementów PmtTpInf jest zaznaczony
		if (includeTxPmtTpInf) {
			xml += "      <PmtTpInf>\n";

			// Instruction Priority
			const includeTxInstrPrty =
				document.getElementById("includeTxInstrPrty")?.checked;
			if (includeTxInstrPrty) {
				const txInstrPrty = document.getElementById("txInstrPrty").value;
				if (txInstrPrty) {
					xml += `        <InstrPrty>${escapeXml(txInstrPrty)}</InstrPrty>\n`;
				}
			}

			// Clearing Channel
			const includeTxClrChanl =
				document.getElementById("includeTxClrChanl")?.checked;
			if (includeTxClrChanl) {
				const txClrChanl = document.getElementById("txClrChanl").value;
				if (txClrChanl) {
					xml += `        <ClrChanl>${escapeXml(txClrChanl)}</ClrChanl>\n`;
				}
			}

			// Service Level
			const includeTxSvcLvl =
				document.getElementById("includeTxSvcLvl")?.checked;
			if (includeTxSvcLvl) {
				const txSvcLvlCd = document.getElementById("txSvcLvlCd").value;
				if (txSvcLvlCd) {
					xml += "        <SvcLvl>\n";
					xml += `          <Cd>${escapeXml(txSvcLvlCd)}</Cd>\n`;
					xml += "        </SvcLvl>\n";
				}
			}

			// Local Instrument
			const includeTxLclInstrm =
				document.getElementById("includeTxLclInstrm")?.checked;
			if (includeTxLclInstrm) {
				const txLclInstrmCd = document.getElementById("txLclInstrmCd").value;
				if (txLclInstrmCd) {
					xml += "        <LclInstrm>\n";
					xml += `          <Cd>${escapeXml(txLclInstrmCd)}</Cd>\n`;
					xml += "        </LclInstrm>\n";
				}
			}

			// Category Purpose
			const includeTxCtgyPurp =
				document.getElementById("includeTxCtgyPurp")?.checked;
			if (includeTxCtgyPurp) {
				const txCtgyPurpCd = document.getElementById("txCtgyPurpCd").value;
				if (txCtgyPurpCd) {
					xml += "        <CtgyPurp>\n";
					xml += `          <Cd>${escapeXml(txCtgyPurpCd)}</Cd>\n`;
					xml += "        </CtgyPurp>\n";
				}
			}

			xml += "      </PmtTpInf>\n";
		}

		// InstgAgt (opcjonalne)
		const includeInstgAgt = document.getElementById("includeInstgAgt")?.checked;
		if (includeInstgAgt) {
			xml += "    <InstgAgt>\n";
			xml += "      <FinInstnId>\n";

			const instgAgtId = document.getElementById("instgAgtId").value;
			if (instgAgtId) {
				xml += `        <BICFI>${escapeXml(instgAgtId)}</BICFI>\n`;
			}

			// LEI
			const includeInstgAgtLEI =
				document.getElementById("includeInstgAgtLEI")?.checked;
			if (includeInstgAgtLEI) {
				const instgAgtLEI = document.getElementById("instgAgtLEI").value;
				if (instgAgtLEI) {
					xml += `        <LEI>${escapeXml(instgAgtLEI)}</LEI>\n`;
				}
			}

			// Name
			const includeInstgAgtNm =
				document.getElementById("includeInstgAgtNm")?.checked;
			if (includeInstgAgtNm) {
				const instgAgtNm = document.getElementById("instgAgtNm").value;
				if (instgAgtNm) {
					xml += `        <Nm>${escapeXml(instgAgtNm)}</Nm>\n`;
				}
			}

			// Postal Address
			const includeInstgAgtPstlAdr = document.getElementById(
				"includeInstgAgtPstlAdr"
			)?.checked;
			if (includeInstgAgtPstlAdr) {
				let hasAddressData = false;
				let postalAddressXml = "        <PstlAdr>\n";

				const instgAgtStrtNm = document.getElementById("instgAgtStrtNm").value;
				if (instgAgtStrtNm) {
					postalAddressXml += `          <StrtNm>${escapeXml(
						instgAgtStrtNm
					)}</StrtNm>\n`;
					hasAddressData = true;
				}

				const instgAgtBldgNb = document.getElementById("instgAgtBldgNb").value;
				if (instgAgtBldgNb) {
					postalAddressXml += `          <BldgNb>${escapeXml(
						instgAgtBldgNb
					)}</BldgNb>\n`;
					hasAddressData = true;
				}

				const instgAgtPstCd = document.getElementById("instgAgtPstCd").value;
				if (instgAgtPstCd) {
					postalAddressXml += `          <PstCd>${escapeXml(
						instgAgtPstCd
					)}</PstCd>\n`;
					hasAddressData = true;
				}

				const instgAgtTwnNm = document.getElementById("instgAgtTwnNm").value;
				if (instgAgtTwnNm) {
					postalAddressXml += `          <TwnNm>${escapeXml(
						instgAgtTwnNm
					)}</TwnNm>\n`;
					hasAddressData = true;
				}

				const instgAgtCtry = document.getElementById("instgAgtCtry").value;
				if (instgAgtCtry) {
					postalAddressXml += `          <Ctry>${escapeXml(
						instgAgtCtry
					)}</Ctry>\n`;
					hasAddressData = true;
				}

				if (hasAddressData) {
					postalAddressXml += "        </PstlAdr>\n";
					xml += postalAddressXml;
				}
			}

			// Other
			const includeInstgAgtOtherId = document.getElementById(
				"includeInstgAgtOtherId"
			)?.checked;
			if (includeInstgAgtOtherId) {
				const instgAgtOtherId =
					document.getElementById("instgAgtOtherId").value;
				if (instgAgtOtherId) {
					xml += "        <Othr>\n";
					xml += `          <Id>${escapeXml(instgAgtOtherId)}</Id>\n`;

					// SchmeNm
					const instgAgtOthrSchmeNmCd = document.getElementById(
						"instgAgtOthrSchmeNmCd"
					).value;
					const instgAgtOthrSchmeNmPrtry = document.getElementById(
						"instgAgtOthrSchmeNmPrtry"
					).value;

					if (instgAgtOthrSchmeNmCd || instgAgtOthrSchmeNmPrtry) {
						xml += "          <SchmeNm>\n";

						if (instgAgtOthrSchmeNmCd) {
							xml += `            <Cd>${escapeXml(
								instgAgtOthrSchmeNmCd
							)}</Cd>\n`;
						} else if (instgAgtOthrSchmeNmPrtry) {
							xml += `            <Prtry>${escapeXml(
								instgAgtOthrSchmeNmPrtry
							)}</Prtry>\n`;
						}

						xml += "          </SchmeNm>\n";
					}

					// Issr
					const instgAgtOthrIssr =
						document.getElementById("instgAgtOthrIssr").value;
					if (instgAgtOthrIssr) {
						xml += `          <Issr>${escapeXml(instgAgtOthrIssr)}</Issr>\n`;
					}

					xml += "        </Othr>\n";
				}
			}

			xml += "      </FinInstnId>\n";

			// Branch
			const includeInstgAgtBrnchId = document.getElementById(
				"includeInstgAgtBrnchId"
			)?.checked;
			if (includeInstgAgtBrnchId) {
				const instgAgtBrnchId =
					document.getElementById("instgAgtBrnchId").value;
				const instgAgtBrnchNm =
					document.getElementById("instgAgtBrnchNm").value;

				if (instgAgtBrnchId || instgAgtBrnchNm) {
					xml += "      <BrnchId>\n";

					if (instgAgtBrnchId) {
						xml += `        <Id>${escapeXml(instgAgtBrnchId)}</Id>\n`;
					}

					if (instgAgtBrnchNm) {
						xml += `        <Nm>${escapeXml(instgAgtBrnchNm)}</Nm>\n`;
					}

					xml += "      </BrnchId>\n";
				}
			}

			xml += "    </InstgAgt>\n";
		}

		// InstdAgt (opcjonalne)
		const includeInstdAgt = document.getElementById("includeInstdAgt")?.checked;
		if (includeInstdAgt) {
			xml += "    <InstdAgt>\n";
			xml += "      <FinInstnId>\n";

			const instdAgtId = document.getElementById("instdAgtId").value;
			if (instdAgtId) {
				xml += `        <BICFI>${escapeXml(instdAgtId)}</BICFI>\n`;
			}

			// LEI
			const includeInstdAgtLEI =
				document.getElementById("includeInstdAgtLEI")?.checked;
			if (includeInstdAgtLEI) {
				const instdAgtLEI = document.getElementById("instdAgtLEI").value;
				if (instdAgtLEI) {
					xml += `        <LEI>${escapeXml(instdAgtLEI)}</LEI>\n`;
				}
			}

			// Name
			const includeInstdAgtNm =
				document.getElementById("includeInstdAgtNm")?.checked;
			if (includeInstdAgtNm) {
				const instdAgtNm = document.getElementById("instdAgtNm").value;
				if (instdAgtNm) {
					xml += `        <Nm>${escapeXml(instdAgtNm)}</Nm>\n`;
				}
			}

			// Postal Address
			const includeInstdAgtPstlAdr = document.getElementById(
				"includeInstdAgtPstlAdr"
			)?.checked;
			if (includeInstdAgtPstlAdr) {
				let hasAddressData = false;
				let postalAddressXml = "        <PstlAdr>\n";

				const instdAgtStrtNm = document.getElementById("instdAgtStrtNm").value;
				if (instdAgtStrtNm) {
					postalAddressXml += `          <StrtNm>${escapeXml(
						instdAgtStrtNm
					)}</StrtNm>\n`;
					hasAddressData = true;
				}

				const instdAgtBldgNb = document.getElementById("instdAgtBldgNb").value;
				if (instdAgtBldgNb) {
					postalAddressXml += `          <BldgNb>${escapeXml(
						instdAgtBldgNb
					)}</BldgNb>\n`;
					hasAddressData = true;
				}

				const instdAgtPstCd = document.getElementById("instdAgtPstCd").value;
				if (instdAgtPstCd) {
					postalAddressXml += `          <PstCd>${escapeXml(
						instdAgtPstCd
					)}</PstCd>\n`;
					hasAddressData = true;
				}

				const instdAgtTwnNm = document.getElementById("instdAgtTwnNm").value;
				if (instdAgtTwnNm) {
					postalAddressXml += `          <TwnNm>${escapeXml(
						instdAgtTwnNm
					)}</TwnNm>\n`;
					hasAddressData = true;
				}

				const instdAgtCtry = document.getElementById("instdAgtCtry").value;
				if (instdAgtCtry) {
					postalAddressXml += `          <Ctry>${escapeXml(
						instdAgtCtry
					)}</Ctry>\n`;
					hasAddressData = true;
				}

				if (hasAddressData) {
					postalAddressXml += "        </PstlAdr>\n";
					xml += postalAddressXml;
				}
			}

			// Other
			const includeInstdAgtOtherId = document.getElementById(
				"includeInstdAgtOtherId"
			)?.checked;
			if (includeInstdAgtOtherId) {
				const instdAgtOtherId =
					document.getElementById("instdAgtOtherId").value;
				if (instdAgtOtherId) {
					xml += "        <Othr>\n";
					xml += `          <Id>${escapeXml(instdAgtOtherId)}</Id>\n`;

					// SchmeNm
					const instdAgtOthrSchmeNmCd = document.getElementById(
						"instdAgtOthrSchmeNmCd"
					).value;
					const instdAgtOthrSchmeNmPrtry = document.getElementById(
						"instdAgtOthrSchmeNmPrtry"
					).value;

					if (instdAgtOthrSchmeNmCd || instdAgtOthrSchmeNmPrtry) {
						xml += "          <SchmeNm>\n";

						if (instdAgtOthrSchmeNmCd) {
							xml += `            <Cd>${escapeXml(
								instdAgtOthrSchmeNmCd
							)}</Cd>\n`;
						} else if (instdAgtOthrSchmeNmPrtry) {
							xml += `            <Prtry>${escapeXml(
								instdAgtOthrSchmeNmPrtry
							)}</Prtry>\n`;
						}

						xml += "          </SchmeNm>\n";
					}

					// Issr
					const instdAgtOthrIssr =
						document.getElementById("instdAgtOthrIssr").value;
					if (instdAgtOthrIssr) {
						xml += `          <Issr>${escapeXml(instdAgtOthrIssr)}</Issr>\n`;
					}

					xml += "        </Othr>\n";
				}
			}

			xml += "      </FinInstnId>\n";

			// Branch
			const includeInstdAgtBrnchId = document.getElementById(
				"includeInstdAgtBrnchId"
			)?.checked;
			if (includeInstdAgtBrnchId) {
				const instdAgtBrnchId =
					document.getElementById("instdAgtBrnchId").value;
				const instdAgtBrnchNm =
					document.getElementById("instdAgtBrnchNm").value;

				if (instdAgtBrnchId || instdAgtBrnchNm) {
					xml += "      <BrnchId>\n";

					if (instdAgtBrnchId) {
						xml += `        <Id>${escapeXml(instdAgtBrnchId)}</Id>\n`;
					}

					if (instdAgtBrnchNm) {
						xml += `        <Nm>${escapeXml(instdAgtBrnchNm)}</Nm>\n`;
					}

					xml += "      </BrnchId>\n";
				}
			}

			xml += "    </InstdAgt>\n";
		}

		// Tutaj będzie kod dodawany dla pozostałych pól GrpHdr

		xml += "    </GrpHdr>\n";

		// CdtTrfTxInf
		xml += "    <CdtTrfTxInf>\n";

		// PmtId (Payment Identification) - wymagane
		xml += "      <PmtId>\n";

		// InstrId (opcjonalne)
		const includeInstrId = document.getElementById("includeInstrId")?.checked;
		if (includeInstrId) {
			const instrId = document.getElementById("instrId").value;
			if (instrId) {
				xml += `        <InstrId>${escapeXml(instrId)}</InstrId>\n`;
			}
		}

		// EndToEndId (opcjonalne)
		const includeEndToEndId =
			document.getElementById("includeEndToEndId")?.checked;
		if (includeEndToEndId) {
			const endToEndId = document.getElementById("endToEndId2").value;
			if (endToEndId) {
				xml += `        <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>\n`;
			}
		} else {
			// Standardowa wartość EndToEndId jeśli nie jest zaznaczone jako opcjonalne
			const endToEndId = document.getElementById("endToEndId").value;
			if (endToEndId) {
				xml += `        <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>\n`;
			}
		}

		// UETR (wymagane)
		xml += `        <UETR>${uetr}</UETR>\n`;

		// TxId (Transaction ID) - opcjonalne
		const includeTxId = document.getElementById("includeTxId")?.checked;
		if (includeTxId) {
			const txId = document.getElementById("txId").value;
			if (txId) {
				xml += `        <TxId>${escapeXml(txId)}</TxId>\n`;
			}
		}

		xml += "      </PmtId>\n";

		// PmtTpInf (Payment Type Information) w CdtTrfTxInf - opcjonalne
		const includeSvcLvl = document.getElementById("includeSvcLvl")?.checked;
		const includeLclInstrm =
			document.getElementById("includeLclInstrm")?.checked;
		const includeCtgyPurp = document.getElementById("includeCtgyPurp")?.checked;

		// Sprawdź czy którykolwiek z elementów PmtTpInf jest zaznaczony
		if (includeSvcLvl || includeLclInstrm || includeCtgyPurp) {
			xml += "      <PmtTpInf>\n";

			// SvcLvl (Service Level) - opcjonalne
			if (includeSvcLvl) {
				const svcLvlCd = document.getElementById("svcLvlCd").value;
				if (svcLvlCd) {
					xml += "        <SvcLvl>\n";
					xml += `          <Cd>${svcLvlCd}</Cd>\n`;
					xml += "        </SvcLvl>\n";
				}
			}

			// LclInstrm (Local Instrument) - opcjonalne
			if (includeLclInstrm) {
				const lclInstrmCd = document.getElementById("lclInstrmCd").value;
				if (lclInstrmCd) {
					xml += "        <LclInstrm>\n";
					xml += `          <Cd>${lclInstrmCd}</Cd>\n`;
					xml += "        </LclInstrm>\n";
				}
			}

			// CtgyPurp (Category Purpose) - opcjonalne
			if (includeCtgyPurp) {
				const ctgyPurpCd = document.getElementById("ctgyPurpCd").value;
				if (ctgyPurpCd) {
					xml += "        <CtgyPurp>\n";
					xml += `          <Cd>${ctgyPurpCd}</Cd>\n`;
					xml += "        </CtgyPurp>\n";
				}
			}

			xml += "      </PmtTpInf>\n";
		}

		// IntrBkSttlmAmt (Interbank Settlement Amount) - wymagane
		const intrBkSttlmAmt = document.getElementById("intrBkSttlmAmt").value;
		const intrBkSttlmAmtCcy =
			document.getElementById("intrBkSttlmAmtCcy").value;
		if (intrBkSttlmAmt && intrBkSttlmAmtCcy) {
			xml += `      <IntrBkSttlmAmt Ccy="${intrBkSttlmAmtCcy}">${intrBkSttlmAmt}</IntrBkSttlmAmt>\n`;
		}

		// ChrgBr (Charge Bearer) - wymagane
		const chrgBr = document.getElementById("chrgBr").value;
		if (chrgBr) {
			xml += `      <ChrgBr>${chrgBr}</ChrgBr>\n`;
		}

		// ChrgsInf (Charges Information) - opcjonalne
		const includeChrgsInf = document.getElementById("includeChrgsInf")?.checked;
		const includeChrgsInfPtyBICFI = document.getElementById(
			"includeChrgsInfPtyBICFI"
		)?.checked;
		const includeChrgsInfTp =
			document.getElementById("includeChrgsInfTp")?.checked;

		if (includeChrgsInf || includeChrgsInfPtyBICFI || includeChrgsInfTp) {
			xml += "      <ChrgsInf>\n";

			// Amt (Amount) - wymagane dla ChrgsInf
			if (includeChrgsInf) {
				const chrgsInfAmt = document.getElementById("chrgsInfAmt").value;
				const chrgsInfAmtCcy = document.getElementById("chrgsInfAmtCcy").value;
				if (chrgsInfAmt && chrgsInfAmtCcy) {
					xml += `        <Amt Ccy="${chrgsInfAmtCcy}">${chrgsInfAmt}</Amt>\n`;
				}
			}

			// Agt (Agent) - wymagane dla ChrgsInf, zawiera BICFI
			if (includeChrgsInfPtyBICFI) {
				const chrgsInfPtyBICFI =
					document.getElementById("chrgsInfPtyBICFI").value;
				if (chrgsInfPtyBICFI) {
					xml += "        <Agt>\n";
					xml += "          <FinInstnId>\n";
					xml += `            <BICFI>${escapeXml(chrgsInfPtyBICFI)}</BICFI>\n`;
					xml += "          </FinInstnId>\n";
					xml += "        </Agt>\n";
				}
			}

			// Tp (Type) - opcjonalne dla ChrgsInf
			if (includeChrgsInfTp) {
				const chrgsInfTpCd = document.getElementById("chrgsInfTpCd").value;
				if (chrgsInfTpCd) {
					xml += "        <Tp>\n";
					xml += `          <Cd>${escapeXml(chrgsInfTpCd)}</Cd>\n`;
					xml += "        </Tp>\n";
				}
			}

			xml += "      </ChrgsInf>\n";
		}

		// PmtSgntr (Payment Signature) - opcjonalne
		const includePmtSgntr = document.getElementById("includePmtSgntr").checked;
		if (includePmtSgntr) {
			const pmtSgntrType = document.getElementById("pmtSgntrType").value;
			const pmtSgntrValue = document.getElementById("pmtSgntrValue").value;

			if (pmtSgntrValue) {
				xml += "      <PmtSgntr>\n";

				// Wybór odpowiedniego elementu na podstawie typu
				if (pmtSgntrType === "ILPV4") {
					xml += `        <ILPV4>${escapeXml(pmtSgntrValue)}</ILPV4>\n`;
				} else {
					// Sgntr
					xml += `        <Sgntr>${escapeXml(pmtSgntrValue)}</Sgntr>\n`;
				}

				xml += "      </PmtSgntr>\n";
			}
		}

		// MndtRltdInf (Mandate Related Information) - opcjonalne
		const includeMndtRltdInf =
			document.getElementById("includeMndtRltdInf").checked;
		const includeDtOfSgntr =
			document.getElementById("includeDtOfSgntr").checked;

		// Sprawdzenie, czy potrzebujemy dodać sekcję MndtRltdInf
		if (includeMndtRltdInf || includeDtOfSgntr) {
			xml += "      <MndtRltdInf>\n";

			// MndtId (Mandate Identification) - opcjonalne
			if (includeMndtRltdInf) {
				const mndtId = document.getElementById("mndtId").value;
				if (mndtId) {
					xml += `        <MndtId>${escapeXml(mndtId)}</MndtId>\n`;
				}
			}

			// DtOfSgntr (Date of Signature) - opcjonalne
			if (includeDtOfSgntr) {
				const dtOfSgntr = document.getElementById("dtOfSgntr").value;
				if (dtOfSgntr) {
					xml += `        <DtOfSgntr>${dtOfSgntr}</DtOfSgntr>\n`;
				}
			}

			xml += "      </MndtRltdInf>\n";
		}

		// Tax (Tax Data) - opcjonalne
		const includeTax = document.getElementById("includeTax")?.checked;
		const includeTaxDbtr = document.getElementById("includeTaxDbtr")?.checked;
		const includeTaxDbtrAuthstn = document.getElementById(
			"includeTaxDbtrAuthstn"
		)?.checked;
		const includeTaxUltmtDbtr = document.getElementById(
			"includeTaxUltmtDbtr"
		)?.checked;
		const includeTaxAdmstnZone = document.getElementById(
			"includeTaxAdmstnZone"
		)?.checked;
		const includeTaxMtd = document.getElementById("includeTaxMtd")?.checked;
		const includeTaxDt = document.getElementById("includeTaxDt")?.checked;
		const includeTaxTtlTaxblBaseAmt = document.getElementById(
			"includeTaxTtlTaxblBaseAmt"
		)?.checked;
		const includeTaxTtlTaxAmt = document.getElementById(
			"includeTaxTtlTaxAmt"
		)?.checked;

		if (
			includeTax ||
			includeTaxDbtr ||
			includeTaxDbtrAuthstn ||
			includeTaxUltmtDbtr ||
			includeTaxAdmstnZone ||
			includeTaxMtd ||
			includeTaxDt ||
			includeTaxTtlTaxblBaseAmt ||
			includeTaxTtlTaxAmt
		) {
			xml += "      <Tax>\n";

			// Tax Creditor
			if (includeTax) {
				const taxCdtrTaxId = document.getElementById("taxCdtrTaxId").value;
				const taxCdtrRegnId = document.getElementById("taxCdtrRegnId").value;
				const taxCdtrTaxTp = document.getElementById("taxCdtrTaxTp").value;

				if (taxCdtrTaxId || taxCdtrRegnId || taxCdtrTaxTp) {
					xml += "        <Cdtr>\n";

					if (taxCdtrTaxId) {
						xml += `          <TaxId>${escapeXml(taxCdtrTaxId)}</TaxId>\n`;
					}

					if (taxCdtrRegnId) {
						xml += `          <RegnId>${escapeXml(taxCdtrRegnId)}</RegnId>\n`;
					}

					if (taxCdtrTaxTp) {
						xml += `          <TaxTp>${escapeXml(taxCdtrTaxTp)}</TaxTp>\n`;
					}

					xml += "        </Cdtr>\n";
				}
			}

			// Tax Debtor
			if (includeTaxDbtr) {
				const taxDbtrTaxId = document.getElementById("taxDbtrTaxId").value;
				const taxDbtrRegnId = document.getElementById("taxDbtrRegnId").value;
				const taxDbtrTaxTp = document.getElementById("taxDbtrTaxTp").value;

				// Debtor Authorization
				const includeAuthstn = includeTaxDbtrAuthstn;
				const taxDbtrAuthstnTitl =
					document.getElementById("taxDbtrAuthstnTitl").value;
				const taxDbtrAuthstnNm =
					document.getElementById("taxDbtrAuthstnNm").value;

				if (
					taxDbtrTaxId ||
					taxDbtrRegnId ||
					taxDbtrTaxTp ||
					(includeAuthstn && (taxDbtrAuthstnTitl || taxDbtrAuthstnNm))
				) {
					xml += "        <Dbtr>\n";

					if (taxDbtrTaxId) {
						xml += `          <TaxId>${escapeXml(taxDbtrTaxId)}</TaxId>\n`;
					}

					if (taxDbtrRegnId) {
						xml += `          <RegnId>${escapeXml(taxDbtrRegnId)}</RegnId>\n`;
					}

					if (taxDbtrTaxTp) {
						xml += `          <TaxTp>${escapeXml(taxDbtrTaxTp)}</TaxTp>\n`;
					}

					// Authorization
					if (includeAuthstn && (taxDbtrAuthstnTitl || taxDbtrAuthstnNm)) {
						xml += "          <Authstn>\n";

						if (taxDbtrAuthstnTitl) {
							xml += `            <Titl>${escapeXml(
								taxDbtrAuthstnTitl
							)}</Titl>\n`;
						}

						if (taxDbtrAuthstnNm) {
							xml += `            <Nm>${escapeXml(taxDbtrAuthstnNm)}</Nm>\n`;
						}

						xml += "          </Authstn>\n";
					}

					xml += "        </Dbtr>\n";
				}
			}

			// Ultimate Debtor
			if (includeTaxUltmtDbtr) {
				const taxUltmtDbtrTaxId =
					document.getElementById("taxUltmtDbtrTaxId").value;

				if (taxUltmtDbtrTaxId) {
					xml += "        <UltmtDbtr>\n";
					xml += `          <TaxId>${escapeXml(taxUltmtDbtrTaxId)}</TaxId>\n`;
					xml += "        </UltmtDbtr>\n";
				}
			}

			// Administration Zone
			if (includeTaxAdmstnZone) {
				const taxAdmstnZone = document.getElementById("taxAdmstnZone").value;
				if (taxAdmstnZone) {
					xml += `        <AdmstnZone>${escapeXml(
						taxAdmstnZone
					)}</AdmstnZone>\n`;
				}
			}

			// Reference Number
			const taxRefNb = document.getElementById("taxRefNb").value;
			if (taxRefNb) {
				xml += `        <RefNb>${escapeXml(taxRefNb)}</RefNb>\n`;
			}

			// Method
			if (includeTaxMtd) {
				const taxMtd = document.getElementById("taxMtd").value;
				if (taxMtd) {
					xml += `        <Mtd>${escapeXml(taxMtd)}</Mtd>\n`;
				}
			}

			// Total Taxable Base Amount
			if (includeTaxTtlTaxblBaseAmt) {
				const taxTtlTaxblBaseAmt =
					document.getElementById("taxTtlTaxblBaseAmt").value;
				const taxTtlTaxblBaseAmtCcy = document.getElementById(
					"taxTtlTaxblBaseAmtCcy"
				).value;

				if (taxTtlTaxblBaseAmt && taxTtlTaxblBaseAmtCcy) {
					xml += `        <TtlTaxblBaseAmt Ccy="${taxTtlTaxblBaseAmtCcy}">${taxTtlTaxblBaseAmt}</TtlTaxblBaseAmt>\n`;
				}
			}

			// Total Tax Amount
			if (includeTaxTtlTaxAmt) {
				const taxTtlTaxAmt = document.getElementById("taxTtlTaxAmt").value;
				const taxTtlTaxAmtCcy =
					document.getElementById("taxTtlTaxAmtCcy").value;

				if (taxTtlTaxAmt && taxTtlTaxAmtCcy) {
					xml += `        <TtlTaxAmt Ccy="${taxTtlTaxAmtCcy}">${taxTtlTaxAmt}</TtlTaxAmt>\n`;
				}
			}

			// Date
			if (includeTaxDt) {
				const taxDt = document.getElementById("taxDt").value;
				if (taxDt) {
					xml += `        <Dt>${escapeXml(taxDt)}</Dt>\n`;
				}
			}

			xml += "      </Tax>\n";
		}

		// Dbtr (Debtor) - wymagane
		const dbtrNm = document.getElementById("dbtrNm").value;
		if (dbtrNm) {
			xml += "      <Dbtr>\n";
			xml += `        <Nm>${escapeXml(dbtrNm)}</Nm>\n`;

			// Dodanie LEI dla Debtor
			const includeDbtrLEI = document.getElementById("includeDbtrLEI")?.checked;
			if (includeDbtrLEI) {
				const dbtrLEI = document.getElementById("dbtrLEI").value;
				if (dbtrLEI) {
					xml += `        <LEI>${escapeXml(dbtrLEI)}</LEI>\n`;
				}
			}

			// Dodanie PstlAdr dla Debtor
			const includeDbtrPstlAdr =
				document.getElementById("includeDbtrPstlAdr")?.checked;
			if (includeDbtrPstlAdr) {
				let hasAddressData = false;
				let postalAddressXml = "        <PstlAdr>\n";

				const dbtrStrtNm = document.getElementById("dbtrStrtNm").value;
				if (dbtrStrtNm) {
					postalAddressXml += `          <StrtNm>${escapeXml(
						dbtrStrtNm
					)}</StrtNm>\n`;
					hasAddressData = true;
				}

				const dbtrBldgNb = document.getElementById("dbtrBldgNb").value;
				if (dbtrBldgNb) {
					postalAddressXml += `          <BldgNb>${escapeXml(
						dbtrBldgNb
					)}</BldgNb>\n`;
					hasAddressData = true;
				}

				const dbtrPstCd = document.getElementById("dbtrPstCd").value;
				if (dbtrPstCd) {
					postalAddressXml += `          <PstCd>${escapeXml(
						dbtrPstCd
					)}</PstCd>\n`;
					hasAddressData = true;
				}

				const dbtrTwnNm = document.getElementById("dbtrTwnNm").value;
				if (dbtrTwnNm) {
					postalAddressXml += `          <TwnNm>${escapeXml(
						dbtrTwnNm
					)}</TwnNm>\n`;
					hasAddressData = true;
				}

				const dbtrCtry = document.getElementById("dbtrCtry").value;
				if (dbtrCtry) {
					postalAddressXml += `          <Ctry>${escapeXml(dbtrCtry)}</Ctry>\n`;
					hasAddressData = true;
				}

				if (hasAddressData) {
					postalAddressXml += "        </PstlAdr>\n";
					xml += postalAddressXml;
				}
			}

			// Dodanie CtryOfRes dla Debtor
			const includeDbtrCtryOfRes = document.getElementById(
				"includeDbtrCtryOfRes"
			)?.checked;
			if (includeDbtrCtryOfRes) {
				const dbtrCtryOfRes = document.getElementById("dbtrCtryOfRes").value;
				if (dbtrCtryOfRes) {
					xml += `        <CtryOfRes>${escapeXml(dbtrCtryOfRes)}</CtryOfRes>\n`;
				}
			}

			// Dodanie Id (OrgId) dla Debtor
			const includeDbtrId = document.getElementById("includeDbtrId")?.checked;
			if (includeDbtrId) {
				let hasIdData = false;
				let idXml = "        <Id>\n          <OrgId>\n";

				// AnyBIC
				const dbtrOrgIdAnyBIC =
					document.getElementById("dbtrOrgIdAnyBIC").value;
				if (dbtrOrgIdAnyBIC) {
					idXml += `            <AnyBIC>${escapeXml(
						dbtrOrgIdAnyBIC
					)}</AnyBIC>\n`;
					hasIdData = true;
				}

				// Other ID
				const dbtrOrgIdOthrId =
					document.getElementById("dbtrOrgIdOthrId").value;
				if (dbtrOrgIdOthrId) {
					idXml += "            <Othr>\n";
					idXml += `              <Id>${escapeXml(dbtrOrgIdOthrId)}</Id>\n`;

					// SchmeNm
					const dbtrOrgIdSchemeName = document.getElementById(
						"dbtrOrgIdSchemeName"
					).value;
					if (dbtrOrgIdSchemeName) {
						idXml += "              <SchmeNm>\n";

						if (dbtrOrgIdSchemeName === "Cd") {
							const dbtrOrgIdSchemeCode = document.getElementById(
								"dbtrOrgIdSchemeCode"
							).value;
							if (dbtrOrgIdSchemeCode) {
								idXml += `                <Cd>${escapeXml(
									dbtrOrgIdSchemeCode
								)}</Cd>\n`;
							}
						} else if (dbtrOrgIdSchemeName === "Prtry") {
							const dbtrOrgIdSchemePrtry = document.getElementById(
								"dbtrOrgIdSchemePrtry"
							).value;
							if (dbtrOrgIdSchemePrtry) {
								idXml += `                <Prtry>${escapeXml(
									dbtrOrgIdSchemePrtry
								)}</Prtry>\n`;
							}
						}

						idXml += "              </SchmeNm>\n";
					}

					// Issr
					const dbtrOrgIdIssr = document.getElementById("dbtrOrgIdIssr").value;
					if (dbtrOrgIdIssr) {
						idXml += `              <Issr>${escapeXml(dbtrOrgIdIssr)}</Issr>\n`;
					}

					idXml += "            </Othr>\n";
					hasIdData = true;
				}

				if (hasIdData) {
					idXml += "          </OrgId>\n";
					idXml += "        </Id>\n";
					xml += idXml;
				}
			}

			xml += "      </Dbtr>\n";
		}

		// DbtrAcct (wymagane)
		const dbtrAcctId = document.getElementById("dbtrAcctId").value;
		if (dbtrAcctId) {
			xml += "      <DbtrAcct>\n";
			xml += "        <Id>\n";
			xml += `          <IBAN>${escapeXml(dbtrAcctId)}</IBAN>\n`;
			xml += "        </Id>\n";

			// Type
			const includeDbtrAcctTp =
				document.getElementById("includeDbtrAcctTp")?.checked;
			if (includeDbtrAcctTp) {
				const dbtrAcctTp = document.getElementById("dbtrAcctTp").value;
				if (dbtrAcctTp) {
					xml += "        <Tp>\n";
					xml += `          <Cd>${escapeXml(dbtrAcctTp)}</Cd>\n`;
					xml += "        </Tp>\n";
				}
			}

			// Currency
			const includeDbtrAcctCcy =
				document.getElementById("includeDbtrAcctCcy")?.checked;
			if (includeDbtrAcctCcy) {
				const dbtrAcctCcy = document.getElementById("dbtrAcctCcy").value;
				if (dbtrAcctCcy) {
					xml += `        <Ccy>${escapeXml(dbtrAcctCcy)}</Ccy>\n`;
				}
			}

			// Name
			const includeDbtrAcctNm =
				document.getElementById("includeDbtrAcctNm")?.checked;
			if (includeDbtrAcctNm) {
				const dbtrAcctNm = document.getElementById("dbtrAcctNm").value;
				if (dbtrAcctNm) {
					xml += `        <Nm>${escapeXml(dbtrAcctNm)}</Nm>\n`;
				}
			}

			// Proxy
			const includeDbtrAcctProxyTp = document.getElementById(
				"includeDbtrAcctProxyTp"
			)?.checked;
			if (includeDbtrAcctProxyTp) {
				const dbtrAcctProxyTp =
					document.getElementById("dbtrAcctProxyTp").value;
				const dbtrAcctProxyVal =
					document.getElementById("dbtrAcctProxyVal").value;

				if (dbtrAcctProxyTp && dbtrAcctProxyVal) {
					xml += "        <Prxy>\n";
					xml += "          <Tp>\n";
					xml += `            <Cd>${escapeXml(dbtrAcctProxyTp)}</Cd>\n`;
					xml += "          </Tp>\n";
					xml += `          <Id>${escapeXml(dbtrAcctProxyVal)}</Id>\n`;
					xml += "        </Prxy>\n";
				}
			}

			xml += "      </DbtrAcct>\n";
		}

		// UltmtDbtr (Ultimate Debtor) - opcjonalne
		const includeUltmtDbtr =
			document.getElementById("includeUltmtDbtr").checked;
		if (includeUltmtDbtr) {
			const ultmtDbtrNm = document.getElementById("ultmtDbtrNm").value;
			if (ultmtDbtrNm) {
				xml += "      <UltmtDbtr>\n";
				xml += `        <Nm>${escapeXml(ultmtDbtrNm)}</Nm>\n`;

				// Dodanie PstlAdr dla Ultimate Debtor
				const includeUltmtDbtrPstlAdr = document.getElementById(
					"includeUltmtDbtrPstlAdr"
				)?.checked;
				if (includeUltmtDbtrPstlAdr) {
					let hasAddressData = false;
					let postalAddressXml = "        <PstlAdr>\n";

					const ultmtDbtrStrtNm =
						document.getElementById("ultmtDbtrStrtNm").value;
					if (ultmtDbtrStrtNm) {
						postalAddressXml += `          <StrtNm>${escapeXml(
							ultmtDbtrStrtNm
						)}</StrtNm>\n`;
						hasAddressData = true;
					}

					const ultmtDbtrBldgNb =
						document.getElementById("ultmtDbtrBldgNb").value;
					if (ultmtDbtrBldgNb) {
						postalAddressXml += `          <BldgNb>${escapeXml(
							ultmtDbtrBldgNb
						)}</BldgNb>\n`;
						hasAddressData = true;
					}

					const ultmtDbtrPstCd =
						document.getElementById("ultmtDbtrPstCd").value;
					if (ultmtDbtrPstCd) {
						postalAddressXml += `          <PstCd>${escapeXml(
							ultmtDbtrPstCd
						)}</PstCd>\n`;
						hasAddressData = true;
					}

					const ultmtDbtrTwnNm =
						document.getElementById("ultmtDbtrTwnNm").value;
					if (ultmtDbtrTwnNm) {
						postalAddressXml += `          <TwnNm>${escapeXml(
							ultmtDbtrTwnNm
						)}</TwnNm>\n`;
						hasAddressData = true;
					}

					const ultmtDbtrCtry = document.getElementById("ultmtDbtrCtry").value;
					if (ultmtDbtrCtry) {
						postalAddressXml += `          <Ctry>${escapeXml(
							ultmtDbtrCtry
						)}</Ctry>\n`;
						hasAddressData = true;
					}

					if (hasAddressData) {
						postalAddressXml += "        </PstlAdr>\n";
						xml += postalAddressXml;
					}
				}

				// Dodanie Id (OrgId) dla Ultimate Debtor
				const includeUltmtDbtrId =
					document.getElementById("includeUltmtDbtrId")?.checked;
				if (includeUltmtDbtrId) {
					let hasIdData = false;
					let idXml = "        <Id>\n          <OrgId>\n";

					// AnyBIC
					const ultmtDbtrOrgIdAnyBIC = document.getElementById(
						"ultmtDbtrOrgIdAnyBIC"
					).value;
					if (ultmtDbtrOrgIdAnyBIC) {
						idXml += `            <AnyBIC>${escapeXml(
							ultmtDbtrOrgIdAnyBIC
						)}</AnyBIC>\n`;
						hasIdData = true;
					}

					// LEI
					const ultmtDbtrLEI = document.getElementById("ultmtDbtrLEI").value;
					if (ultmtDbtrLEI) {
						idXml += `            <LEI>${escapeXml(ultmtDbtrLEI)}</LEI>\n`;
						hasIdData = true;
					}

					// Other ID
					const ultmtDbtrOrgIdOthrId = document.getElementById(
						"ultmtDbtrOrgIdOthrId"
					).value;
					if (ultmtDbtrOrgIdOthrId) {
						idXml += "            <Othr>\n";
						idXml += `              <Id>${escapeXml(
							ultmtDbtrOrgIdOthrId
						)}</Id>\n`;

						// SchmeNm
						const ultmtDbtrOrgIdSchemeName = document.getElementById(
							"ultmtDbtrOrgIdSchemeName"
						).value;
						if (ultmtDbtrOrgIdSchemeName) {
							idXml += "              <SchmeNm>\n";

							if (ultmtDbtrOrgIdSchemeName === "Cd") {
								const ultmtDbtrOrgIdSchemeCode = document.getElementById(
									"ultmtDbtrOrgIdSchemeCode"
								).value;
								if (ultmtDbtrOrgIdSchemeCode) {
									idXml += `                <Cd>${escapeXml(
										ultmtDbtrOrgIdSchemeCode
									)}</Cd>\n`;
								}
							} else if (ultmtDbtrOrgIdSchemeName === "Prtry") {
								const ultmtDbtrOrgIdSchemePrtry = document.getElementById(
									"ultmtDbtrOrgIdSchemePrtry"
								).value;
								if (ultmtDbtrOrgIdSchemePrtry) {
									idXml += `                <Prtry>${escapeXml(
										ultmtDbtrOrgIdSchemePrtry
									)}</Prtry>\n`;
								}
							}

							idXml += "              </SchmeNm>\n";
						}

						// Issr
						const ultmtDbtrOrgIdIssr =
							document.getElementById("ultmtDbtrOrgIdIssr").value;
						if (ultmtDbtrOrgIdIssr) {
							idXml += `              <Issr>${escapeXml(
								ultmtDbtrOrgIdIssr
							)}</Issr>\n`;
						}

						idXml += "            </Othr>\n";
						hasIdData = true;
					}

					if (hasIdData) {
						idXml += "          </OrgId>\n";
						idXml += "        </Id>\n";
						xml += idXml;
					}
				}

				// Dodanie CtryOfRes dla Ultimate Debtor
				const includeUltmtDbtrCtryOfRes = document.getElementById(
					"includeUltmtDbtrCtryOfRes"
				)?.checked;
				if (includeUltmtDbtrCtryOfRes) {
					const ultmtDbtrCtryOfRes =
						document.getElementById("ultmtDbtrCtryOfRes").value;
					if (ultmtDbtrCtryOfRes) {
						xml += `        <CtryOfRes>${escapeXml(
							ultmtDbtrCtryOfRes
						)}</CtryOfRes>\n`;
					}
				}

				xml += "      </UltmtDbtr>\n";
			}
		}

		// Cdtr (Creditor) - wymagane
		const cdtrNm = document.getElementById("cdtrNm").value;
		if (cdtrNm) {
			xml += "      <Cdtr>\n";
			xml += `        <Nm>${escapeXml(cdtrNm)}</Nm>\n`;
			xml += "      </Cdtr>\n";
		}

		// CdtrAcct (Creditor Account) - wymagane
		const cdtrAcctId = document.getElementById("cdtrAcctId").value;
		if (cdtrAcctId) {
			xml += "      <CdtrAcct>\n";
			xml += "        <Id>\n";
			xml += `          <IBAN>${escapeXml(cdtrAcctId)}</IBAN>\n`;
			xml += "        </Id>\n";

			// Type
			const includeCdtrAcctTp =
				document.getElementById("includeCdtrAcctTp")?.checked;
			if (includeCdtrAcctTp) {
				const cdtrAcctTp = document.getElementById("cdtrAcctTp").value;
				if (cdtrAcctTp) {
					xml += "        <Tp>\n";
					xml += `          <Cd>${escapeXml(cdtrAcctTp)}</Cd>\n`;
					xml += "        </Tp>\n";
				}
			}

			// Currency
			const includeCdtrAcctCcy =
				document.getElementById("includeCdtrAcctCcy")?.checked;
			if (includeCdtrAcctCcy) {
				const cdtrAcctCcy = document.getElementById("cdtrAcctCcy").value;
				if (cdtrAcctCcy) {
					xml += `        <Ccy>${escapeXml(cdtrAcctCcy)}</Ccy>\n`;
				}
			}

			// Name
			const includeCdtrAcctNm =
				document.getElementById("includeCdtrAcctNm")?.checked;
			if (includeCdtrAcctNm) {
				const cdtrAcctNm = document.getElementById("cdtrAcctNm").value;
				if (cdtrAcctNm) {
					xml += `        <Nm>${escapeXml(cdtrAcctNm)}</Nm>\n`;
				}
			}

			// Proxy
			const includeCdtrAcctProxyTp = document.getElementById(
				"includeCdtrAcctProxyTp"
			)?.checked;
			if (includeCdtrAcctProxyTp) {
				const cdtrAcctProxyTp =
					document.getElementById("cdtrAcctProxyTp").value;
				const cdtrAcctProxyVal =
					document.getElementById("cdtrAcctProxyVal").value;

				if (cdtrAcctProxyTp && cdtrAcctProxyVal) {
					xml += "        <Prxy>\n";
					xml += "          <Tp>\n";
					xml += `            <Cd>${escapeXml(cdtrAcctProxyTp)}</Cd>\n`;
					xml += "          </Tp>\n";
					xml += `          <Id>${escapeXml(cdtrAcctProxyVal)}</Id>\n`;
					xml += "        </Prxy>\n";
				}
			}

			xml += "      </CdtrAcct>\n";
		}

		// UltmtCdtr (Ultimate Creditor) - opcjonalne
		const includeUltmtCdtr =
			document.getElementById("includeUltmtCdtr").checked;
		if (includeUltmtCdtr) {
			const ultmtCdtrNm = document.getElementById("ultmtCdtrNm").value;
			if (ultmtCdtrNm) {
				xml += "      <UltmtCdtr>\n";
				xml += `        <Nm>${escapeXml(ultmtCdtrNm)}</Nm>\n`;

				// Dodanie PstlAdr dla Ultimate Creditor
				const includeUltmtCdtrPstlAdr = document.getElementById(
					"includeUltmtCdtrPstlAdr"
				)?.checked;
				if (includeUltmtCdtrPstlAdr) {
					let hasAddressData = false;
					let postalAddressXml = "        <PstlAdr>\n";

					const ultmtCdtrStrtNm =
						document.getElementById("ultmtCdtrStrtNm").value;
					if (ultmtCdtrStrtNm) {
						postalAddressXml += `          <StrtNm>${escapeXml(
							ultmtCdtrStrtNm
						)}</StrtNm>\n`;
						hasAddressData = true;
					}

					const ultmtCdtrBldgNb =
						document.getElementById("ultmtCdtrBldgNb").value;
					if (ultmtCdtrBldgNb) {
						postalAddressXml += `          <BldgNb>${escapeXml(
							ultmtCdtrBldgNb
						)}</BldgNb>\n`;
						hasAddressData = true;
					}

					const ultmtCdtrPstCd =
						document.getElementById("ultmtCdtrPstCd").value;
					if (ultmtCdtrPstCd) {
						postalAddressXml += `          <PstCd>${escapeXml(
							ultmtCdtrPstCd
						)}</PstCd>\n`;
						hasAddressData = true;
					}

					const ultmtCdtrTwnNm =
						document.getElementById("ultmtCdtrTwnNm").value;
					if (ultmtCdtrTwnNm) {
						postalAddressXml += `          <TwnNm>${escapeXml(
							ultmtCdtrTwnNm
						)}</TwnNm>\n`;
						hasAddressData = true;
					}

					const ultmtCdtrCtry = document.getElementById("ultmtCdtrCtry").value;
					if (ultmtCdtrCtry) {
						postalAddressXml += `          <Ctry>${escapeXml(
							ultmtCdtrCtry
						)}</Ctry>\n`;
						hasAddressData = true;
					}

					if (hasAddressData) {
						postalAddressXml += "        </PstlAdr>\n";
						xml += postalAddressXml;
					}
				}

				// Dodanie Id (OrgId) dla Ultimate Creditor
				const includeUltmtCdtrId =
					document.getElementById("includeUltmtCdtrId")?.checked;
				if (includeUltmtCdtrId) {
					let hasIdData = false;
					let idXml = "        <Id>\n          <OrgId>\n";

					// AnyBIC
					const ultmtCdtrOrgIdAnyBIC = document.getElementById(
						"ultmtCdtrOrgIdAnyBIC"
					).value;
					if (ultmtCdtrOrgIdAnyBIC) {
						idXml += `            <AnyBIC>${escapeXml(
							ultmtCdtrOrgIdAnyBIC
						)}</AnyBIC>\n`;
						hasIdData = true;
					}

					// LEI
					const ultmtCdtrLEI = document.getElementById("ultmtCdtrLEI").value;
					if (ultmtCdtrLEI) {
						idXml += `            <LEI>${escapeXml(ultmtCdtrLEI)}</LEI>\n`;
						hasIdData = true;
					}

					// Other ID
					const ultmtCdtrOrgIdOthrId = document.getElementById(
						"ultmtCdtrOrgIdOthrId"
					).value;
					if (ultmtCdtrOrgIdOthrId) {
						idXml += "            <Othr>\n";
						idXml += `              <Id>${escapeXml(
							ultmtCdtrOrgIdOthrId
						)}</Id>\n`;

						// SchmeNm
						const ultmtCdtrOrgIdSchemeName = document.getElementById(
							"ultmtCdtrOrgIdSchemeName"
						).value;
						if (ultmtCdtrOrgIdSchemeName) {
							idXml += "              <SchmeNm>\n";

							if (ultmtCdtrOrgIdSchemeName === "Cd") {
								const ultmtCdtrOrgIdSchemeCode = document.getElementById(
									"ultmtCdtrOrgIdSchemeCode"
								).value;
								if (ultmtCdtrOrgIdSchemeCode) {
									idXml += `                <Cd>${escapeXml(
										ultmtCdtrOrgIdSchemeCode
									)}</Cd>\n`;
								}
							} else if (ultmtCdtrOrgIdSchemeName === "Prtry") {
								const ultmtCdtrOrgIdSchemePrtry = document.getElementById(
									"ultmtCdtrOrgIdSchemePrtry"
								).value;
								if (ultmtCdtrOrgIdSchemePrtry) {
									idXml += `                <Prtry>${escapeXml(
										ultmtCdtrOrgIdSchemePrtry
									)}</Prtry>\n`;
								}
							}

							idXml += "              </SchmeNm>\n";
						}

						// Issr
						const ultmtCdtrOrgIdIssr =
							document.getElementById("ultmtCdtrOrgIdIssr").value;
						if (ultmtCdtrOrgIdIssr) {
							idXml += `              <Issr>${escapeXml(
								ultmtCdtrOrgIdIssr
							)}</Issr>\n`;
						}

						idXml += "            </Othr>\n";
						hasIdData = true;
					}

					if (hasIdData) {
						idXml += "          </OrgId>\n";
						idXml += "        </Id>\n";
						xml += idXml;
					}
				}

				// Dodanie CtryOfRes dla Ultimate Creditor
				const includeUltmtCdtrCtryOfRes = document.getElementById(
					"includeUltmtCdtrCtryOfRes"
				)?.checked;
				if (includeUltmtCdtrCtryOfRes) {
					const ultmtCdtrCtryOfRes =
						document.getElementById("ultmtCdtrCtryOfRes").value;
					if (ultmtCdtrCtryOfRes) {
						xml += `        <CtryOfRes>${escapeXml(
							ultmtCdtrCtryOfRes
						)}</CtryOfRes>\n`;
					}
				}

				xml += "      </UltmtCdtr>\n";
			}
		}

		// Purp (Purpose) - opcjonalne
		const includePurp = document.getElementById("includePurp").checked;
		if (includePurp) {
			const purpType = document.getElementById("purpType").value;

			if (purpType === "Cd") {
				const purpCd = document.getElementById("purpCd").value;
				if (purpCd) {
					xml += "      <Purp>\n";
					xml += `        <Cd>${escapeXml(purpCd)}</Cd>\n`;
					xml += "      </Purp>\n";
				}
			} else if (purpType === "Prtry") {
				const purpPrtry = document.getElementById("purpPrtry").value;
				if (purpPrtry) {
					xml += "      <Purp>\n";
					xml += `        <Prtry>${escapeXml(purpPrtry)}</Prtry>\n`;
					xml += "      </Purp>\n";
				}
			}
		}

		// RgltryRptg (Regulatory Reporting) - opcjonalne
		const includeRgltryRptgDbtCdtRptgInd = document.getElementById(
			"includeRgltryRptgDbtCdtRptgInd"
		)?.checked;
		const includeRgltryRptgAuthrtyNm = document.getElementById(
			"includeRgltryRptgAuthrtyNm"
		)?.checked;
		const includeRgltryRptgAuthrtyCtry = document.getElementById(
			"includeRgltryRptgAuthrtyCtry"
		)?.checked;
		const includeRgltryRptgDtlsTp = document.getElementById(
			"includeRgltryRptgDtlsTp"
		)?.checked;
		const includeRgltryRptgDtlsDt = document.getElementById(
			"includeRgltryRptgDtlsDt"
		)?.checked;
		const includeRgltryRptgDtlsCtry = document.getElementById(
			"includeRgltryRptgDtlsCtry"
		)?.checked;
		const includeRgltryRptgDtlsCd = document.getElementById(
			"includeRgltryRptgDtlsCd"
		)?.checked;
		const includeRgltryRptgDtlsAmt = document.getElementById(
			"includeRgltryRptgDtlsAmt"
		)?.checked;
		const includeRgltryRptgDtlsInf = document.getElementById(
			"includeRgltryRptgDtlsInf"
		)?.checked;

		// Sprawdzamy czy jest jakiekolwiek pole do uwzględnienia
		if (
			includeRgltryRptgDbtCdtRptgInd ||
			includeRgltryRptgAuthrtyNm ||
			includeRgltryRptgAuthrtyCtry ||
			includeRgltryRptgDtlsTp ||
			includeRgltryRptgDtlsDt ||
			includeRgltryRptgDtlsCtry ||
			includeRgltryRptgDtlsCd ||
			includeRgltryRptgDtlsAmt ||
			includeRgltryRptgDtlsInf
		) {
			xml += "      <RgltryRptg>\n";

			// DbtCdtRptgInd
			if (includeRgltryRptgDbtCdtRptgInd) {
				const dbtCdtRptgInd = document.getElementById(
					"rgltryRptgDbtCdtRptgInd"
				).value;
				if (dbtCdtRptgInd) {
					xml += `        <DbtCdtRptgInd>${escapeXml(
						dbtCdtRptgInd
					)}</DbtCdtRptgInd>\n`;
				}
			}

			// Authority
			if (includeRgltryRptgAuthrtyNm || includeRgltryRptgAuthrtyCtry) {
				xml += "        <Authrty>\n";

				if (includeRgltryRptgAuthrtyNm) {
					const authrtyNm = document.getElementById(
						"rgltryRptgAuthrtyNm"
					).value;
					if (authrtyNm) {
						xml += `          <Nm>${escapeXml(authrtyNm)}</Nm>\n`;
					}
				}

				if (includeRgltryRptgAuthrtyCtry) {
					const authrtyCtry = document.getElementById(
						"rgltryRptgAuthrtyCtry"
					).value;
					if (authrtyCtry) {
						xml += `          <Ctry>${escapeXml(authrtyCtry)}</Ctry>\n`;
					}
				}

				xml += "        </Authrty>\n";
			}

			// Details
			if (
				includeRgltryRptgDtlsTp ||
				includeRgltryRptgDtlsDt ||
				includeRgltryRptgDtlsCtry ||
				includeRgltryRptgDtlsCd ||
				includeRgltryRptgDtlsAmt ||
				includeRgltryRptgDtlsInf
			) {
				xml += "        <Dtls>\n";

				if (includeRgltryRptgDtlsTp) {
					const dtlsTp = document.getElementById("rgltryRptgDtlsTp").value;
					if (dtlsTp) {
						xml += `          <Tp>${escapeXml(dtlsTp)}</Tp>\n`;
					}
				}

				if (includeRgltryRptgDtlsDt) {
					const dtlsDt = document.getElementById("rgltryRptgDtlsDt").value;
					if (dtlsDt) {
						xml += `          <Dt>${escapeXml(dtlsDt)}</Dt>\n`;
					}
				}

				if (includeRgltryRptgDtlsCtry) {
					const dtlsCtry = document.getElementById("rgltryRptgDtlsCtry").value;
					if (dtlsCtry) {
						xml += `          <Ctry>${escapeXml(dtlsCtry)}</Ctry>\n`;
					}
				}

				if (includeRgltryRptgDtlsCd) {
					const dtlsCd = document.getElementById("rgltryRptgDtlsCd").value;
					if (dtlsCd) {
						xml += `          <Cd>${escapeXml(dtlsCd)}</Cd>\n`;
					}
				}

				if (includeRgltryRptgDtlsAmt) {
					const dtlsAmt = document.getElementById("rgltryRptgDtlsAmt").value;
					const dtlsAmtCcy = document.getElementById(
						"rgltryRptgDtlsAmtCcy"
					).value;
					if (dtlsAmt && dtlsAmtCcy) {
						xml += `          <Amt Ccy="${dtlsAmtCcy}">${dtlsAmt}</Amt>\n`;
					}
				}

				if (includeRgltryRptgDtlsInf) {
					const dtlsInf = document.getElementById("rgltryRptgDtlsInf").value;
					if (dtlsInf) {
						xml += `          <Inf>${escapeXml(dtlsInf)}</Inf>\n`;
					}
				}

				xml += "        </Dtls>\n";
			}

			xml += "      </RgltryRptg>\n";
		}

		// RltdRmtInf (Related Remittance Information) - opcjonalne
		const includeRltdRmtInf =
			document.getElementById("includeRltdRmtInf").checked;
		if (includeRltdRmtInf) {
			const rltdRmtInfRmtId = document.getElementById("rltdRmtInfRmtId").value;
			if (rltdRmtInfRmtId) {
				xml += "      <RltdRmtInf>\n";
				xml += `        <RmtId>${escapeXml(rltdRmtInfRmtId)}</RmtId>\n`;
				xml += "      </RltdRmtInf>\n";
			}
		}

		// InstrForNxtAgt (Instruction For Next Agent) - opcjonalne
		const includeInstrForNxtAgt = document.getElementById(
			"includeInstrForNxtAgt"
		).checked;
		if (includeInstrForNxtAgt) {
			const instrForNxtAgtCd =
				document.getElementById("instrForNxtAgtCd").value;
			if (instrForNxtAgtCd) {
				xml += "      <InstrForNxtAgt>\n";
				xml += `        <Cd>${instrForNxtAgtCd}</Cd>\n`;
				xml += "      </InstrForNxtAgt>\n";
			}
		}

		// IntrmyAgt1 (Intermediary Agent 1) - opcjonalne
		const includeIntrmyAgt1 =
			document.getElementById("includeIntrmyAgt1").checked;
		if (includeIntrmyAgt1) {
			const intrmyAgt1Bicfi = document.getElementById("intrmyAgt1Bicfi").value;
			if (intrmyAgt1Bicfi) {
				xml += "      <IntrmyAgt1>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(intrmyAgt1Bicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </IntrmyAgt1>\n";
			}
		}

		// IntrmyAgt1Acct (Intermediary Agent Account 1) - opcjonalne
		const includeIntrmyAgt1Acct = document.getElementById(
			"includeIntrmyAgt1Acct"
		).checked;
		if (includeIntrmyAgt1Acct) {
			const intrmyAgt1AcctId =
				document.getElementById("intrmyAgt1AcctId").value;
			if (intrmyAgt1AcctId) {
				xml += "      <IntrmyAgt1Acct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(intrmyAgt1AcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </IntrmyAgt1Acct>\n";
			}
		}

		// PrvsInstgAgt1 (Previous Instructing Agent 1) - opcjonalne
		const includePrvsInstgAgt1 = document.getElementById(
			"includePrvsInstgAgt1"
		)?.checked;
		if (includePrvsInstgAgt1) {
			const prvsInstgAgt1Bicfi =
				document.getElementById("prvsInstgAgt1Bicfi").value;
			if (prvsInstgAgt1Bicfi) {
				xml += "      <PrvsInstgAgt1>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(prvsInstgAgt1Bicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </PrvsInstgAgt1>\n";
			}
		}

		// PrvsInstgAgt1Acct (Previous Instructing Agent 1 Account) - opcjonalne
		const includePrvsInstgAgt1Acct = document.getElementById(
			"includePrvsInstgAgt1Acct"
		)?.checked;
		if (includePrvsInstgAgt1Acct) {
			const prvsInstgAgt1AcctId = document.getElementById(
				"prvsInstgAgt1AcctId"
			).value;
			if (prvsInstgAgt1AcctId) {
				xml += "      <PrvsInstgAgt1Acct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(prvsInstgAgt1AcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </PrvsInstgAgt1Acct>\n";
			}
		}

		// DbtrAgt (Debtor Agent) - opcjonalne
		const includeDbtrAgt =
			document.getElementById("includeDbtrAgt")?.checked ||
			document.getElementById("includeDbtrAgt2")?.checked;
		if (includeDbtrAgt) {
			const dbtrAgtBicfi = document.getElementById("dbtrAgtBicfi").value;
			if (dbtrAgtBicfi) {
				xml += "      <DbtrAgt>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(dbtrAgtBicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </DbtrAgt>\n";
			}
		}

		// DbtrAgtAcct (Debtor Agent Account) - opcjonalne
		const includeDbtrAgtAcct =
			document.getElementById("includeDbtrAgtAcct")?.checked;
		if (includeDbtrAgtAcct) {
			const dbtrAgtAcctId = document.getElementById("dbtrAgtAcctId").value;
			if (dbtrAgtAcctId) {
				xml += "      <DbtrAgtAcct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(dbtrAgtAcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </DbtrAgtAcct>\n";
			}
		}

		// CdtrAgt (Creditor Agent) - opcjonalne
		const includeCdtrAgt =
			document.getElementById("includeCdtrAgt")?.checked ||
			document.getElementById("includeCdtrAgt2")?.checked;
		if (includeCdtrAgt) {
			const cdtrAgtBicfi = document.getElementById("cdtrAgtBicfi").value;
			if (cdtrAgtBicfi) {
				xml += "      <CdtrAgt>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(cdtrAgtBicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </CdtrAgt>\n";
			}
		}

		// CdtrAgtAcct (Creditor Agent Account) - opcjonalne
		const includeCdtrAgtAcct =
			document.getElementById("includeCdtrAgtAcct")?.checked;
		if (includeCdtrAgtAcct) {
			const cdtrAgtAcctId = document.getElementById("cdtrAgtAcctId").value;
			if (cdtrAgtAcctId) {
				xml += "      <CdtrAgtAcct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(cdtrAgtAcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </CdtrAgtAcct>\n";
			}
		}

		// InstrForCdtrAgt (Instruction For Creditor Agent) - opcjonalne
		const includeInstrForCdtrAgt = document.getElementById(
			"includeInstrForCdtrAgt"
		)?.checked;
		if (includeInstrForCdtrAgt) {
			const instrForCdtrAgtCd =
				document.getElementById("instrForCdtrAgtCd").value;
			if (instrForCdtrAgtCd) {
				xml += "      <InstrForCdtrAgt>\n";
				xml += `        <Cd>${instrForCdtrAgtCd}</Cd>\n`;
				xml += "      </InstrForCdtrAgt>\n";
			}
		}

		// PrvsInstgAgt3 (Previous Instructing Agent 3) - opcjonalne
		const includePrvsInstgAgt3 = document.getElementById(
			"includePrvsInstgAgt3"
		)?.checked;
		if (includePrvsInstgAgt3) {
			const prvsInstgAgt3Bicfi =
				document.getElementById("prvsInstgAgt3Bicfi").value;
			if (prvsInstgAgt3Bicfi) {
				xml += "      <PrvsInstgAgt3>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(prvsInstgAgt3Bicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </PrvsInstgAgt3>\n";
			}
		}

		// PrvsInstgAgt3Acct (Previous Instructing Agent 3 Account) - opcjonalne
		const includePrvsInstgAgt3Acct = document.getElementById(
			"includePrvsInstgAgt3Acct"
		)?.checked;
		if (includePrvsInstgAgt3Acct) {
			const prvsInstgAgt3AcctId = document.getElementById(
				"prvsInstgAgt3AcctId"
			).value;
			if (prvsInstgAgt3AcctId) {
				xml += "      <PrvsInstgAgt3Acct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(prvsInstgAgt3AcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </PrvsInstgAgt3Acct>\n";
			}
		}

		// IntrmyAgt2 (Intermediary Agent 2) - opcjonalne
		const includeIntrmyAgt2 =
			document.getElementById("includeIntrmyAgt2").checked;
		if (includeIntrmyAgt2) {
			const intrmyAgt2Bicfi = document.getElementById("intrmyAgt2Bicfi").value;
			if (intrmyAgt2Bicfi) {
				xml += "      <IntrmyAgt2>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(intrmyAgt2Bicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </IntrmyAgt2>\n";
			}
		}

		// IntrmyAgt2Acct (Intermediary Agent Account 2) - opcjonalne
		const includeIntrmyAgt2Acct = document.getElementById(
			"includeIntrmyAgt2Acct"
		).checked;
		if (includeIntrmyAgt2Acct) {
			const intrmyAgt2AcctId =
				document.getElementById("intrmyAgt2AcctId").value;
			if (intrmyAgt2AcctId) {
				xml += "      <IntrmyAgt2Acct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(intrmyAgt2AcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </IntrmyAgt2Acct>\n";
			}
		}

		// IntrmyAgt3 (Intermediary Agent 3) - opcjonalne
		const includeIntrmyAgt3 =
			document.getElementById("includeIntrmyAgt3").checked;
		if (includeIntrmyAgt3) {
			const intrmyAgt3Bicfi = document.getElementById("intrmyAgt3Bicfi").value;
			if (intrmyAgt3Bicfi) {
				xml += "      <IntrmyAgt3>\n";
				xml += "        <FinInstnId>\n";
				xml += `          <BICFI>${escapeXml(intrmyAgt3Bicfi)}</BICFI>\n`;
				xml += "        </FinInstnId>\n";
				xml += "      </IntrmyAgt3>\n";
			}
		}

		// IntrmyAgt3Acct (Intermediary Agent Account 3) - opcjonalne
		const includeIntrmyAgt3Acct = document.getElementById(
			"includeIntrmyAgt3Acct"
		).checked;
		if (includeIntrmyAgt3Acct) {
			const intrmyAgt3AcctId =
				document.getElementById("intrmyAgt3AcctId").value;
			if (intrmyAgt3AcctId) {
				xml += "      <IntrmyAgt3Acct>\n";
				xml += "        <Id>\n";
				xml += `          <IBAN>${escapeXml(intrmyAgt3AcctId)}</IBAN>\n`;
				xml += "        </Id>\n";
				xml += "      </IntrmyAgt3Acct>\n";
			}
		}

		// SplmtryInf (Supplementary Information) - opcjonalne
		const includeSplmtryInf =
			document.getElementById("includeSplmtryInf")?.checked;
		if (includeSplmtryInf) {
			const splmtryInf = document.getElementById("splmtryInf").value;
			if (splmtryInf) {
				xml += `      <PmtTpInf>
        <SplmtryInf>${escapeXml(splmtryInf)}</SplmtryInf>
      </PmtTpInf>\n`;
			}
		}

		// SplmtryData (Supplementary Data) - opcjonalne
		const includeSplmtryData =
			document.getElementById("includeSplmtryData")?.checked;
		if (includeSplmtryData) {
			const splmtryData = document.getElementById("splmtryData").value;
			if (splmtryData) {
				xml += `      <SplmtryData>
        <PlcAndNm>TransactionDetails</PlcAndNm>
        <Envlp>
          <AdditionalData>${escapeXml(splmtryData)}</AdditionalData>
        </Envlp>
      </SplmtryData>\n`;
			}
		}

		// InstrForFinInstnId (Instruction For Financial Institution) - opcjonalne
		const includeInstrForFinInstnId = document.getElementById(
			"includeInstrForFinInstnId"
		)?.checked;
		if (includeInstrForFinInstnId) {
			const instrForFinInstnId =
				document.getElementById("instrForFinInstnId").value;
			if (instrForFinInstnId) {
				xml += `      <InstrForFinInstnId>
        <Cd>${escapeXml(instrForFinInstnId)}</Cd>
      </InstrForFinInstnId>\n`;
			}
		}

		// InstrForDbtrAgtAcct (Instruction For Debtor Agent Account) - opcjonalne
		const includeInstrForDbtrAgtAcct = document.getElementById(
			"includeInstrForDbtrAgtAcct"
		)?.checked;
		if (includeInstrForDbtrAgtAcct) {
			const instrForDbtrAgtAcct = document.getElementById(
				"instrForDbtrAgtAcct"
			).value;
			if (instrForDbtrAgtAcct) {
				xml += `      <InstrForDbtrAgtAcct>
        <InstrInf>${escapeXml(instrForDbtrAgtAcct)}</InstrInf>
      </InstrForDbtrAgtAcct>\n`;
			}
		}

		// RgltryCpltc (Regulatory Compliance) - opcjonalne
		const includeRgltryCpltc =
			document.getElementById("includeRgltryCpltc")?.checked;
		if (includeRgltryCpltc) {
			const rgltryCpltc = document.getElementById("rgltryCpltc").value;
			if (rgltryCpltc) {
				xml += `      <RgltryCpltc>
        <Cd>${escapeXml(rgltryCpltc)}</Cd>
      </RgltryCpltc>\n`;
			}
		}

		// ClrChanl (Clearing Channel) - opcjonalne
		const includeClrChanl = document.getElementById("includeClrChanl")?.checked;
		if (includeClrChanl) {
			const clrChanl = document.getElementById("clrChanl").value;
			if (clrChanl) {
				xml += `      <ClrChanl>${escapeXml(clrChanl)}</ClrChanl>\n`;
			}
		}

		// NclsrRsn (Non-Closure Reason) - opcjonalne
		const includeNclsrRsn = document.getElementById("includeNclsrRsn")?.checked;
		if (includeNclsrRsn) {
			const nclsrRsn = document.getElementById("nclsrRsn").value;
			if (nclsrRsn) {
				xml += `      <NclsrRsn>${escapeXml(nclsrRsn)}</NclsrRsn>\n`;
			}
		}

		// RmtInf (Remittance Information) - opcjonalne
		const includeRmtInfUstrd =
			document.getElementById("includeRmtInfUstrd").checked;
		const includeRmtInfStrd =
			document.getElementById("includeRmtInfStrd").checked;

		// Rozszerzona sekcja Structured Remittance Information
		if (includeRmtInfUstrd || includeRmtInfStrd) {
			xml += "      <RmtInf>\n";

			// Niestrukturyzowana informacja
			if (
				includeRmtInfUstrd &&
				document.getElementById("rmtInfUstrd") &&
				document.getElementById("rmtInfUstrd").value
			) {
				xml += `        <Ustrd>${escapeXml(
					document.getElementById("rmtInfUstrd").value
				)}</Ustrd>\n`;
			}

			// Strukturyzowana informacja
			if (includeRmtInfStrd) {
				xml += "        <Strd>\n";

				// Referred Document Information
				xml += "          <RfrdDocInf>\n";

				// Document Number
				if (
					document.getElementById("rmtInfStrdRefInfNb") &&
					document.getElementById("rmtInfStrdRefInfNb").value
				) {
					xml += `            <Nb>${escapeXml(
						document.getElementById("rmtInfStrdRefInfNb").value
					)}</Nb>\n`;
				}

				// Document Type
				const includeRmtInfStrdTpCd = document.getElementById(
					"includeRmtInfStrdTpCd"
				)?.checked;
				if (
					includeRmtInfStrdTpCd &&
					document.getElementById("rmtInfStrdTpCd").value
				) {
					xml += "            <Tp>\n";
					xml += `              <Cd>${escapeXml(
						document.getElementById("rmtInfStrdTpCd").value
					)}</Cd>\n`;
					xml += "            </Tp>\n";
				}

				// Related Date
				const includeRmtInfStrdRefInfRltdDt = document.getElementById(
					"includeRmtInfStrdRefInfRltdDt"
				)?.checked;
				if (
					includeRmtInfStrdRefInfRltdDt &&
					document.getElementById("rmtInfStrdRefInfRltdDt") &&
					document.getElementById("rmtInfStrdRefInfRltdDt").value
				) {
					xml += `            <RltdDt>${escapeXml(
						document.getElementById("rmtInfStrdRefInfRltdDt").value
					)}</RltdDt>\n`;
				}

				xml += "          </RfrdDocInf>\n";

				// Referred Document Amount
				const includeRmtInfStrdDuePyblAmt = document.getElementById(
					"includeRmtInfStrdDuePyblAmt"
				)?.checked;
				const includeRmtInfStrdRmtdAmt = document.getElementById(
					"includeRmtInfStrdRmtdAmt"
				)?.checked;

				if (includeRmtInfStrdDuePyblAmt || includeRmtInfStrdRmtdAmt) {
					xml += "          <RfrdDocAmt>\n";

					// Due Payable Amount
					if (
						includeRmtInfStrdDuePyblAmt &&
						document.getElementById("rmtInfStrdDuePyblAmt") &&
						document.getElementById("rmtInfStrdDuePyblAmt").value
					) {
						const duePyblAmt = document.getElementById(
							"rmtInfStrdDuePyblAmt"
						).value;
						const duePyblAmtCcy = document.getElementById(
							"rmtInfStrdDuePyblAmtCcy"
						).value;
						xml += `            <DuePyblAmt Ccy="${escapeXml(
							duePyblAmtCcy
						)}">${escapeXml(duePyblAmt)}</DuePyblAmt>\n`;
					}

					// Remitted Amount
					if (
						includeRmtInfStrdRmtdAmt &&
						document.getElementById("rmtInfStrdRmtdAmt") &&
						document.getElementById("rmtInfStrdRmtdAmt").value
					) {
						const rmtdAmt = document.getElementById("rmtInfStrdRmtdAmt").value;
						const rmtdAmtCcy = document.getElementById(
							"rmtInfStrdRmtdAmtCcy"
						).value;
						xml += `            <RmtdAmt Ccy="${escapeXml(
							rmtdAmtCcy
						)}">${escapeXml(rmtdAmt)}</RmtdAmt>\n`;
					}

					xml += "          </RfrdDocAmt>\n";
				}

				// Creditor Reference Information
				const includeRmtInfStrdCdtrRefInf = document.getElementById(
					"includeRmtInfStrdCdtrRefInf"
				)?.checked;
				const includeRmtInfStrdCdtrRefInfRef = document.getElementById(
					"includeRmtInfStrdCdtrRefInfRef"
				)?.checked;

				if (includeRmtInfStrdCdtrRefInf || includeRmtInfStrdCdtrRefInfRef) {
					xml += "          <CdtrRefInf>\n";

					// Type
					if (
						includeRmtInfStrdCdtrRefInf &&
						document.getElementById("rmtInfStrdCdtrRefInfTp") &&
						document.getElementById("rmtInfStrdCdtrRefInfTp").value
					) {
						xml += "            <Tp>\n";
						xml += `              <Cd>${escapeXml(
							document.getElementById("rmtInfStrdCdtrRefInfTp").value
						)}</Cd>\n`;
						xml += "            </Tp>\n";
					}

					// Reference
					if (
						includeRmtInfStrdCdtrRefInfRef &&
						document.getElementById("rmtInfStrdCdtrRefInfRef") &&
						document.getElementById("rmtInfStrdCdtrRefInfRef").value
					) {
						xml += `            <Ref>${escapeXml(
							document.getElementById("rmtInfStrdCdtrRefInfRef").value
						)}</Ref>\n`;
					}

					xml += "          </CdtrRefInf>\n";
				}

				// Additional Remittance Information
				const includeRmtInfStrdAddtlRmtInf = document.getElementById(
					"includeRmtInfStrdAddtlRmtInf"
				)?.checked;
				if (
					includeRmtInfStrdAddtlRmtInf &&
					document.getElementById("rmtInfStrdAddtlRmtInf") &&
					document.getElementById("rmtInfStrdAddtlRmtInf").value
				) {
					xml += `          <AddtlRmtInf>${escapeXml(
						document.getElementById("rmtInfStrdAddtlRmtInf").value
					)}</AddtlRmtInf>\n`;
				}

				xml += "        </Strd>\n";
			}

			xml += "      </RmtInf>\n";
		}

		xml += "    </CdtTrfTxInf>\n";
		xml += "  </FIToFICstmrCdtTrf>\n";
		xml += "</Document>";

		return xml;
	}

	// Funkcja do escapowania znaków specjalnych w XML
	function escapeXml(unsafe) {
		return unsafe.replace(/[<>&'"]/g, function (c) {
			switch (c) {
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case "&":
					return "&amp;";
				case "'":
					return "&apos;";
				case '"':
					return "&quot;";
			}
		});
	}

	// Pomocnicza funkcja do dodawania zera z przodu dla liczb < 10
	function padZero(num) {
		return num < 10 ? "0" + num : num;
	}

	// Wyświetlanie XML w elemencie pre
	function displayXML(xml) {
		xmlOutput.textContent = xml;
	}

	// Pobieranie XML jako pliku
	function downloadXML(xml) {
		const blob = new Blob([xml], { type: "application/xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "pacs.008.001.13.xml";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Wypełnianie pól wymaganych przykładowymi danymi
	function fillRequiredFields() {
		// MsgId (Message Identification)
		document.getElementById("msgId").value = "MSG-ID-" + new Date().getTime();

		// CreDtTm (Creation Date Time)
		const now = new Date();
		const year = now.getFullYear();
		const month = padZero(now.getMonth() + 1);
		const day = padZero(now.getDate());
		const hours = padZero(now.getHours());
		const minutes = padZero(now.getMinutes());

		// Format dla input type="datetime-local": YYYY-MM-DDThh:mm
		document.getElementById(
			"creDtTm"
		).value = `${year}-${month}-${day}T${hours}:${minutes}`;

		// NbOfTxs (Number of Transactions) - domyślnie 1
		document.getElementById("nbOfTxs").value = "1";

		// SttlmMtd (Settlement Method) - domyślnie CLRG
		document.getElementById("sttlmMtd").value = "CLRG";

		// Pola z sekcji CdtTrfTxInf
		// EndToEndId
		document.getElementById("endToEndId").value =
			"E2E-ID-" + new Date().getTime();

		// IntrBkSttlmAmt i waluta
		document.getElementById("intrBkSttlmAmt").value = "100.00";
		document.getElementById("intrBkSttlmAmtCcy").value = "EUR";

		// ChrgBr
		document.getElementById("chrgBr").value = "SHAR";

		// Dbtr i DbtrAcct
		document.getElementById("dbtrNm").value = "Nazwa Dłużnika Sp. z o.o.";
		document.getElementById("dbtrAcctId").value =
			"PL21109010140000071219812874";

		// Cdtr i CdtrAcct
		document.getElementById("cdtrNm").value = "Nazwa Wierzyciela S.A.";
		document.getElementById("cdtrAcctId").value = "DE89370400440532013000";

		// Komunikat o wypełnieniu pól
		showNotification("Wypełniono pola wymagane");
	}

	// Wypełnianie pól opcjonalnych przykładowymi danymi
	function fillOptionalFields() {
		/* 
		Funkcja pomocnicza do bezpiecznego ustawiania wartości pól.
		Sprawdza czy checkbox i pole istnieją przed próbą ustawienia wartości
		*/
		function safeSetFieldValue(checkboxId, inputId, value) {
			// Special case handling for when only checkbox needs to be checked
			if (checkboxId !== null && inputId === null) {
				const checkbox = document.getElementById(checkboxId);
				if (checkbox) {
					checkbox.checked = true;
					return true;
				}
				return false;
			}

			// Regular case with both checkbox and input
			const checkbox = checkboxId ? document.getElementById(checkboxId) : null;
			const input = inputId ? document.getElementById(inputId) : null;

			// Return early if input doesn't exist
			if (!input) {
				console.warn(`Input field with ID '${inputId}' not found.`);
				return false;
			}

			// If checkbox exists, check it and enable the input
			if (checkbox) {
				checkbox.checked = true;
				input.disabled = false;
			}

			// Set the value
			input.value = value;

			// Check for related fields via data-related-field attribute
			if (checkbox) {
				const relatedFieldId = checkbox.getAttribute("data-related-field");
				if (relatedFieldId) {
					const relatedField = document.getElementById(relatedFieldId);
					if (relatedField) {
						relatedField.disabled = false;
					}
				}
			}

			// Check for currency field
			const currencyFieldId = inputId + "Ccy";
			const currencyField = document.getElementById(currencyFieldId);
			if (currencyField) {
				currencyField.disabled = false;
			}

			return true;
		}

		try {
			// Generowanie identyfikatorów dla endToEndId
			const randomEndToEndId =
				"E2E" + Math.floor(Math.random() * 10000000).toString();

			// 1. Expiry Date Time - poprawione ID
			safeSetFieldValue(
				"includeXpryDtTm",
				"xpryDtTm",
				getISODateTime(1, "days")
			);

			// 2. Batch Booking - poprawione ID
			safeSetFieldValue("includeBtchBookg", "btchBookg", "true");

			// 3. Control Sum - dodane pole
			safeSetFieldValue("includeCtrlSum", "ctrlSum", "1000.00");

			// 4. Total Interbank Settlement Amount - dodane pole
			safeSetFieldValue(
				"includeTtlIntrBkSttlmAmt",
				"ttlIntrBkSttlmAmt",
				"1000.00"
			);

			// Waluta dla Total Interbank Settlement Amount
			const ttlIntrBkSttlmAmtCcy = document.getElementById(
				"ttlIntrBkSttlmAmtCcy"
			);
			if (ttlIntrBkSttlmAmtCcy) {
				ttlIntrBkSttlmAmtCcy.value = "EUR";
			}

			// 5. Interbank Settlement Date - dodane pole
			safeSetFieldValue(
				"includeIntrBkSttlmDt",
				"intrBkSttlmDt",
				getISODateTime(0, "days").split("T")[0]
			);

			// 6. Clearing System - sprawdzenie czy istnieje
			safeSetFieldValue("includeClrSys", "clrSysCd", "TARGET");

			// Pola, które są wymagane, więc powinny być ustawione bezpośrednio bez checkboxa
			if (document.getElementById("nbOfTxs")) {
				document.getElementById("nbOfTxs").value = "1";
			}

			if (document.getElementById("intrBkSttlmAmt")) {
				document.getElementById("intrBkSttlmAmt").value = "1000.00";
			}

			// 7. Settlement Priority
			safeSetFieldValue("includeSttlmPrty", "sttlmPrty", "NORM");

			// 8. Settlement Time Indication
			safeSetFieldValue(
				"includeSttlmTmIndctn",
				"sttlmTmIndctnCdtDtTm",
				getISODateTime(0, "days")
			);
			safeSetFieldValue(
				"includeDbtDtTm",
				"sttlmTmIndctnDbtDtTm",
				getISODateTime(0, "days")
			);

			// 9. Settlement Time Request
			safeSetFieldValue(
				"includeSttlmTmReq",
				"sttlmTmReqClsTm",
				getISODateTime(0, "days").split("T")[1]
			);
			safeSetFieldValue(
				"includeRjctTm",
				"sttlmTmReqRjctTm",
				getISODateTime(0, "days").split("T")[1]
			);
			safeSetFieldValue(
				"includeFrTm",
				"sttlmTmReqFrTm",
				getISODateTime(0, "days").split("T")[1]
			);
			safeSetFieldValue(
				"includeTillTm",
				"sttlmTmReqTillTm",
				getISODateTime(0, "days").split("T")[1]
			);

			// 10. Acceptance Date Time
			safeSetFieldValue(
				"includeAccptncDtTm",
				"accptncDtTm",
				getISODateTime(0, "days")
			);

			// 11. Pool Identifier
			safeSetFieldValue(
				"includePoolgAdjstmntDt",
				"poolgAdjstmntDt",
				getISODateTime(0, "days").split("T")[0]
			);
			safeSetFieldValue(
				"includePoolgId",
				"poolgId",
				"POOL" + Math.floor(Math.random() * 10000000).toString()
			);

			// 12. Instructed Amount
			safeSetFieldValue("includeInstdAmt", "instdAmt", "1005.50");
			safeSetFieldValue("includeInstdAmt", "instdAmtCcy", "EUR");

			// 13. Exchange Rate - poprawiony ID
			safeSetFieldValue("includeXchgRate", "xchgRate", "1.1352");

			// 14. Charges Information Amount
			safeSetFieldValue("includeChrgsInf", "chrgsInfAmt", "5.50");
			const chrgsInfAmtCcy = document.getElementById("chrgsInfAmtCcy");
			if (chrgsInfAmtCcy) {
				chrgsInfAmtCcy.value = "EUR";
			}
			// Party BICFI w ChrgsInf
			safeSetFieldValue(
				"includeChrgsInfPtyBICFI",
				"chrgsInfPtyBICFI",
				"BANKPLPWXXX"
			);

			// Charge Type
			safeSetFieldValue("includeChrgsInfTp", "chrgsInfTpCd", "COMM");

			// 15. Payment Signature
			safeSetFieldValue(
				"includePmtSgntr",
				"pmtSgntrValue",
				"4642F973614EAA85396053511F5F6FFA"
			);
			const pmtSgntrType = document.getElementById("pmtSgntrType");
			if (pmtSgntrType) {
				pmtSgntrType.value = "ILPV4";
				pmtSgntrType.disabled = false;
			}

			// 16. Mandate Related Information
			safeSetFieldValue("includeMndtRltdInf", "mndtId", "MNDT2024001");
			safeSetFieldValue(
				"includeDtOfSgntr",
				"dtOfSgntr",
				getISODateTime(-30, "days").split("T")[0]
			);

			// 17. Instructing Agent
			safeSetFieldValue("includeInstgAgt", "instgAgtId", "BPKOPLPW");
			safeSetFieldValue(
				"includeInstgAgtLEI",
				"instgAgtLEI",
				"9598001FJTIEDE3QB472"
			);
			safeSetFieldValue("includeInstgAgtNm", "instgAgtNm", "Bank Polski");

			// Instructing Agent Other
			safeSetFieldValue(
				"includeInstgAgtOtherId",
				"instgAgtOtherId",
				"87654321"
			);
			const instgAgtOthrSchmeNmContainer = document.getElementById(
				"instgAgtOthrSchmeNmContainer"
			);
			if (instgAgtOthrSchmeNmContainer) {
				instgAgtOthrSchmeNmContainer.style.display = "block";
			}
			const instgAgtOthrSchmeNmCd = document.getElementById(
				"instgAgtOthrSchmeNmCd"
			);
			if (instgAgtOthrSchmeNmCd) {
				instgAgtOthrSchmeNmCd.value = "BANK";
			}
			const instgAgtOthrIssr = document.getElementById("instgAgtOthrIssr");
			if (instgAgtOthrIssr) {
				instgAgtOthrIssr.value = "NBP";
			}

			// Instructing Agent Address
			safeSetFieldValue(
				"includeInstgAgtPstlAdr",
				"instgAgtStrtNm",
				"Świętokrzyska"
			);
			safeSetFieldValue("includeInstgAgtPstlAdr", "instgAgtBldgNb", "42");
			safeSetFieldValue("includeInstgAgtPstlAdr", "instgAgtPstCd", "00-950");
			safeSetFieldValue("includeInstgAgtPstlAdr", "instgAgtTwnNm", "Warszawa");
			safeSetFieldValue("includeInstgAgtPstlAdr", "instgAgtCtry", "PL");

			// Instructing Agent Branch
			safeSetFieldValue(
				"includeInstgAgtBrnchId",
				"instgAgtBrnchId",
				"BRANCH-001"
			);
			safeSetFieldValue(
				"includeInstgAgtBrnchId",
				"instgAgtBrnchNm",
				"Centrala"
			);

			// 18. Instructed Agent - dodane pola
			safeSetFieldValue("includeInstdAgt", "instdAgtId", "DEUTDEFFXXX");
			safeSetFieldValue(
				"includeInstdAgtLEI",
				"instdAgtLEI",
				"7LTWFZYICNSX8D621K86"
			);
			safeSetFieldValue("includeInstdAgtNm", "instdAgtNm", "Deutsche Bank");

			// Instructed Agent Other
			safeSetFieldValue(
				"includeInstdAgtOtherId",
				"instdAgtOtherId",
				"12345678"
			);
			const instdAgtOthrSchmeNmContainer = document.getElementById(
				"instdAgtOthrSchmeNmContainer"
			);
			if (instdAgtOthrSchmeNmContainer) {
				instdAgtOthrSchmeNmContainer.style.display = "block";
			}
			const instdAgtOthrSchmeNmCd = document.getElementById(
				"instdAgtOthrSchmeNmCd"
			);
			if (instdAgtOthrSchmeNmCd) {
				instdAgtOthrSchmeNmCd.value = "BANK";
			}
			const instdAgtOthrIssr = document.getElementById("instdAgtOthrIssr");
			if (instdAgtOthrIssr) {
				instdAgtOthrIssr.value = "Bundesbank";
			}

			// Instructed Agent Address
			safeSetFieldValue(
				"includeInstdAgtPstlAdr",
				"instdAgtStrtNm",
				"Taunusanlage"
			);
			safeSetFieldValue("includeInstdAgtPstlAdr", "instdAgtBldgNb", "12");
			safeSetFieldValue("includeInstdAgtPstlAdr", "instdAgtPstCd", "60325");
			safeSetFieldValue(
				"includeInstdAgtPstlAdr",
				"instdAgtTwnNm",
				"Frankfurt am Main"
			);
			safeSetFieldValue("includeInstdAgtPstlAdr", "instdAgtCtry", "DE");

			// Instructed Agent Branch
			safeSetFieldValue(
				"includeInstdAgtBrnchId",
				"instdAgtBrnchId",
				"BRANCH-101"
			);
			safeSetFieldValue(
				"includeInstdAgtBrnchId",
				"instdAgtBrnchNm",
				"Hauptsitz"
			);

			// 25. Debtor Account dodatkowe pola
			safeSetFieldValue("includeDbtrAcctTp", "dbtrAcctTp", "CACC");
			safeSetFieldValue("includeDbtrAcctCcy", "dbtrAcctCcy", "PLN");
			safeSetFieldValue(
				"includeDbtrAcctNm",
				"dbtrAcctNm",
				"Rachunek bieżący Klienta"
			);
			safeSetFieldValue("includeDbtrAcctProxyTp", "dbtrAcctProxyTp", "EMAL");
			safeSetFieldValue(
				"includeDbtrAcctProxyTp",
				"dbtrAcctProxyVal",
				"jan.kowalski@example.com"
			);

			// 26. Creditor Account dodatkowe pola
			safeSetFieldValue("includeCdtrAcctTp", "cdtrAcctTp", "CACC");
			safeSetFieldValue("includeCdtrAcctCcy", "cdtrAcctCcy", "EUR");
			safeSetFieldValue("includeCdtrAcctNm", "cdtrAcctNm", "Geschäftskonto");
			safeSetFieldValue("includeCdtrAcctProxyTp", "cdtrAcctProxyTp", "EMAL");
			safeSetFieldValue(
				"includeCdtrAcctProxyTp",
				"cdtrAcctProxyVal",
				"hans.mueller@example.de"
			);

			// 20. Debtor Agent
			safeSetFieldValue("includeDbtrAgt", "dbtrAgtBicfi", "NBPLPLPWXXX");
			// Obsługa drugiego checkboxa dla DbtrAgt, jeśli istnieje
			if (document.getElementById("includeDbtrAgt2")) {
				document.getElementById("includeDbtrAgt2").checked = true;
				const dbtrAgtBicfiField = document.getElementById("dbtrAgtBicfi");
				if (dbtrAgtBicfiField) {
					dbtrAgtBicfiField.disabled = false;
				}
			}

			safeSetFieldValue(
				"includeDbtrAgtAcct",
				"dbtrAgtAcctId",
				"PL98765432109876543210987654"
			);

			// 21. Ultimate Debtor - rozszerzam istniejącą sekcję
			safeSetFieldValue(
				"includeUltmtDbtr",
				"ultmtDbtrNm",
				"Ultimate Debtor Corp"
			);
			safeSetFieldValue(
				"includeUltmtDbtrCtryOfRes",
				"ultmtDbtrCtryOfRes",
				"US"
			);

			// Ultimate Debtor OrgId
			document.getElementById("includeUltmtDbtrId").checked = true;
			document.getElementById("ultmtDbtrOrgIdContainer").style.display =
				"block";
			document.getElementById("ultmtDbtrOrgIdAnyBIC").value = "CITYUS33XXX";
			document.getElementById("ultmtDbtrLEI").value = "ABCDEFGHIJKLMNOPQR11";
			document.getElementById("ultmtDbtrOrgIdOthrId").value = "98765432109";

			// Ultimate Debtor SchemeNm
			const ultmtDbtrOrgIdSchemeName = document.getElementById(
				"ultmtDbtrOrgIdSchemeName"
			);
			ultmtDbtrOrgIdSchemeName.value = "Cd";
			const ultmtDbtrEvent = new Event("change");
			ultmtDbtrOrgIdSchemeName.dispatchEvent(ultmtDbtrEvent);

			document.getElementById("ultmtDbtrOrgIdSchemeCode").value = "TXID";
			document.getElementById("ultmtDbtrOrgIdIssr").value = "IRS";

			// Ultimate Debtor Postal Address
			safeSetFieldValue(
				"includeUltmtDbtrPstlAdr",
				"ultmtDbtrStrtNm",
				"Wall Street"
			);
			safeSetFieldValue("includeUltmtDbtrPstlAdr", "ultmtDbtrBldgNb", "15");
			safeSetFieldValue("includeUltmtDbtrPstlAdr", "ultmtDbtrPstCd", "10005");
			safeSetFieldValue(
				"includeUltmtDbtrPstlAdr",
				"ultmtDbtrTwnNm",
				"New York"
			);
			safeSetFieldValue("includeUltmtDbtrPstlAdr", "ultmtDbtrCtry", "US");

			// Ultimate Creditor
			safeSetFieldValue(
				"includeUltmtCdtr",
				"ultmtCdtrNm",
				"Ultimate Creditor GmbH"
			);
			safeSetFieldValue(
				"includeUltmtCdtrCtryOfRes",
				"ultmtCdtrCtryOfRes",
				"DE"
			);

			// Ultimate Creditor OrgId
			document.getElementById("includeUltmtCdtrId").checked = true;
			document.getElementById("ultmtCdtrOrgIdContainer").style.display =
				"block";
			document.getElementById("ultmtCdtrOrgIdAnyBIC").value = "DEUTDEFFXXX";
			document.getElementById("ultmtCdtrLEI").value = "ABCDEFGHIJKLMNOPQR22";
			document.getElementById("ultmtCdtrOrgIdOthrId").value = "123456789DE";

			// Ultimate Creditor SchemeNm
			const ultmtCdtrOrgIdSchemeName = document.getElementById(
				"ultmtCdtrOrgIdSchemeName"
			);
			ultmtCdtrOrgIdSchemeName.value = "Cd";
			const ultmtCdtrEvent = new Event("change");
			ultmtCdtrOrgIdSchemeName.dispatchEvent(ultmtCdtrEvent);

			document.getElementById("ultmtCdtrOrgIdSchemeCode").value = "COID";
			document.getElementById("ultmtCdtrOrgIdIssr").value = "Deutsche Bank";

			// Ultimate Creditor Postal Address
			safeSetFieldValue(
				"includeUltmtCdtrPstlAdr",
				"ultmtCdtrStrtNm",
				"Mainzer Landstrasse"
			);
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrBldgNb", "11-21");
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrPstCd", "60325");
			safeSetFieldValue(
				"includeUltmtCdtrPstlAdr",
				"ultmtCdtrTwnNm",
				"Frankfurt"
			);
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrCtry", "DE");

			// 22. Previous Instructing Agent
			safeSetFieldValue(
				"includePrvsInstgAgt1",
				"prvsInstgAgt1Bicfi",
				"AAAAPLP0XXX"
			);
			safeSetFieldValue(
				"includePrvsInstgAgt1Acct",
				"prvsInstgAgt1AcctId",
				"PL12121212121212121212121212"
			);

			safeSetFieldValue(
				"includePrvsInstgAgt2",
				"prvsInstgAgt2Bicfi",
				"BBBBPLP0XXX"
			);
			safeSetFieldValue(
				"includePrvsInstgAgt2Acct",
				"prvsInstgAgt2AcctId",
				"PL23232323232323232323232323"
			);

			safeSetFieldValue(
				"includePrvsInstgAgt3",
				"prvsInstgAgt3Bicfi",
				"CCCCPLP0XXX"
			);
			safeSetFieldValue(
				"includePrvsInstgAgt3Acct",
				"prvsInstgAgt3AcctId",
				"PL34343434343434343434343434"
			);

			// 23. Intermediary Agent
			safeSetFieldValue("includeIntrmyAgt1", "intrmyAgt1Bicfi", "DDDDPLP0XXX");
			safeSetFieldValue(
				"includeIntrmyAgt1Acct",
				"intrmyAgt1AcctId",
				"PL45454545454545454545454545"
			);

			safeSetFieldValue("includeIntrmyAgt2", "intrmyAgt2Bicfi", "EEEEPLP0XXX");
			safeSetFieldValue(
				"includeIntrmyAgt2Acct",
				"intrmyAgt2AcctId",
				"PL56565656565656565656565656"
			);

			safeSetFieldValue("includeIntrmyAgt3", "intrmyAgt3Bicfi", "FFFFPLP0XXX");
			safeSetFieldValue(
				"includeIntrmyAgt3Acct",
				"intrmyAgt3AcctId",
				"PL67676767676767676767676767"
			);

			// 24. Creditor Agent
			safeSetFieldValue("includeCdtrAgt", "cdtrAgtBicfi", "GGGGGPLPXXX");
			// Obsługa drugiego checkboxa dla CdtrAgt, jeśli istnieje
			if (document.getElementById("includeCdtrAgt2")) {
				document.getElementById("includeCdtrAgt2").checked = true;
				const cdtrAgtBicfiField = document.getElementById("cdtrAgtBicfi");
				if (cdtrAgtBicfiField) {
					cdtrAgtBicfiField.disabled = false;
				}
			}

			safeSetFieldValue(
				"includeCdtrAgtAcct",
				"cdtrAgtAcctId",
				"DE98765432109876543210"
			);

			// 25. Creditor
			safeSetFieldValue("includeCdtr", "cdtrNm", "Jane Smith");
			safeSetFieldValue("includeCdtrPstlAdr", "cdtrStrtNm", "Kwiatowa");
			safeSetFieldValue("includeCdtrPstlAdr", "cdtrBldgNb", "7");
			safeSetFieldValue("includeCdtrPstlAdr", "cdtrPstCd", "00-950");
			safeSetFieldValue("includeCdtrPstlAdr", "cdtrTwnNm", "Warsaw");
			safeSetFieldValue("includeCdtrPstlAdr", "cdtrCtry", "PL");
			safeSetFieldValue(
				"includeCdtrAcct",
				"cdtrAcctId",
				"PL89898989898989898989898989"
			);

			// 26. Ultimate Creditor
			safeSetFieldValue(
				"includeUltmtCdtr",
				"ultmtCdtrNm",
				"Ultimate Creditor Inc."
			);
			safeSetFieldValue(
				"includeUltmtCdtrPstlAdr",
				"ultmtCdtrStrtNm",
				"Main Street"
			);
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrBldgNb", "100");
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrPstCd", "00-950");
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrTwnNm", "Warsaw");
			safeSetFieldValue("includeUltmtCdtrPstlAdr", "ultmtCdtrCtry", "PL");

			// Regulatory Reporting
			safeSetFieldValue(
				"includeRgltryRptgDbtCdtRptgInd",
				"rgltryRptgDbtCdtRptgInd",
				"CRED"
			);
			safeSetFieldValue(
				"includeRgltryRptgAuthrtyNm",
				"rgltryRptgAuthrtyNm",
				"Narodowy Bank Polski"
			);
			safeSetFieldValue(
				"includeRgltryRptgAuthrtyCtry",
				"rgltryRptgAuthrtyCtry",
				"PL"
			);
			safeSetFieldValue(
				"includeRgltryRptgDtlsTp",
				"rgltryRptgDtlsTp",
				"REPORTING_TYPE_1"
			);
			safeSetFieldValue(
				"includeRgltryRptgDtlsDt",
				"rgltryRptgDtlsDt",
				getISODateTime(0, "days").split("T")[0]
			);
			safeSetFieldValue(
				"includeRgltryRptgDtlsCtry",
				"rgltryRptgDtlsCtry",
				"PL"
			);
			safeSetFieldValue(
				"includeRgltryRptgDtlsCd",
				"rgltryRptgDtlsCd",
				"REG123"
			);
			safeSetFieldValue(
				"includeRgltryRptgDtlsAmt",
				"rgltryRptgDtlsAmt",
				"1000.00"
			);
			const rgltryRptgDtlsAmtCcy = document.getElementById(
				"rgltryRptgDtlsAmtCcy"
			);
			if (rgltryRptgDtlsAmtCcy) {
				rgltryRptgDtlsAmtCcy.value = "EUR";
			}
			safeSetFieldValue(
				"includeRgltryRptgDtlsInf",
				"rgltryRptgDtlsInf",
				"Import declaration reference"
			);

			// 27. Service Level Code
			safeSetFieldValue("includeSvcLvl", "svcLvlCd", "SEPA");

			// Zaznaczenie checkboxa dla Payment Type Information (PmtTpInf)
			if (document.getElementById("includePmtTpInf")) {
				document.getElementById("includePmtTpInf").checked = true;
				// Pokazanie kontenera dla PmtTpInf
				if (document.getElementById("pmtTpInfContainer")) {
					document.getElementById("pmtTpInfContainer").style.display = "block";
				}
			}

			// Instruction Priority (pole w sekcji PmtTpInf)
			safeSetFieldValue("includeInstrPrty", "instrPrty", "HIGH");

			// 28. Local Instrument Code
			safeSetFieldValue("includeLclInstrm", "lclInstrmCd", "INST");

			// 29. Category Purpose Code
			safeSetFieldValue("includeCtgyPurp", "ctgyPurpCd", "CASH");

			// 30. Instruction for Creditor Agent
			safeSetFieldValue("includeInstrForCdtrAgt", "instrForCdtrAgtCd", "HOLD");
			safeSetFieldValue(
				"includeInstrForCdtrAgtInf",
				"instrForCdtrAgtInf",
				"Please hold for collection"
			);

			// 31. Instruction for Next Agent
			safeSetFieldValue(
				"includeInstrForNxtAgt",
				"instrForNxtAgt",
				"Please process urgently"
			);
			// Instruction for Next Agent Code - poprawione ID
			if (
				document.getElementById("includeInstrForNxtAgt") &&
				document.getElementById("instrForNxtAgtCd")
			) {
				document.getElementById("includeInstrForNxtAgt").checked = true;
				const instrForNxtAgtCdField =
					document.getElementById("instrForNxtAgtCd");
				instrForNxtAgtCdField.disabled = false; // Usunięcie atrybutu disabled
				instrForNxtAgtCdField.value = "PHOB";

				// Wyszukanie wszystkich checkboxów, które kontrolują to pole
				document
					.querySelectorAll('input[data-field="instrForNxtAgtCd"]')
					.forEach(checkbox => {
						checkbox.checked = true;
					});
			}

			// 32. Instruction For Debtor Agent
			safeSetFieldValue(
				"includeInstrForDbtrAgt",
				"instrForDbtrAgt",
				"Process with high priority"
			);

			// 33. Settlement Date
			safeSetFieldValue(
				"includeCdtTrfTxInfSttlmDt",
				"cdtTrfTxInfSttlmDt",
				getISODateTime(0, "days").split("T")[0]
			);

			// 34. Instruction Identification
			safeSetFieldValue(
				"includeInstrId",
				"instrId",
				"INSTR-ID-" + Math.floor(Math.random() * 10000000).toString()
			);

			// 35. End To End Identification
			if (
				document.getElementById("includeEndToEndId") &&
				document.getElementById("endToEndId2")
			) {
				safeSetFieldValue(
					"includeEndToEndId",
					"endToEndId2",
					"E2E-" + Math.floor(Math.random() * 10000000).toString()
				);
			}

			// 36. Purpose - poprawka ID
			document.getElementById("purpType").value = "Cd";
			const purpTypeEvent = new Event("change");
			document.getElementById("purpType").dispatchEvent(purpTypeEvent);
			safeSetFieldValue("includePurp", "purpCd", "CASH");

			// 36b. Purpose Proprietary - alternatywny typ
			safeSetFieldValue("includePurp", "purpPrtry", "Custom Business Purpose");

			// 37. Regulatory Reporting
			safeSetFieldValue("includeRgltryRptgCtry", "rgltryRptgCtry", "PL");
			safeSetFieldValue(
				"includeRgltryRptgDtls",
				"rgltryRptgDtls",
				"Regulatory details"
			);
			// Debit Credit Reporting Indicator - poprawione ID
			if (
				document.getElementById("includeRgltryRptg") &&
				document.getElementById("rgltryRptgDbtCdtRptgInd")
			) {
				document.getElementById("includeRgltryRptg").checked = true;
				document.getElementById("rgltryRptgDbtCdtRptgInd").value = "CRED";
			}

			// 38. Tax Information
			safeSetFieldValue("includeTax", "taxCdtrTaxId", "TAX123456789");
			safeSetFieldValue("includeTax", "taxCdtrRegnId", "REG987654321");
			safeSetFieldValue("includeTax", "taxCdtrTaxTp", "VAT");
			safeSetFieldValue("includeTax", "taxRefNb", "TAX/VAT/2023");
			safeSetFieldValue(
				"includeTax",
				"taxDt",
				getISODateTime(0, "days").split("T")[0]
			);

			// 39. Non-closure Reason
			safeSetFieldValue(
				"includeNclsrRsn",
				"nclsrRsn",
				"Needing further validation and approval"
			);

			// Supplementary Data
			safeSetFieldValue(
				"includeSplmtryData",
				"splmtryData",
				"Additional transaction data for analysis"
			);

			// 40. Remittance Information
			safeSetFieldValue("includeRmtInfUstrd", "rmtInfUstrd", "Invoice payment");
			safeSetFieldValue(
				"includeRmtInfStrd",
				"rmtInfStrdRefInfNb",
				"REF/2024/06/1234"
			);

			// Rozszerzone dane dla Structured Remittance Information
			safeSetFieldValue(
				"includeRmtInfStrdRefInfRltdDt",
				"rmtInfStrdRefInfRltdDt",
				getISODateTime(0, "days").split("T")[0]
			);
			safeSetFieldValue("includeRmtInfStrdTpCd", "rmtInfStrdTpCd", "CINV");
			safeSetFieldValue(
				"includeRmtInfStrdDuePyblAmt",
				"rmtInfStrdDuePyblAmt",
				"1000.00"
			);
			const rmtInfStrdDuePyblAmtCcy = document.getElementById(
				"rmtInfStrdDuePyblAmtCcy"
			);
			if (rmtInfStrdDuePyblAmtCcy) {
				rmtInfStrdDuePyblAmtCcy.value = "EUR";
			}
			safeSetFieldValue(
				"includeRmtInfStrdRmtdAmt",
				"rmtInfStrdRmtdAmt",
				"1000.00"
			);
			const rmtInfStrdRmtdAmtCcy = document.getElementById(
				"rmtInfStrdRmtdAmtCcy"
			);
			if (rmtInfStrdRmtdAmtCcy) {
				rmtInfStrdRmtdAmtCcy.value = "EUR";
			}
			safeSetFieldValue(
				"includeRmtInfStrdCdtrRefInf",
				"rmtInfStrdCdtrRefInfTp",
				"SCOR"
			);
			safeSetFieldValue(
				"includeRmtInfStrdCdtrRefInfRef",
				"rmtInfStrdCdtrRefInfRef",
				"RF19HX123456789"
			);
			safeSetFieldValue(
				"includeRmtInfStrdAddtlRmtInf",
				"rmtInfStrdAddtlRmtInf",
				"Płatność za fakturę INVOICE/2024/12345"
			);

			// Transaction Payment Type Information
			safeSetFieldValue("includeTxPmtTpInf", null, true);
			const txPmtTpInfContainer = document.getElementById(
				"txPmtTpInfContainer"
			);
			if (txPmtTpInfContainer) {
				txPmtTpInfContainer.style.display = "block";
			}
			safeSetFieldValue("includeTxInstrPrty", "txInstrPrty", "HIGH");
			safeSetFieldValue("includeTxClrChanl", "txClrChanl", "RTGS");
			safeSetFieldValue("includeTxSvcLvl", "txSvcLvlCd", "SEPA");
			safeSetFieldValue("includeTxLclInstrm", "txLclInstrmCd", "INST");
			safeSetFieldValue("includeTxCtgyPurp", "txCtgyPurpCd", "SUPP");

			// Dodane Related Remittance Information
			safeSetFieldValue("includeRltdRmtInf", "rltdRmtInfRmtId", "RMTID2024001");
			safeSetFieldValue(
				"includeRltdRmtInfElctrncAdr",
				"rltdRmtInfElctrncAdr",
				"http://example.com/remittance"
			);

			// Sprawdzanie tego pola przed próbą ustawienia
			if (
				document.getElementById("includeRmtInfStrdRefInfRltdDt") &&
				document.getElementById("rmtInfStrdRefInfRltdDt")
			) {
				safeSetFieldValue(
					"includeRmtInfStrdRefInfRltdDt",
					"rmtInfStrdRefInfRltdDt",
					getISODateTime(0, "days").split("T")[0]
				);
			}

			// 41. Original Transaction Reference
			safeSetFieldValue("includeOrgnlTxRef", "orgnlTxRef", "REF-2024-05-001");

			// 42. End-to-end ID jeśli nie jest opcjonalne
			if (
				document.getElementById("endToEndId") &&
				!document.getElementById("includeEndToEndId")
			) {
				document.getElementById("endToEndId").value = randomEndToEndId;
			}

			// 19. Party
			safeSetFieldValue("includePrty", "prty", "HIGH");

			// Konta dla agentów
			// Previous Instructing Agent 1 Account
			safeSetFieldValue(
				"includePrvsInstgAgt1Acct",
				"prvsInstgAgt1AcctId",
				"PL12345678901234567890123456"
			);

			// Previous Instructing Agent 2 Account
			safeSetFieldValue(
				"includePrvsInstgAgt2Acct",
				"prvsInstgAgt2AcctId",
				"PL23456789012345678901234567"
			);

			// Previous Instructing Agent 3 Account
			safeSetFieldValue(
				"includePrvsInstgAgt3Acct",
				"prvsInstgAgt3AcctId",
				"PL34567890123456789012345678"
			);

			// Debtor Agent Account
			safeSetFieldValue(
				"includeDbtrAgtAcct",
				"dbtrAgtAcctId",
				"PL98765432109876543210987654"
			);

			// Creditor Agent Account
			safeSetFieldValue(
				"includeCdtrAgtAcct",
				"cdtrAgtAcctId",
				"DE98765432109876543210"
			);

			// 20. Tax Information - teraz zgodne z XSD jako Tax
			safeSetFieldValue("includeTax", "taxCdtrTaxId", "TAX123456789");
			safeSetFieldValue("includeTax", "taxCdtrRegnId", "REG987654321");
			safeSetFieldValue("includeTax", "taxCdtrTaxTp", "VAT");
			safeSetFieldValue("includeTax", "taxRefNb", "TAX/VAT/2023");
			safeSetFieldValue(
				"includeTax",
				"taxDt",
				getISODateTime(-60, "days").split("T")[0]
			);

			// 21. Supplementary Data
			safeSetFieldValue(
				"includeSplmtryData",
				"splmtryData",
				"Additional transaction data for analysis"
			);

			// 31. Tax - Tax Creditor
			safeSetFieldValue("includeTax", "taxCdtrTaxId", "TAX123456789");
			safeSetFieldValue("includeTax", "taxCdtrRegnId", "REG987654321");
			safeSetFieldValue("includeTax", "taxCdtrTaxTp", "VAT");
			safeSetFieldValue("includeTax", "taxRefNb", "TAX/VAT/2023");

			// Tax Debtor
			safeSetFieldValue("includeTaxDbtr", "taxDbtrTaxId", "DBTR-TAX-123456");
			safeSetFieldValue("includeTaxDbtr", "taxDbtrRegnId", "DBTR-REG-654321");
			safeSetFieldValue("includeTaxDbtr", "taxDbtrTaxTp", "VAT");

			// Tax Debtor Authorization
			safeSetFieldValue(
				"includeTaxDbtrAuthstn",
				"taxDbtrAuthstnTitl",
				"Tax Office Representative"
			);
			safeSetFieldValue(
				"includeTaxDbtrAuthstn",
				"taxDbtrAuthstnNm",
				"John Doe"
			);

			// Ultimate Debtor
			safeSetFieldValue(
				"includeTaxUltmtDbtr",
				"taxUltmtDbtrTaxId",
				"ULTMT-TAX-789012"
			);

			// Additional Tax Information
			safeSetFieldValue(
				"includeTaxAdmstnZone",
				"taxAdmstnZone",
				"PL-MAZOWIECKIE"
			);
			safeSetFieldValue("includeTaxMtd", "taxMtd", "QUARTERLY-PAYMENT");

			// Tax Date
			safeSetFieldValue("includeTaxDt", "taxDt", "2024-06-30");

			// Tax Amounts
			safeSetFieldValue(
				"includeTaxTtlTaxblBaseAmt",
				"taxTtlTaxblBaseAmt",
				"1000.00"
			);
			const taxTtlTaxblBaseAmtCcy = document.getElementById(
				"taxTtlTaxblBaseAmtCcy"
			);
			if (taxTtlTaxblBaseAmtCcy) {
				taxTtlTaxblBaseAmtCcy.value = "EUR";
			}

			safeSetFieldValue("includeTaxTtlTaxAmt", "taxTtlTaxAmt", "230.00");
			const taxTtlTaxAmtCcy = document.getElementById("taxTtlTaxAmtCcy");
			if (taxTtlTaxAmtCcy) {
				taxTtlTaxAmtCcy.value = "EUR";
			}

			showNotification("Optional fields filled with example data");
		} catch (error) {
			console.error("Error filling optional fields:", error);
			showNotification("Error filling optional fields: " + error.message);
		}
	}

	// Funkcja weryfikująca istnienie elementów formularza
	function validateFormElements() {
		const fieldPairs = [
			{ checkbox: "includeTxId", input: "txId" },
			{ checkbox: "includeInstrForFinInstnId", input: "instrForFinInstnId" },
			{ checkbox: "includeInstrForDbtrAgtAcct", input: "instrForDbtrAgtAcct" },
			{ checkbox: "includeRgltryCpltc", input: "rgltryCpltc" },
			{ checkbox: "includeClrChanl", input: "clrChanl" },
			{ checkbox: "includeNclsrRsn", input: "nclsrRsn" },
			{ checkbox: "includeCdtrRefInf", input: "cdtrRefInfTp" },
			{ checkbox: "includeSplmtryData", input: "splmtryData" },
			{ checkbox: "includeSplmtryInf", input: "splmtryInf" },
		];

		let missingElements = [];

		fieldPairs.forEach(pair => {
			const checkbox = document.getElementById(pair.checkbox);
			const input = document.getElementById(pair.input);

			if (!checkbox) {
				missingElements.push(`Checkbox: ${pair.checkbox}`);
			}

			if (!input) {
				missingElements.push(`Input: ${pair.input}`);
			}
		});

		if (missingElements.length > 0) {
			console.warn("Brakujące elementy formularza:", missingElements);
			console.table(missingElements);
		}
	}

	// Funkcja wyświetlająca powiadomienie z własnym tekstem
	function showNotification(message) {
		copyNotification.textContent = message;
		copyNotification.style.display = "block";
		setTimeout(function () {
			copyNotification.style.display = "none";
			// Przywrócenie oryginalnego tekstu
			copyNotification.textContent = "Skopiowano do schowka!";
		}, 2500);
	}

	// Funkcja generująca datę i czas w formacie ISO, z możliwością przesunięcia o określoną wartość
	function getISODateTime(amount, unit) {
		const date = new Date();

		// Przesunięcie daty
		if (amount && unit) {
			switch (unit) {
				case "minute":
					date.setMinutes(date.getMinutes() + amount);
					break;
				case "hour":
					date.setHours(date.getHours() + amount);
					break;
				case "day":
					date.setDate(date.getDate() + amount);
					break;
				case "month":
					date.setMonth(date.getMonth() + amount);
					break;
				case "year":
					date.setFullYear(date.getFullYear() + amount);
					break;
			}
		}

		// Formatowanie daty i czasu do formatu akceptowanego przez input datetime-local
		const year = date.getFullYear();
		const month = padZero(date.getMonth() + 1);
		const day = padZero(date.getDate());
		const hours = padZero(date.getHours());
		const minutes = padZero(date.getMinutes());

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	// Funkcja generująca UETR (Unique End-to-End Transaction Reference) w formacie UUID
	function generateUETR() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				const r = (Math.random() * 16) | 0;
				const v = c == "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			}
		);
	}

	// Dodaję obsługę zmiany typu schematu w Organization ID
	const dbtrOrgIdSchemeName = document.getElementById("dbtrOrgIdSchemeName");
	if (dbtrOrgIdSchemeName) {
		dbtrOrgIdSchemeName.addEventListener("change", function () {
			const schemeCodeContainer = document.getElementById(
				"dbtrOrgIdSchemeCodeContainer"
			);
			const schemePrtryContainer = document.getElementById(
				"dbtrOrgIdSchemePrtryContainer"
			);

			if (this.value === "Cd") {
				schemeCodeContainer.style.display = "block";
				schemePrtryContainer.style.display = "none";
			} else if (this.value === "Prtry") {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "block";
			} else {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "none";
			}
		});
	}

	// Obsługa włączania/wyłączania pól Organization ID
	const includeDbtrId = document.getElementById("includeDbtrId");
	if (includeDbtrId) {
		includeDbtrId.addEventListener("change", function () {
			const dbtrOrgIdContainer = document.getElementById("dbtrOrgIdContainer");
			dbtrOrgIdContainer.style.display = this.checked ? "block" : "none";
		});
	}

	// Dodaję obsługę zmiany typu schematu w Organization ID dla Ultimate Debtor
	const ultmtDbtrOrgIdSchemeName = document.getElementById(
		"ultmtDbtrOrgIdSchemeName"
	);
	if (ultmtDbtrOrgIdSchemeName) {
		ultmtDbtrOrgIdSchemeName.addEventListener("change", function () {
			const schemeCodeContainer = document.getElementById(
				"ultmtDbtrOrgIdSchemeCodeContainer"
			);
			const schemePrtryContainer = document.getElementById(
				"ultmtDbtrOrgIdSchemePrtryContainer"
			);

			if (this.value === "Cd") {
				schemeCodeContainer.style.display = "block";
				schemePrtryContainer.style.display = "none";
			} else if (this.value === "Prtry") {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "block";
			} else {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "none";
			}
		});
	}

	// Obsługa włączania/wyłączania pól Organization ID dla Ultimate Debtor
	const includeUltmtDbtrId = document.getElementById("includeUltmtDbtrId");
	if (includeUltmtDbtrId) {
		includeUltmtDbtrId.addEventListener("change", function () {
			const ultmtDbtrOrgIdContainer = document.getElementById(
				"ultmtDbtrOrgIdContainer"
			);
			ultmtDbtrOrgIdContainer.style.display = this.checked ? "block" : "none";
		});
	}

	// Dodaję obsługę zmiany typu schematu w Organization ID dla Ultimate Creditor
	const ultmtCdtrOrgIdSchemeName = document.getElementById(
		"ultmtCdtrOrgIdSchemeName"
	);
	if (ultmtCdtrOrgIdSchemeName) {
		ultmtCdtrOrgIdSchemeName.addEventListener("change", function () {
			const schemeCodeContainer = document.getElementById(
				"ultmtCdtrOrgIdSchemeCodeContainer"
			);
			const schemePrtryContainer = document.getElementById(
				"ultmtCdtrOrgIdSchemePrtryContainer"
			);

			if (this.value === "Cd") {
				schemeCodeContainer.style.display = "block";
				schemePrtryContainer.style.display = "none";
			} else if (this.value === "Prtry") {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "block";
			} else {
				schemeCodeContainer.style.display = "none";
				schemePrtryContainer.style.display = "none";
			}
		});
	}

	// Obsługa włączania/wyłączania pól Organization ID dla Ultimate Creditor
	const includeUltmtCdtrId = document.getElementById("includeUltmtCdtrId");
	if (includeUltmtCdtrId) {
		includeUltmtCdtrId.addEventListener("change", function () {
			const ultmtCdtrOrgIdContainer = document.getElementById(
				"ultmtCdtrOrgIdContainer"
			);
			ultmtCdtrOrgIdContainer.style.display = this.checked ? "block" : "none";
		});
	}

	// Obsługa włączania/wyłączania pól Other w Instructing Agent
	const includeInstgAgtOtherId = document.getElementById(
		"includeInstgAgtOtherId"
	);
	if (includeInstgAgtOtherId) {
		includeInstgAgtOtherId.addEventListener("change", function () {
			const instgAgtOthrSchmeNmContainer = document.getElementById(
				"instgAgtOthrSchmeNmContainer"
			);
			instgAgtOthrSchmeNmContainer.style.display = this.checked
				? "block"
				: "none";
		});
	}

	// Obsługa włączania/wyłączania pól Other w Instructed Agent
	const includeInstdAgtOtherId = document.getElementById(
		"includeInstdAgtOtherId"
	);
	if (includeInstdAgtOtherId) {
		includeInstdAgtOtherId.addEventListener("change", function () {
			const instdAgtOthrSchmeNmContainer = document.getElementById(
				"instdAgtOthrSchmeNmContainer"
			);
			instdAgtOthrSchmeNmContainer.style.display = this.checked
				? "block"
				: "none";
		});
	}

	// Obsługa włączania/wyłączania pola Proxy Value dla Debtor Account
	const includeDbtrAcctProxyTp = document.getElementById(
		"includeDbtrAcctProxyTp"
	);
	if (includeDbtrAcctProxyTp) {
		includeDbtrAcctProxyTp.addEventListener("change", function () {
			const dbtrAcctProxyVal = document.getElementById("dbtrAcctProxyVal");
			dbtrAcctProxyVal.disabled = !this.checked;
		});
	}

	// Obsługa włączania/wyłączania pola Proxy Value dla Creditor Account
	const includeCdtrAcctProxyTp = document.getElementById(
		"includeCdtrAcctProxyTp"
	);
	if (includeCdtrAcctProxyTp) {
		includeCdtrAcctProxyTp.addEventListener("change", function () {
			const cdtrAcctProxyVal = document.getElementById("cdtrAcctProxyVal");
			cdtrAcctProxyVal.disabled = !this.checked;
		});
	}

	// Obsługa przełączania typu Purpose (Cd/Prtry)
	const purpTypeSelect = document.getElementById("purpType");
	if (purpTypeSelect) {
		purpTypeSelect.addEventListener("change", function () {
			const purpCdContainer = document.getElementById("purpCdContainer");
			const purpPrtryContainer = document.getElementById("purpPrtryContainer");

			if (this.value === "Cd") {
				purpCdContainer.style.display = "block";
				purpPrtryContainer.style.display = "none";

				// Włączenie pola purpCd i wyłączenie purpPrtry
				const purpCd = document.getElementById("purpCd");
				const purpPrtry = document.getElementById("purpPrtry");
				if (purpCd && !purpCd.disabled) purpCd.disabled = false;
				if (purpPrtry) purpPrtry.disabled = true;
			} else if (this.value === "Prtry") {
				purpCdContainer.style.display = "none";
				purpPrtryContainer.style.display = "block";

				// Włączenie pola purpPrtry i wyłączenie purpCd
				const purpCd = document.getElementById("purpCd");
				const purpPrtry = document.getElementById("purpPrtry");
				if (purpPrtry && !purpPrtry.disabled) purpPrtry.disabled = false;
				if (purpCd) purpCd.disabled = true;
			}
		});
	}

	// Obsługa checkboxa includePurp
	const includePurp = document.getElementById("includePurp");
	if (includePurp) {
		includePurp.addEventListener("change", function () {
			const purpTypeSelect = document.getElementById("purpType");
			const purpCd = document.getElementById("purpCd");
			const purpPrtry = document.getElementById("purpPrtry");

			if (purpTypeSelect) {
				purpTypeSelect.disabled = !this.checked;

				// Aktualizuj stan zgodnie z aktualnym wyborem typu
				if (this.checked) {
					const event = new Event("change");
					purpTypeSelect.dispatchEvent(event);
				} else {
					// Wyłącz oba pola przy odznacznaniu checkboxa
					if (purpCd) purpCd.disabled = true;
					if (purpPrtry) purpPrtry.disabled = true;
				}
			}
		});
	}
});
