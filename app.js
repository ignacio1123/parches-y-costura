const storageKey = "parchesOrders";

const currency = new Intl.NumberFormat("es-CL", {
	style: "currency",
	currency: "CLP",
	minimumFractionDigits: 0,
});

// Configurar PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
	pdfjsLib.GlobalWorkerOptions.workerSrc =
		"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// Variables globales que se inicializarán cuando el DOM esté listo
let modal, confirmModal, confirmMessageEl, confirmDeleteBtn, confirmCancelBtn, confirmCloseBtn, undoToastEl, undoMessageEl, undoBtn, orderForm, ordersBody, paginationEl, totalPedidosEl, valorTotalEl, valorPendienteEl, valorEntregadoEl, totalPreview, importInput, pdfInput, fields;
let currentPage = 1;
const pageSize = 10;
let currentFilteredOrders = null;
let pendingDeleteId = null;
let lastDeletedOrder = null;
let undoTimer = null;

// Variables para el modal de reportes
let reportModal;
let selectedReportRecords = new Set();
let reportFilteredOrders = [];
 
const autoResize = (textarea) => {
	if (!textarea) return;
	try {
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	} catch (e) {
		console.error("Error en autoResize:", e);
	}
};

const autoResizeAll = () => {
	if (!fields) return;
	autoResize(fields.enviarA);
	autoResize(fields.facturarA);
	autoResize(fields.productos);
	autoResize(fields.distribuidor);
	autoResize(fields.notas);
};

const defaultOrders = [
	{
		id: crypto.randomUUID(),
		fecha: "2025-12-05",
		cliente: "Juan Garcia",
		tipoCliente: "individual",
		rango: "Capitán",
		region: "Santiago",
		enviarA: "",
		facturarA: "",
		productos: "Parche Rojo Grande",
		cantidad: 10,
		unitario: 5000,
		descuento: 0,
		subtotal: 50000,
		impuestos: 0,
		envio: 0,
		estado: "Confirmado",
		condicionPago: "Ninguna",
		moneda: "CLP",
		llegadaEstimada: "",
		distribuidor: "",
		notas: "Entrega urgente",
	},
	{
		id: crypto.randomUUID(),
		fecha: "2025-12-04",
		cliente: "Maria Lopez",
		tipoCliente: "tienda",
		rango: "N/A",
		region: "Puente Alto",
		enviarA: "",
		facturarA: "",
		productos: "Parche Azul Mediano",
		cantidad: 5,
		unitario: 3500,
		descuento: 0,
		subtotal: 17500,
		impuestos: 0,
		envio: 0,
		estado: "Pendiente",
		condicionPago: "Ninguna",
		moneda: "CLP",
		llegadaEstimada: "",
		distribuidor: "",
		notas: "",
	},
];

const getOrders = () => {
	const raw = localStorage.getItem(storageKey);
	if (!raw) {
		localStorage.setItem(storageKey, JSON.stringify(defaultOrders));
		return [...defaultOrders];
	}
	try {
		return JSON.parse(raw) || [];
	} catch {
		return [];
	}
};

const saveOrders = (orders) => {
	localStorage.setItem(storageKey, JSON.stringify(orders));
};

const seedTestOrders = (count = 12) => {
	const base = getOrders();
	const estados = ["Pendiente", "En curso", "Entregado"];
	const regiones = ["Santiago", "Puente Alto", "Maipu", "La Florida", "Providencia"];
	const rangos = ["Carabinero", "Cabo Primero", "Sargento Segundo", "Suboficial", "Teniente"];
	const productos = [
		"Parche Grado Verde",
		"Parche Nombre Blanco",
		"Parche Bandera",
		"Parche Institucional",
		"Parche Especial",
	];

	const now = new Date();
	const newOrders = Array.from({ length: count }, (_, i) => {
		const tipoCliente = i % 2 === 0 ? "tienda" : "individual";
		const fecha = new Date(now);
		fecha.setDate(now.getDate() - i);
		const llegada = new Date(now);
		llegada.setDate(now.getDate() + 7 + i);

		return {
			id: crypto.randomUUID(),
			fecha: fecha.toISOString().slice(0, 10),
			cliente: `Cliente Prueba ${base.length + i + 1}`,
			tipoCliente,
			rango: tipoCliente === "tienda" ? "N/A" : rangos[i % rangos.length],
			region: regiones[i % regiones.length],
			enviarA: "Direccion de prueba\nComuna de prueba",
			facturarA: tipoCliente === "tienda" ? "Facturacion prueba\nRUT 12.345.678-9" : "",
			productos: productos[i % productos.length],
			cantidad: (i % 5) + 1,
			unitario: 3500 + i * 250,
			descuento: i % 3 === 0 ? 5 : 0,
			subtotal: 0,
			impuestos: 0,
			envio: 0,
			estado: estados[i % estados.length],
			condicionPago: "Ninguna",
			moneda: "CLP",
			llegadaEstimada: llegada.toISOString().slice(0, 10),
			distribuidor: tipoCliente === "tienda" ? "Verde Legion" : "",
			notas: "Pedido de prueba",
		};
	});

	saveOrders([...base, ...newOrders]);
	currentFilteredOrders = null;
	currentPage = 1;
	const searchInput = document.getElementById("searchInput");
	if (searchInput) searchInput.value = "";
	renderOrders();
};

const calcSubtotal = (order) => {
	const qty = Number(order.cantidad) || 0;
	const price = Number(order.unitario) || 0;
	const discount = Number(order.descuento) || 0;
	const subtotal = qty * price;
	const discounted = subtotal - subtotal * (discount / 100);
	const manual = Number(order.subtotal) || 0;
	return manual > 0 ? manual : Math.max(discounted, 0);
};

const toTotal = (order) => {
	const subtotal = calcSubtotal(order);
	const impuestos = Number(order.impuestos) || 0;
	const envio = Number(order.envio) || 0;
	return Math.max(subtotal + impuestos + envio, 0);
};

const formatDate = (value) => {
	if (!value) return "";
	const trimmed = String(value).trim();

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const [year, month, day] = trimmed.split("-");
		return `${day}-${month}-${year}`;
	}

	if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
		return trimmed;
	}

	if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
		const [year, month, day] = trimmed.split("/");
		return `${day}-${month}-${year}`;
	}

	if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
		const [day, month, year] = trimmed.split("/");
		return `${day}-${month}-${year}`;
	}

	return trimmed;
};

const badgeClass = (estado) => {
	const key = estado.toLowerCase();
	if (key === "en curso") return "en-curso";
	return key;
};

const renderTotals = (orders) => {
	const total = orders.reduce((sum, order) => sum + toTotal(order), 0);
	const pendienteCount = orders.filter((order) => ["pendiente", "en curso"].includes(order.estado.toLowerCase())).length;
	const entregadoCount = orders.filter((order) => order.estado.toLowerCase() === "entregado").length;

	totalPedidosEl.textContent = orders.length;
	valorTotalEl.textContent = currency.format(total);
	valorPendienteEl.textContent = pendienteCount.toString();
	valorEntregadoEl.textContent = entregadoCount.toString();
};

const renderOrders = (filteredOrders = null) => {
	if (filteredOrders) {
		currentFilteredOrders = filteredOrders;
		currentPage = 1;
	}

	const orders = currentFilteredOrders || getOrders();
	ordersBody.innerHTML = "";

	const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
	if (currentPage > totalPages) {
		currentPage = totalPages;
	}

	const startIndex = (currentPage - 1) * pageSize;
	const pageOrders = orders.slice(startIndex, startIndex + pageSize);

	pageOrders.forEach((order, index) => {
		const orderNumber = startIndex + index + 1;
		// Determinar qué mostrar en la columna Rango
		const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
		const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
		
		// Formatear enviarA para mostrar solo la primera línea si es muy largo
		const enviarADisplay = order.enviarA ? order.enviarA.split("\n")[0] : "";
		
		const row = document.createElement("tr");
		row.innerHTML = `
			<td class="num-col">${orderNumber}</td>
			<td>${formatDate(order.fecha)}</td>
			<td>${order.cliente}</td>
			<td>${rangoDisplay}</td>
			<td>${order.region}</td>
			<td>${enviarADisplay}</td>
			<td>${order.cantidad}</td>
			<td>${currency.format(order.unitario)}</td>
			<td>${order.descuento || 0}%</td>
			<td><strong>${currency.format(toTotal(order))}</strong></td>
			<td><span class="badge ${badgeClass(order.estado)}">${order.estado}</span></td>
			<td class="actions-cell">
				<div class="actions">
					<button class="btn btn-secondary btn-sm" data-edit="${order.id}">Editar</button>
					<button class="btn btn-ghost btn-sm" data-delete="${order.id}">Eliminar</button>
				</div>
			</td>
		`;
		ordersBody.appendChild(row);
	});

	renderTotals(orders);
	updatePagination(totalPages, orders.length);
};

const updatePagination = (totalPages, totalItems) => {
	if (!paginationEl) return;
	paginationEl.innerHTML = "";

	if (totalItems <= pageSize) {
		paginationEl.classList.remove("visible");
		return;
	}

	paginationEl.classList.add("visible");

	const createButton = (label, page, { disabled = false, active = false } = {}) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "page-btn";
		button.textContent = label;
		if (active) button.classList.add("active");
		if (disabled) button.disabled = true;
		button.addEventListener("click", () => {
			currentPage = page;
			renderOrders(currentFilteredOrders);
		});
		return button;
	};

	paginationEl.appendChild(
		createButton("Anterior", Math.max(1, currentPage - 1), { disabled: currentPage === 1 })
	);

	const pages = [];
	if (totalPages <= 5) {
		for (let i = 1; i <= totalPages; i += 1) {
			pages.push(i);
		}
	} else {
		pages.push(1);
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		if (start > 2) pages.push("...");
		for (let i = start; i <= end; i += 1) {
			pages.push(i);
		}
		if (end < totalPages - 1) pages.push("...");
		pages.push(totalPages);
	}

	pages.forEach((page) => {
		if (page === "...") {
			const ellipsis = document.createElement("span");
			ellipsis.className = "page-ellipsis";
			ellipsis.textContent = "...";
			paginationEl.appendChild(ellipsis);
			return;
		}
		paginationEl.appendChild(createButton(page.toString(), page, { active: page === currentPage }));
	});

	paginationEl.appendChild(
		createButton("Siguiente", Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages })
	);

	const pageInfo = document.createElement("span");
	pageInfo.className = "page-info";
	pageInfo.textContent = `Pagina ${currentPage} de ${totalPages}`;
	paginationEl.appendChild(pageInfo);
};

const openModal = (title) => {
	document.getElementById("modalTitle").textContent = title;
	modal.classList.add("active");
	modal.setAttribute("aria-hidden", "false");
	document.body.classList.add("modal-open");
};

const closeModal = () => {
	modal.classList.remove("active");
	modal.setAttribute("aria-hidden", "true");
	document.body.classList.remove("modal-open");
	orderForm.reset();
	fields.id.value = "";
	fields.cantidad.value = 1;
	fields.cantidad.value = 1;
	fields.unitario.value = 0;
	fields.descuento.value = 0;
	fields.subtotal.value = 0;
	fields.impuestos.value = 0;
	fields.envio.value = 0;
	fields.enviarA.value = "";
	fields.facturarA.value = "";
	fields.productos.value = "";
	fields.condicionPago.value = "Ninguna";
	fields.moneda.value = "CLP";
	fields.llegadaEstimada.value = "";
	fields.distribuidor.value = "";
	updatePreview();
};

const openConfirmDelete = (order) => {
	pendingDeleteId = order ? order.id : null;
	const orderLabel = order
		? `${order.cliente} (${formatDate(order.fecha)})`
		: "este pedido";
	confirmMessageEl.textContent = `¿Seguro que deseas eliminar ${orderLabel}? Esta accion no se puede deshacer.`;
	confirmModal.classList.add("active");
	confirmModal.setAttribute("aria-hidden", "false");
	document.body.classList.add("modal-open");
};

const closeConfirmDelete = () => {
	confirmModal.classList.remove("active");
	confirmModal.setAttribute("aria-hidden", "true");
	document.body.classList.remove("modal-open");
	pendingDeleteId = null;
};

const showUndoToast = (order) => {
	lastDeletedOrder = order;
	undoMessageEl.textContent = `Pedido eliminado: ${order.cliente}.`;
	undoToastEl.classList.add("visible");
	if (undoTimer) clearTimeout(undoTimer);
	undoTimer = setTimeout(() => {
		undoToastEl.classList.remove("visible");
		lastDeletedOrder = null;
	}, 5000);
};

const handleUndoDelete = () => {
	if (!lastDeletedOrder) return;
	const orders = getOrders();
	orders.push(lastDeletedOrder);
	saveOrders(orders);
	renderOrders();
	undoToastEl.classList.remove("visible");
	lastDeletedOrder = null;
	if (undoTimer) clearTimeout(undoTimer);
};

const updatePreview = () => {
	const qty = Number(fields.cantidad.value) || 0;
	const price = Number(fields.unitario.value) || 0;
	const discount = Number(fields.descuento.value) || 0;
	const rawSubtotal = qty * price;
	const subtotal = Math.max(rawSubtotal - rawSubtotal * (discount / 100), 0);
	fields.subtotal.value = Math.round(subtotal);
	const order = {
		cantidad: qty,
		unitario: price,
		descuento: discount,
		subtotal: fields.subtotal.value,
		impuestos: fields.impuestos.value,
		envio: fields.envio.value,
	};
	totalPreview.textContent = currency.format(toTotal(order));
};

const fillForm = (order) => {
	// Resetear el formulario primero para limpiar cualquier estado previo
	orderForm.reset();
	
	fields.id.value = order.id;
	fields.fecha.value = order.fecha;
	fields.cliente.value = order.cliente;
	
	// Detectar tipo de cliente basado en rango
	const tipoCliente = order.tipoCliente || (order.rango === "N/A" || !order.rango ? "tienda" : "individual");
	fields.tipoCliente.value = tipoCliente;
	
	// Actualizar visibilidad del rango
	const rangoLabel = document.getElementById("rangoLabel");
	if (tipoCliente === "individual") {
		rangoLabel.style.display = "";
		fields.rango.setAttribute("required", "required");
		fields.rango.value = order.rango;
	} else {
		rangoLabel.style.display = "none";
		fields.rango.removeAttribute("required");
		fields.rango.value = order.rango || "N/A";
	}
	
	fields.region.value = order.region;
	fields.enviarA.value = order.enviarA || "";
	fields.facturarA.value = order.facturarA || "";
	fields.productos.value = order.productos || "";
	fields.cantidad.value = order.cantidad;
	fields.unitario.value = order.unitario;
	fields.descuento.value = order.descuento;
	fields.subtotal.value = order.subtotal || 0;
	fields.impuestos.value = order.impuestos || 0;
	fields.envio.value = order.envio || 0;
	fields.estado.value = order.estado;
	fields.condicionPago.value = order.condicionPago || "";
	fields.moneda.value = order.moneda || "";
	fields.llegadaEstimada.value = order.llegadaEstimada || "";
	fields.distribuidor.value = order.distribuidor || "";
	fields.notas.value = order.notas || "";
	
	// Ajustar altura de textareas después de un pequeño delay
	setTimeout(() => {
		autoResizeAll();
		updatePreview();
	}, 50);
};

const collectForm = () => ({
	id: fields.id.value || crypto.randomUUID(),
	fecha: fields.fecha.value,
	cliente: fields.cliente.value.trim(),
	tipoCliente: fields.tipoCliente.value,
	rango: fields.rango.value.trim(),
	region: fields.region.value.trim(),
	enviarA: fields.enviarA.value.trim(),
	facturarA: fields.facturarA.value.trim(),
	productos: fields.productos.value.trim(),
	cantidad: Number(fields.cantidad.value),
	unitario: Number(fields.unitario.value),
	descuento: Number(fields.descuento.value) || 0,
	subtotal: Number(fields.subtotal.value) || 0,
	impuestos: Number(fields.impuestos.value) || 0,
	envio: Number(fields.envio.value) || 0,
	estado: fields.estado.value,
	condicionPago: fields.condicionPago.value.trim(),
	moneda: fields.moneda.value.trim(),
	llegadaEstimada: fields.llegadaEstimada.value,
	distribuidor: fields.distribuidor.value.trim(),
	notas: fields.notas.value.trim(),
});

const exportJson = () => {
	try {
		const data = JSON.stringify(getOrders(), null, 2);
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "respaldo-parche.json";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		alert("Error al descargar respaldo: " + error.message);
	}
};

const importJson = (file) => {
	const reader = new FileReader();
	reader.onload = (event) => {
		try {
			const content = event.target.result;
			const parsed = JSON.parse(content);
			if (!Array.isArray(parsed)) {
				alert("El archivo no tiene formato valido. Debe ser una lista de pedidos.");
				return;
			}
			if (parsed.length === 0) {
				alert("El archivo está vacío. No hay pedidos para cargar.");
				return;
			}
			const ordersCount = parsed.length;
			saveOrders(parsed);
			renderOrders();
			alert(`✓ Respaldo cargado exitosamente.\n${ordersCount} pedido(s) importado(s).`);
		} catch (error) {
			alert("Error al leer el archivo: " + error.message + "\nAsegúrate de que sea un respaldo válido.");
		}
	};
	reader.onerror = () => {
		alert("No se pudo leer el archivo. Intenta nuevamente.");
	};
	reader.readAsText(file);
};

const todayIso = () => {
	const today = new Date();
	return today.toISOString().slice(0, 10);
};

const monthMap = {
	enero: "01",
	febrero: "02",
	marzo: "03",
	abril: "04",
	mayo: "05",
	junio: "06",
	julio: "07",
	agosto: "08",
	septiembre: "09",
	setiembre: "09",
	octubre: "10",
	noviembre: "11",
	diciembre: "12",
};

const parseSpanishDate = (text) => {
	const match = text.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/i);
	if (!match) return "";
	const day = match[1].padStart(2, "0");
	const monthName = match[2].toLowerCase();
	const month = monthMap[monthName];
	if (!month) return "";
	return `${match[3]}-${month}-${day}`;
};

const cleanNumber = (value) => Number(String(value).replace(/\./g, ""));

const extractBetween = (text, start, endOptions, preserveLines = false) => {
	const lower = text.toLowerCase();
	const startIndex = lower.indexOf(start.toLowerCase());
	if (startIndex < 0) return "";
	const afterStart = text.slice(startIndex + start.length);
	const lowerAfter = afterStart.toLowerCase();
	let endIndex = -1;
	endOptions.forEach((end) => {
		const idx = lowerAfter.indexOf(end.toLowerCase());
		if (idx >= 0 && (endIndex < 0 || idx < endIndex)) {
			endIndex = idx;
		}
	});
	const slice = endIndex >= 0 ? afterStart.slice(0, endIndex) : afterStart;
	
	if (preserveLines) {
		// Preservar saltos de línea, pero limpiar espacios múltiples en cada línea
		return slice
			.split(/\n/)
			.map(line => line.trim())
			.filter(line => line.length > 0)
			.join("\n");
	}
	
	return slice.replace(/\s+/g, " ").trim();
};

const cleanFragmentedText = (text) => {
	// Corregir palabras comunes que el PDF fragmenta con espacios
	return text
		.replace(/Subo?\s*fi\s*cial/gi, "Suboficial")
		.replace(/N\s*u\s*ñ\s*o\s*a/gi, "Ñuñoa")
		.replace(/(\w)\s+(\w)(?=\s+[A-Z])/g, "$1$2") // Eliminar espacios entre letras si hay mayúscula después
		.trim();
};

const parsePdfText = (text) => {
	// Encontrar la línea que contiene los tres encabezados
	const headerMatch = text.match(/DISTRIBUIDOR\s+ENVIAR A\s+FACTURAR A/i);
	let distribuidor = "";
	let enviarA = "";
	let facturarA = "";
	let cliente = "";
	let fecha = "";
	
	if (headerMatch) {
		// Obtener todo el texto después de los encabezados
		const afterHeader = text.substring(headerMatch.index + headerMatch[0].length).trim();
		const lines = afterHeader.split("\n")
			.map(line => line.trim())
			.filter(line => line.length > 0 && 
				!line.match(/^(CONDICIONES|MONEDA|LLEGADA|PRODUCTOS|SKU)/i));
		
		// El PDF tiene la estructura:
		// 3 líneas para Distribuidor
		// 3 líneas para Enviar A
		// 4 líneas para Facturar A (nombre + dirección + ciudad + país)
		
		if (lines.length >= 10) {
			// Distribuidor: líneas 0-2
			distribuidor = cleanFragmentedText(lines.slice(0, 3).join("\n"));
			
			// Enviar A: líneas 3-5
			enviarA = cleanFragmentedText(lines.slice(3, 6).join("\n"));
			
			// Facturar A: líneas 6-9
			facturarA = cleanFragmentedText(lines.slice(6, 10).join("\n"));
			
			// Cliente es la primera línea de Facturar A
			cliente = cleanFragmentedText(lines[6]);
		}
	}
	
	// Extraer fecha del encabezado del PDF
	const fechaMatch = text.match(/(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i);
	if (fechaMatch) {
		fecha = parseSpanishDate(fechaMatch[1]);
	}
	

	const referenciaMatch = text.match(/NUMERO DE REFERENCIA\s+([A-Z0-9]+)/i);
	const referencia = referenciaMatch ? referenciaMatch[1] : "";

	const items = [];
	const nameMatches = text.match(/Parche[^\d]{0,120}/gi) || [];
	nameMatches.forEach((item) => {
		const clean = item.replace(/\s+/g, " ").trim();
		if (!items.includes(clean)) {
			items.push(clean);
		}
	});

	let cantidadTotal = 0;
	let totalAcumulado = 0;
	const rowRegex = /(\d+)\s+(\d{1,3}(?:\.\d{3})+)\s*\$?\s*0%\s*(\d{1,3}(?:\.\d{3})+)/g;
	let match;
	while ((match = rowRegex.exec(text)) !== null) {
		const qty = Number(match[1]);
		const lineTotal = cleanNumber(match[3]);
		cantidadTotal += qty;
		totalAcumulado += lineTotal;
	}

	if (!totalAcumulado) {
		const totalMatch = text.match(/Total\s+([\d.]+)\s*\$/i);
		if (totalMatch) {
			totalAcumulado = cleanNumber(totalMatch[1]);
		}
	}

	let unitario = cantidadTotal
		? Math.round(totalAcumulado / cantidadTotal)
		: 0;

	const productos = items.length ? items.join("\n") : "";

	const impuestosMatch = text.match(/Impuestos\s*\(incluidos\)\s*([\d.]+)\s*\$/i);
	const impuestos = impuestosMatch ? cleanNumber(impuestosMatch[1]) : 0;
	const envioMatch = text.match(/Envio\s*([\d.]+)\s*\$/i);
	const envio = envioMatch ? cleanNumber(envioMatch[1]) : 0;
	const subtotalMatch = text.match(/Subtotal[^\d]*([\d.]+)\s*\$/i);
	const subtotal = subtotalMatch ? cleanNumber(subtotalMatch[1]) : 0;
	if (subtotal > 0 && cantidadTotal > 0) {
		unitario = Math.round(subtotal / cantidadTotal);
	}

	const condicionRaw = extractBetween(text, "CONDICIONES DE PAGO", [
		"MONEDA DEL DISTRIBUIDOR",
		"LLEGADA ESTIMADA",
		"RESUMEN",
		"PRODUCTOS",
	]);
	const condicionPago = condicionRaw.trim();

	const monedaRaw = extractBetween(text, "MONEDA DEL DISTRIBUIDOR", [
		"LLEGADA ESTIMADA",
		"CONDICIONES DE PAGO",
		"RESUMEN",
		"PRODUCTOS",
	]);
	const moneda = monedaRaw.split(" ")[0].trim();

	const llegadaRaw = extractBetween(text, "LLEGADA ESTIMADA", [
		"CONDICIONES DE PAGO",
		"MONEDA DEL DISTRIBUIDOR",
		"RESUMEN",
		"PRODUCTOS",
	]);
	const llegadaEstimada = parseSpanishDate(llegadaRaw);

	const notas = [
		referencia ? `Referencia: ${referencia}` : "",
		items.length ? `Items: ${items.join(" | ")}` : "",
	]
		.filter(Boolean)
		.join("\n");

	// Detectar tipo de cliente según si tiene campo Rango
	const rangoMatch = text.match(/Rango[:\s]*(\S.+?)(?=\n|Región|Comuna|$)/i);
	let detectedTipoCliente = "tienda";
	let detectedRango = "N/A";
	
	if (rangoMatch) {
		const rangoValue = rangoMatch[1].trim();
		// Si tiene rango y no es N/A o vacío, es individual
		if (rangoValue && rangoValue.toLowerCase() !== "n/a" && rangoValue !== "_____") {
			detectedTipoCliente = "individual";
			detectedRango = rangoValue;
		}
	}

	return {
		cliente,
		fecha,
		tipoCliente: detectedTipoCliente,
		rango: detectedRango,
		enviarA,
		facturarA,
		productos,
		cantidad: cantidadTotal || 1,
		unitario,
		subtotal,
		impuestos,
		envio,
		moneda,
		condicionPago,
		llegadaEstimada,
		distribuidor,
		notas,
	};
};

const extractPdfText = async (file) => {
	if (typeof pdfjsLib === 'undefined') {
		throw new Error("PDF.js no está cargado. Por favor recarga la página.");
	}
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
	let text = "";
	
	for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
		const page = await pdf.getPage(pageIndex);
		const content = await page.getTextContent();
		
		// Agrupar items por línea basándose en su posición Y
		const lines = [];
		let currentLine = [];
		let lastY = null;
		
		content.items.forEach((item) => {
			const y = item.transform[5];
			
			// Si cambia la posición Y significativamente, es una nueva línea
			if (lastY !== null && Math.abs(y - lastY) > 5) {
				if (currentLine.length > 0) {
					lines.push(currentLine.join(" "));
					currentLine = [];
				}
			}
			
			currentLine.push(item.str);
			lastY = y;
		});
		
		// Agregar la última línea
		if (currentLine.length > 0) {
			lines.push(currentLine.join(" "));
		}
		
		text += lines.join("\n") + "\n";
	}
	
	return text.trim();
};

// Función de búsqueda y filtrado
const filterOrders = (searchTerm) => {
	if (!searchTerm || searchTerm.trim() === "") {
		currentFilteredOrders = null;
		currentPage = 1;
		renderOrders();
		return;
	}
	
	const term = searchTerm.toLowerCase();
	const allOrders = getOrders();
	
	const filtered = allOrders.filter(order => {
		const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
		const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
		
		return (
			order.cliente.toLowerCase().includes(term) ||
			formatDate(order.fecha).toLowerCase().includes(term) ||
			order.region.toLowerCase().includes(term) ||
			order.estado.toLowerCase().includes(term) ||
			rangoDisplay.toLowerCase().includes(term) ||
			(order.enviarA && order.enviarA.toLowerCase().includes(term))
		);
	});
	
	renderOrders(filtered);
};

// Función para exportar PDF
// Función de exportación PDF ahora en la nueva función exportPdf (con soporte para selección y columnas)

const descargarFormato = () => {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	const formato = document.getElementById("formatoPdf").value;
	
	// Configuración
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;
	let yPos = margin;
	
	// Encabezado
	doc.setFontSize(18);
	doc.setFont("helvetica", "bold");
	doc.text("Parches y Costuras", margin, yPos);
	yPos += 7;
	
	doc.setFontSize(12);
	doc.setFont("helvetica", "normal");
	const tipoFormato = formato === 'tienda' ? 'FORMATO TIENDA' : 'FORMATO INDIVIDUAL';
	doc.text(tipoFormato, margin, yPos);
	yPos += 5;
	
	doc.setFontSize(9);
	doc.setTextColor(100, 100, 100);
	doc.text("Complete este formulario y envíelo para registrar el pedido", margin, yPos);
	yPos += 10;
	
	// Resetear color
	doc.setTextColor(0, 0, 0);
	doc.setFontSize(10);
	
	// Campos del formulario
	const lineHeight = 8;
	const labelWidth = 40;
	
	// Función helper para dibujar campo
	const drawField = (label, lines = 1) => {
		if (yPos > pageHeight - 30) {
			doc.addPage();
			yPos = margin;
		}
		
		doc.setFont("helvetica", "bold");
		doc.text(label, margin, yPos);
		doc.setFont("helvetica", "normal");
		
		const fieldWidth = pageWidth - 2 * margin - labelWidth;
		for (let i = 0; i < lines; i++) {
			doc.setDrawColor(200, 200, 200);
			doc.line(margin + labelWidth, yPos - 2 + (i * lineHeight), margin + labelWidth + fieldWidth, yPos - 2 + (i * lineHeight));
		}
		
		yPos += lineHeight * lines + 2;
	};
	
	// Información básica
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text("Información del Pedido", margin, yPos);
	yPos += 7;
	doc.setFontSize(10);
	
	drawField("Fecha:");
	drawField("Cliente:");
	
	if (formato === 'individual') {
		drawField("Rango:");
	}
	
	drawField("Región/Comuna:");
	yPos += 3;
	
	// Dirección
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text("Dirección de Envío", margin, yPos);
	yPos += 7;
	doc.setFontSize(10);
	
	drawField("Enviar a:", 2);
	
	if (formato === 'tienda') {
		drawField("Facturar a:", 2);
		drawField("Distribuidor:", 2);
	}
	
	yPos += 3;
	
	// Productos
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text("Productos", margin, yPos);
	yPos += 7;
	doc.setFontSize(10);
	
	drawField("Productos:", 3);
	drawField("Cantidad:");
	yPos += 3;
	
	// Información financiera
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text("Información Financiera", margin, yPos);
	yPos += 7;
	doc.setFontSize(10);
	
	drawField("Precio Unitario:");
	drawField("Descuento (%):");
	drawField("Impuestos:");
	drawField("Envío:");
	yPos += 3;
	
	// Información adicional
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text("Información Adicional", margin, yPos);
	yPos += 7;
	doc.setFontSize(10);
	
	drawField("Llegada Estimada:");
	drawField("Estado:");
	drawField("Notas:", 2);
	
	// Pie de página
	doc.setFontSize(8);
	doc.setTextColor(150, 150, 150);
	const today = new Date().toLocaleDateString('es-CL', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
	doc.text(
		`Formato generado el ${today}`,
		pageWidth / 2,
		pageHeight - 10,
		{ align: 'center' }
	);
	
	// Guardar
	const nombreArchivo = `Formato-${formato === 'tienda' ? 'Tienda' : 'Individual'}-${new Date().toISOString().slice(0, 10)}.pdf`;
	doc.save(nombreArchivo);
};

// Funciones para el modal de reportes
const renderReportRecordsList = () => {
	const recordsList = document.getElementById("reportRecordsList");
	recordsList.innerHTML = "";

	reportFilteredOrders.forEach((order) => {
		const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
		const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
		
		const isChecked = selectedReportRecords.has(order.id);
		
		const itemDiv = document.createElement("div");
		itemDiv.className = "report-record-item";
		itemDiv.innerHTML = `
			<input type="checkbox" class="record-checkbox" data-order-id="${order.id}" ${isChecked ? "checked" : ""}>
			<label>
				<strong>${order.cliente}</strong>
				<div class="report-record-info">
					<span>Fecha: <strong>${formatDate(order.fecha)}</strong></span>
					<span>Región: <strong>${order.region}</strong></span>
					<span>Total: <strong>${currency.format(toTotal(order))}</strong></span>
				</div>
			</label>
		`;
		
		const checkbox = itemDiv.querySelector(".record-checkbox");
		checkbox.addEventListener("change", (e) => {
			if (e.target.checked) {
				selectedReportRecords.add(order.id);
			} else {
				selectedReportRecords.delete(order.id);
			}
			updateReportMarkAllCheckbox();
		});
		
		recordsList.appendChild(itemDiv);
	});

	document.getElementById("recordsCount").textContent = reportFilteredOrders.length;
};

const filterReportRecords = (searchTerm) => {
	if (!searchTerm || searchTerm.trim() === "") {
		reportFilteredOrders = getOrders();
	} else {
		const term = searchTerm.toLowerCase();
		const allOrders = getOrders();
		
		reportFilteredOrders = allOrders.filter(order => {
			const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
			const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
			
			return (
				order.cliente.toLowerCase().includes(term) ||
				formatDate(order.fecha).toLowerCase().includes(term) ||
				order.region.toLowerCase().includes(term) ||
				order.estado.toLowerCase().includes(term) ||
				rangoDisplay.toLowerCase().includes(term) ||
				(order.enviarA && order.enviarA.toLowerCase().includes(term))
			);
		});
	}
	
	renderReportRecordsList();
};

const updateReportMarkAllCheckbox = () => {
	const markAllCheckbox = document.getElementById("markAllCheckbox");
	const allChecked = reportFilteredOrders.length > 0 && 
		reportFilteredOrders.every(order => selectedReportRecords.has(order.id));
	markAllCheckbox.checked = allChecked;
};

const toggleMarkAllReports = () => {
	const markAllCheckbox = document.getElementById("markAllCheckbox");
	if (markAllCheckbox.checked) {
		reportFilteredOrders.forEach(order => selectedReportRecords.add(order.id));
	} else {
		reportFilteredOrders.forEach(order => selectedReportRecords.delete(order.id));
	}
	renderReportRecordsList();
};

const openReportModal = () => {
	reportModal.classList.add("active");
	reportModal.setAttribute("aria-hidden", "false");
	document.body.classList.add("modal-open");
	
	// Inicializar
	selectedReportRecords = new Set();
	reportFilteredOrders = getOrders();
	renderReportRecordsList();
	document.getElementById("reportSearchInput").value = "";
	updateReportMarkAllCheckbox();
};

const closeReportModal = () => {
	reportModal.classList.remove("active");
	reportModal.setAttribute("aria-hidden", "true");
	document.body.classList.remove("modal-open");
};

const downloadSelectedReports = () => {
	if (selectedReportRecords.size === 0) {
		alert("Por favor selecciona al menos un registro para descargar.");
		return;
	}
	
	// Obtener órdenes seleccionadas
	const allOrders = getOrders();
	const selectedOrders = allOrders.filter(order => selectedReportRecords.has(order.id));
	
	exportPdf(selectedOrders);
	closeReportModal();
};

const exportPdf = (ordersToExport = null, columnsToShow = null) => {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	const orders = ordersToExport || getOrders();
	
	// Columnas a mostrar (por defecto todas)
	const defaultColumns = ["fecha", "cliente", "rango", "region", "enviarA", "cantidad", "unitario", "total", "estado"];
	const columns = columnsToShow || defaultColumns;
	
	// Calcular totales
	const totalPedidos = orders.length;
	const valorTotal = orders.reduce((sum, order) => sum + toTotal(order), 0);
	const valorPendiente = orders
		.filter((order) => ["pendiente", "en curso"].includes(order.estado.toLowerCase()))
		.reduce((sum, order) => sum + toTotal(order), 0);
	const valorEntregado = orders
		.filter((order) => order.estado.toLowerCase() === "entregado")
		.reduce((sum, order) => sum + toTotal(order), 0);
	
	// Configuración
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;
	let yPos = margin;
	
	// Encabezado
	doc.setFontSize(18);
	doc.setFont("helvetica", "bold");
	doc.text("Parches y Costuras", margin, yPos);
	yPos += 7;
	
	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(100, 100, 100);
	doc.text("Reporte de Pedidos", margin, yPos);
	yPos += 4;
	
	const today = new Date().toLocaleDateString('es-CL', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
	doc.text(`Fecha: ${today}`, margin, yPos);
	yPos += 12;
	
	// Resumen de totales
	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(0, 0, 0);
	doc.text("Resumen", margin, yPos);
	yPos += 8;
	
	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	
	// Cuadro de resumen
	const summaryData = [
		["Total pedidos:", totalPedidos.toString()],
		["Valor total:", currency.format(valorTotal)],
		["Pendiente/En curso:", currency.format(valorPendiente)],
		["Entregado:", currency.format(valorEntregado)]
	];
	
	summaryData.forEach(([label, value]) => {
		doc.text(label, margin, yPos);
		doc.setFont("helvetica", "bold");
		doc.text(value, margin + 50, yPos);
		doc.setFont("helvetica", "normal");
		yPos += 6;
	});
	
	yPos += 10;
	
	// Tabla de pedidos
	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.text("Detalle de Pedidos", margin, yPos);
	yPos += 8;
	
	// Mapeo de columnas a headers y ancho
	const columnConfig = {
		fecha: { header: "Fecha", width: 18 },
		cliente: { header: "Cliente", width: 32 },
		rango: { header: "Rango", width: 18 },
		region: { header: "Región", width: 22 },
		enviarA: { header: "Enviar a", width: 25 },
		cantidad: { header: "Cant.", width: 10 },
		unitario: { header: "Unitario", width: 18 },
		total: { header: "Total", width: 20 },
		estado: { header: "Estado", width: 15 }
	};
	
	// Encabezados de tabla
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	const headers = columns.map(col => columnConfig[col].header);
	const colWidths = columns.map(col => columnConfig[col].width);
	let xPos = margin;
	
	doc.setFillColor(240, 240, 240);
	const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
	doc.rect(margin, yPos - 5, totalWidth, 7, 'F');
	
	headers.forEach((header, i) => {
		doc.text(header, xPos, yPos);
		xPos += colWidths[i];
	});
	
	yPos += 5;
	doc.setFont("helvetica", "normal");

	const fitText = (text, maxWidth) => {
		const raw = String(text ?? "");
		if (doc.getTextWidth(raw) <= maxWidth) return raw;
		const ellipsis = "...";
		let trimmed = raw;
		while (trimmed.length > 0 && doc.getTextWidth(`${trimmed}${ellipsis}`) > maxWidth) {
			trimmed = trimmed.slice(0, -1);
		}
		return trimmed.length ? `${trimmed}${ellipsis}` : raw;
	};
	
	// Filas de datos
	orders.forEach((order, index) => {
		if (yPos > pageHeight - 40) {
			doc.addPage();
			yPos = margin;
		}
		
		const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
		const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
		
		xPos = margin;
		const rowDataMap = {
			fecha: formatDate(order.fecha),
			cliente: fitText(order.cliente, columnConfig.cliente.width - 1),
			rango: fitText(rangoDisplay, columnConfig.rango.width - 1),
			region: fitText(order.region, columnConfig.region.width - 1),
			enviarA: fitText(order.enviarA || "", columnConfig.enviarA.width - 1),
			cantidad: order.cantidad.toString(),
			unitario: currency.format(order.unitario),
			total: currency.format(toTotal(order)),
			estado: fitText(order.estado, columnConfig.estado.width - 1)
		};
		
		// Alternar color de fondo
		if (index % 2 === 0) {
			doc.setFillColor(250, 250, 250);
			doc.rect(margin, yPos - 4, totalWidth, 6, 'F');
		}
		
		columns.forEach((col, i) => {
			doc.text(rowDataMap[col], xPos, yPos);
			xPos += colWidths[i];
		});
		
		yPos += 6;
	});
	
	yPos += 10;
	
	// Información adicional detallada
	if (yPos > pageHeight - 60) {
		doc.addPage();
		yPos = margin;
	}
	
	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.text("Información Detallada", margin, yPos);
	yPos += 8;
	
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	
	orders.forEach((order, index) => {
		if (yPos > pageHeight - 50) {
			doc.addPage();
			yPos = margin;
		}
		
		const tipoCliente = order.tipoCliente || (order.rango === "N/A" ? "tienda" : "individual");
		const rangoDisplay = tipoCliente === "tienda" ? "Tienda" : (order.rango || "N/A");
		
		doc.setFont("helvetica", "bold");
		doc.text(`Pedido ${index + 1}: ${order.cliente}`, margin, yPos);
		yPos += 5;
		
		const lineX = margin + 5;
		doc.setFont("helvetica", "bold");
		doc.text("Fecha: ", lineX, yPos);
		const fechaLabelW = doc.getTextWidth("Fecha: ");
		doc.setFont("helvetica", "normal");
		const fechaText = `${formatDate(order.fecha)} | `;
		doc.text(fechaText, lineX + fechaLabelW, yPos);
		const fechaTextW = doc.getTextWidth(fechaText);

		doc.setFont("helvetica", "bold");
		doc.text("Rango: ", lineX + fechaLabelW + fechaTextW, yPos);
		const rangoLabelW = doc.getTextWidth("Rango: ");
		doc.setFont("helvetica", "normal");
		const rangoText = `${rangoDisplay} | `;
		doc.text(rangoText, lineX + fechaLabelW + fechaTextW + rangoLabelW, yPos);
		const rangoTextW = doc.getTextWidth(rangoText);

		doc.setFont("helvetica", "bold");
		doc.text("Región: ", lineX + fechaLabelW + fechaTextW + rangoLabelW + rangoTextW, yPos);
		const regionLabelW = doc.getTextWidth("Región: ");
		doc.setFont("helvetica", "normal");
		doc.text(order.region, lineX + fechaLabelW + fechaTextW + rangoLabelW + rangoTextW + regionLabelW, yPos);
		yPos += 5;
		
		if (order.llegadaEstimada) {
			doc.setFont("helvetica", "bold");
			doc.text("Llegada estimada: ", margin + 5, yPos);
			const llegadaLabelW = doc.getTextWidth("Llegada estimada: ");
			doc.setFont("helvetica", "normal");
			doc.text(formatDate(order.llegadaEstimada), margin + 5 + llegadaLabelW, yPos);
			yPos += 5;
		}
		
		if (order.enviarA) {
			doc.setFont("helvetica", "bold");
			doc.text("Enviar a:", margin + 5, yPos);
			yPos += 4;
			doc.setFont("helvetica", "normal");
			const enviarALines = doc.splitTextToSize(order.enviarA.replace(/\n/g, ', '), pageWidth - 2 * margin - 10);
			doc.text(enviarALines, margin + 10, yPos);
			yPos += 4 * enviarALines.length;
		}
		
		if (order.facturarA) {
			doc.setFont("helvetica", "bold");
			doc.text("Facturar a:", margin + 5, yPos);
			yPos += 4;
			doc.setFont("helvetica", "normal");
			const facturarALines = doc.splitTextToSize(order.facturarA.replace(/\n/g, ', '), pageWidth - 2 * margin - 10);
			doc.text(facturarALines, margin + 10, yPos);
			yPos += 4 * facturarALines.length;
		}
		
		if (order.distribuidor) {
			doc.setFont("helvetica", "bold");
			doc.text("Distribuidor:", margin + 5, yPos);
			yPos += 4;
			doc.setFont("helvetica", "normal");
			const distribuidorLines = doc.splitTextToSize(order.distribuidor.replace(/\n/g, ', '), pageWidth - 2 * margin - 10);
			doc.text(distribuidorLines, margin + 10, yPos);
			yPos += 4 * distribuidorLines.length;
		}
		
		if (order.productos) {
			doc.setFont("helvetica", "bold");
			doc.text("Producto (PDF):", margin + 5, yPos);
			yPos += 4;
			doc.setFont("helvetica", "normal");
			const productosLines = doc.splitTextToSize(order.productos.replace(/\n/g, ', '), pageWidth - 2 * margin - 10);
			doc.text(productosLines, margin + 10, yPos);
			yPos += 4 * productosLines.length;
		}
		
		if (order.notas) {
			doc.setFont("helvetica", "bold");
			doc.text("Notas:", margin + 5, yPos);
			yPos += 4;
			doc.setFont("helvetica", "normal");
			const notasLines = doc.splitTextToSize(order.notas.replace(/\n/g, ', '), pageWidth - 2 * margin - 10);
			doc.text(notasLines, margin + 10, yPos);
			yPos += 4 * notasLines.length;
		}
		
		yPos += 3;
		doc.setDrawColor(220, 220, 220);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 5;
	});
	
	// Pie de página en todas las páginas
	const totalPages = doc.internal.getNumberOfPages();
	for (let i = 1; i <= totalPages; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setTextColor(150, 150, 150);
		doc.text(
			`Página ${i} de ${totalPages} - Generado el ${today}`,
			pageWidth / 2,
			pageHeight - 10,
			{ align: 'center' }
		);
	}
	
	// Guardar con nombre descriptivo que incluye cantidad de pedidos y hora
	const now = new Date();
	const fecha = now.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '').replace(/ /g, '-');
	const hora = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;
	const cantidadPedidos = orders.length;
	doc.save(`Reporte-${cantidadPedidos}pedidos-${fecha}-${hora}.pdf`);
};

const onReady = () => {
    // Inicializar referencias a elementos del DOM
    modal = document.getElementById("modal");
    confirmModal = document.getElementById("confirmModal");
    confirmMessageEl = document.getElementById("confirmMessage");
    confirmDeleteBtn = document.getElementById("confirmDelete");
    confirmCancelBtn = document.getElementById("confirmCancel");
    confirmCloseBtn = document.getElementById("confirmClose");
    undoToastEl = document.getElementById("undoToast");
    undoMessageEl = document.getElementById("undoMessage");
    undoBtn = document.getElementById("undoBtn");
    orderForm = document.getElementById("orderForm");
    ordersBody = document.getElementById("ordersBody");
    paginationEl = document.getElementById("pagination");
    totalPedidosEl = document.getElementById("totalPedidos");
    valorTotalEl = document.getElementById("valorTotal");
    valorPendienteEl = document.getElementById("valorPendiente");
    valorEntregadoEl = document.getElementById("valorEntregado");
    totalPreview = document.getElementById("totalPreview");
    importInput = document.getElementById("importInput");
    pdfInput = document.getElementById("pdfInput");

    fields = {
		id: document.getElementById("orderId"),
		fecha: document.getElementById("fecha"),
		cliente: document.getElementById("cliente"),
		tipoCliente: document.getElementById("tipoCliente"),
		rango: document.getElementById("rango"),
		region: document.getElementById("region"),
		enviarA: document.getElementById("enviarA"),
		facturarA: document.getElementById("facturarA"),
		productos: document.getElementById("productos"),
		cantidad: document.getElementById("cantidad"),
		unitario: document.getElementById("unitario"),
		descuento: document.getElementById("descuento"),
		subtotal: document.getElementById("subtotal"),
		impuestos: document.getElementById("impuestos"),
		envio: document.getElementById("envio"),
		estado: document.getElementById("estado"),
		condicionPago: document.getElementById("condicionPago"),
		moneda: document.getElementById("moneda"),
		llegadaEstimada: document.getElementById("llegadaEstimada"),
		distribuidor: document.getElementById("distribuidor"),
		notas: document.getElementById("notas"),
	};
	
	const rangoLabel = document.getElementById("rangoLabel");

	// Manejar cambio de Tipo de Cliente
	fields.tipoCliente.addEventListener("change", () => {
		const tipo = fields.tipoCliente.value;
		if (tipo === "individual") {
			rangoLabel.style.display = "";
			fields.rango.setAttribute("required", "required");
		} else if (tipo === "tienda") {
			rangoLabel.style.display = "none";
			fields.rango.removeAttribute("required");
			fields.rango.value = "N/A";
		} else {
			rangoLabel.style.display = "none";
			fields.rango.removeAttribute("required");
			fields.rango.value = "";
		}
	});

	// Inicializar formulario
	fields.fecha.value = todayIso();
	updatePreview();
	renderOrders();

	// Event Listeners
	document.getElementById("addBtn").addEventListener("click", () => {
		orderForm.reset();
		fields.fecha.value = todayIso();
		fields.cantidad.value = 1;
		fields.unitario.value = 0;
		fields.descuento.value = 0;
		fields.subtotal.value = 0;
		fields.impuestos.value = 0;
		fields.envio.value = 0;
		fields.enviarA.value = "";
		fields.facturarA.value = "";
		fields.productos.value = "";
		fields.estado.value = "Pendiente";
		fields.condicionPago.value = "Ninguna";
		fields.moneda.value = "CLP";
		fields.llegadaEstimada.value = "";
		fields.distribuidor.value = "";
		openModal("Agregar Pedido");
		autoResizeAll();
		updatePreview();
	});

	// Menu desplegable para móvil
	const menuBtn = document.getElementById("menuBtn");
	const menuDropdown = document.getElementById("menuDropdown");
	
	menuBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		menuDropdown.classList.toggle("active");
	});
	
	document.addEventListener("click", (e) => {
		if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
			menuDropdown.classList.remove("active");
		}
	});

	document.getElementById("closeModal").addEventListener("click", closeModal);
	document.getElementById("cancelBtn").addEventListener("click", closeModal);
	document.getElementById("exportBtn").addEventListener("click", exportJson);
	document.getElementById("exportPdfBtn").addEventListener("click", openReportModal);
	document.getElementById("descargarFormatoBtn").addEventListener("click", () => {
		document.getElementById("formatModal").style.display = "flex";
	});
	document.getElementById("seedOrdersBtn").addEventListener("click", () => seedTestOrders());

	// Modal para seleccionar formato
	document.getElementById("formatTiendaBtn").addEventListener("click", () => {
		document.getElementById("formatoPdf").value = "tienda";
		descargarFormato();
		document.getElementById("formatModal").style.display = "none";
	});
	
	document.getElementById("formatIndividualBtn").addEventListener("click", () => {
		document.getElementById("formatoPdf").value = "individual";
		descargarFormato();
		document.getElementById("formatModal").style.display = "none";
	});

    // Modal de reportes
    reportModal = document.getElementById("reportModal");
    const closeReportModalBtn = document.getElementById("closeReportModal");
    const cancelReportBtn = document.getElementById("cancelReportBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
	const reportSearchInput = document.getElementById("reportSearchInput");
	const markAllCheckbox = document.getElementById("markAllCheckbox");

    closeReportModalBtn.addEventListener("click", closeReportModal);
    cancelReportBtn.addEventListener("click", closeReportModal);
    downloadReportBtn.addEventListener("click", downloadSelectedReports);
	
	reportSearchInput.addEventListener("input", (event) => {
		filterReportRecords(event.target.value);
	});
	
	markAllCheckbox.addEventListener("change", toggleMarkAllReports);

    reportModal.addEventListener("click", (event) => {
        if (event.target === reportModal) closeReportModal();
    });

    // Confirmación de eliminación
    confirmCancelBtn.addEventListener("click", closeConfirmDelete);
    confirmCloseBtn.addEventListener("click", closeConfirmDelete);
    confirmModal.addEventListener("click", (event) => {
        if (event.target === confirmModal) closeConfirmDelete();
    });
    confirmDeleteBtn.addEventListener("click", () => {
        if (!pendingDeleteId) {
            closeConfirmDelete();
            return;
        }
        const orders = getOrders();
        const orderToDelete = orders.find((item) => item.id === pendingDeleteId);
        const updated = orders.filter((item) => item.id !== pendingDeleteId);
        saveOrders(updated);
        renderOrders();
        closeConfirmDelete();
        if (orderToDelete) showUndoToast(orderToDelete);
    });
    undoBtn.addEventListener("click", handleUndoDelete);
    
    // Buscador
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (event) => {
        filterOrders(event.target.value);
    });

    importInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            importJson(file);
            importInput.value = "";
        }
    });

    pdfInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await extractPdfText(file);
            const parsed = parsePdfText(text);
            orderForm.reset();
            fields.fecha.value = parsed.fecha || todayIso();
            fields.cliente.value = parsed.cliente || "";
            fields.enviarA.value = parsed.enviarA || "";
            fields.facturarA.value = parsed.facturarA || "";
            fields.productos.value = parsed.productos || "";
            fields.cantidad.value = parsed.cantidad || 1;
            fields.unitario.value = parsed.unitario || 0;
            fields.descuento.value = 0;
            fields.subtotal.value = parsed.subtotal || 0;
            fields.impuestos.value = parsed.impuestos || 0;
            fields.envio.value = parsed.envio || 0;
            fields.estado.value = "Pendiente";
            fields.condicionPago.value = parsed.condicionPago || "Ninguna";
            fields.moneda.value = parsed.moneda || "CLP";
            fields.llegadaEstimada.value = parsed.llegadaEstimada || "";
            fields.distribuidor.value = parsed.distribuidor || "";
            fields.notas.value = parsed.notas || "";
            openModal("Nuevo pedido desde PDF");
            updatePreview();
            autoResizeAll();
        } catch (error) {
            console.error("Error al leer PDF:", error);
            alert(`No se pudo leer el PDF: ${error.message}\n\nPuedes completar el formulario manualmente.`);
        } finally {
            pdfInput.value = "";
        }
    });

    orderForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const orders = getOrders();
        const order = collectForm();
        const existingIndex = orders.findIndex((item) => item.id === order.id);

        if (existingIndex >= 0) {
            orders[existingIndex] = order;
        } else {
            orders.unshift(order);
        }

        saveOrders(orders);
        renderOrders();
        closeModal();
    });

    orderForm.addEventListener("input", (event) => {
        const targetId = event.target.id;
        if (["notas", "enviarA", "facturarA", "productos", "distribuidor"].includes(targetId)) {
            autoResize(event.target);
            return;
        }
        if (["cantidad", "unitario", "descuento", "subtotal", "impuestos", "envio"].includes(targetId)) {
            updatePreview();
        }
    });

    ordersBody.addEventListener("click", (event) => {
        const editId = event.target.getAttribute("data-edit");
        const deleteId = event.target.getAttribute("data-delete");
        const orders = getOrders();

        if (editId) {
            const order = orders.find((item) => item.id === editId);
            if (order) {
                fillForm(order);
                openModal("Editar Pedido");
            }
        }

        if (deleteId) {
            const orderToDelete = orders.find((item) => item.id === deleteId);
            openConfirmDelete(orderToDelete);
        }
    });
};

document.addEventListener("DOMContentLoaded", onReady);

// Actualización automática en tiempo real
// 1. Detecta cambios desde otras pestañas
window.addEventListener("storage", (event) => {
	if (event.key === "orders-parches") {
		renderOrders();
	}
});

// 2. Revisión periódica ligera cada 15 segundos (para casos edge)
let lastCheck = JSON.stringify(getOrders());
setInterval(() => {
	const current = JSON.stringify(getOrders());
	if (current !== lastCheck) {
		lastCheck = current;
		renderOrders();
	}
}, 15000); // 15 segundos - ligero para computadoras de gama baja
