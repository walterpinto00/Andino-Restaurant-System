/**
 * ==========================================================================
 * HOTEL ANDINO S.A.S. - APP.JS
 * 
 * Logica principal del sistema: vistas, modulos y navegacion.
 * Depende de: validaciones.js y seguridad.js
 * ==========================================================================
 */

/* ==========================================================================
   1. BASE DE DATOS Y ESTADO GLOBAL
   ========================================================================== */
let baseDatos = {
    huespedes: [
        { id: 1, nombre: "Juan PÃ©rez", documento: "102030", habitacion: "101", plan: 3, comidasHoy: 0 },
        { id: 2, nombre: "MarÃ­a GÃ³mez", documento: "405060", habitacion: "102", plan: 1, comidasHoy: 0 }
    ],
    inventario: [
        { id: 1, nombre: "Lomo de Res", stock: 15, unidad: "PorciÃ³n", costo: 12000 },
        { id: 2, nombre: "SalmÃ³n", stock: 3, unidad: "PorciÃ³n", costo: 18000 }, // Stock crÃ­tico
        { id: 3, nombre: "Pechuga de Pollo", stock: 20, unidad: "PorciÃ³n", costo: 6000 },
        { id: 4, nombre: "Huevos", stock: 40, unidad: "Und", costo: 600 }
    ],
    comandas: [],
    precioEstandar: 25000 
};

function guardarDatos() {
    localStorage.setItem('hotelAndino_DB', JSON.stringify(baseDatos));
}

function cargarDatos() {
    let datosGuardados = localStorage.getItem('hotelAndino_DB');
    if (datosGuardados) {
        baseDatos = JSON.parse(datosGuardados);
    } else {
        guardarDatos();
    }
}

/* ==========================================================================
   2. INICIALIZACIÃ“N Y CONTROL DE VISTAS (APP.JS BASE)
   ========================================================================== */
window.onload = function() {
    cargarDatos();
    
    // Verificar si ya inició sesión en esta pestaña
    if (sessionStorage.getItem('hotelAndino_logged') === 'true') {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-sidebar').style.display = 'flex';
        document.getElementById('app-main').style.display = 'flex';
        actualizarVistas();
    }
};

function cambiarSeccion(seccionId) {
    // Ocultar todo
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    // Mostrar elegido
    document.getElementById('seccion-' + seccionId).classList.add('active');
    document.getElementById('nav-' + seccionId).classList.add('active');
    actualizarVistas();
}

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span>${tipo === 'success' ? 'âœ…' : 'âŒ'}</span><span>${mensaje}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function actualizarVistas() {
    actualizarDashboard();
    renderizarHuespedes();
    renderizarComandas();
    renderizarInventario();
    renderizarCaja();
}

function actualizarDashboard() {
    document.getElementById('dash-platos').textContent = baseDatos.comandas.length;
    let ingresos = 0;
    baseDatos.comandas.forEach(c => { if (c.tipo === 'Cobro') ingresos += c.valor; });
    document.getElementById('dash-ingresos').textContent = '$' + ingresos.toLocaleString();

    let alertas = baseDatos.inventario.filter(item => item.stock < 5).length;
    let elAlertas = document.getElementById('dash-alertas');
    elAlertas.textContent = alertas;
    elAlertas.style.color = alertas > 0 ? 'var(--danger)' : 'var(--gold)';
}

/* ==========================================================================
   3. MÃ“DULO HUÃ‰SPEDES
   ========================================================================== */
function registrarHuesped() {
    let nombre = sanitizar(document.getElementById('huesped-nombre').value);
    let doc = sanitizar(document.getElementById('huesped-doc').value);
    let hab = sanitizar(document.getElementById('huesped-hab').value);
    let plan = parseInt(document.getElementById('huesped-plan').value);

    // V1: Campos vacíos
    if (campoVacio(nombre) || campoVacio(doc) || campoVacio(hab)) {
        mostrarToast('⚠️ Todos los campos son obligatorios', 'error'); return;
    }
    // V2: Nombre solo letras
    if (!soloLetras(nombre)) {
        mostrarToast('⚠️ El nombre solo puede contener letras', 'error'); return;
    }
    // V3: Nombre mínimo 3 caracteres
    if (nombre.trim().length < 3) {
        mostrarToast('⚠️ El nombre debe tener al menos 3 caracteres', 'error'); return;
    }
    // V4: Documento solo números
    if (!soloNumeros(doc)) {
        mostrarToast('⚠️ El documento solo puede contener números', 'error'); return;
    }
    // V5: Documento duplicado
    if (documentoExiste(doc)) {
        mostrarToast('⚠️ Ya existe un huésped con ese documento registrado', 'error'); return;
    }

    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1); // Capitalizar
    baseDatos.huespedes.push({
        id: Date.now(), nombre, documento: doc, habitacion: hab, plan, comidasHoy: 0
    });
    guardarDatos();
    mostrarToast('✅ Huésped registrado exitosamente');
    document.getElementById('huesped-nombre').value = '';
    document.getElementById('huesped-doc').value = '';
    document.getElementById('huesped-hab').value = '';
    actualizarVistas();
}

function renderizarHuespedes() {
    const tbody = document.getElementById('tabla-huespedes');
    const selectComanda = document.getElementById('comanda-huesped');
    tbody.innerHTML = '';
    selectComanda.innerHTML = '<option value="">-- Selecciona un huÃ©sped --</option>';

    baseDatos.huespedes.forEach(h => {
        let nombrePlan = h.plan === 3 ? 'PensiÃ³n Completa' : h.plan === 2 ? 'Media PensiÃ³n' : h.plan === 1 ? 'Solo Desayuno' : 'Solo Alojamiento';
        let colorPlan = h.plan === 0 ? 'danger' : 'gold';
        tbody.innerHTML += `<tr><td>${h.nombre}</td><td>${h.documento}</td><td>Hab. ${h.habitacion}</td><td><span class="badge ${colorPlan}">${nombrePlan}</span></td><td><strong>${h.comidasHoy}</strong> de ${h.plan} permitidas</td></tr>`;
        selectComanda.innerHTML += `<option value="${h.id}">${h.nombre} (Hab. ${h.habitacion})</option>`;
    });
}

/* ==========================================================================
   4. MÃ“DULO COMANDAS Y VALIDACIÃ“N
   ========================================================================== */
function toggleTipoCliente() {
    const esExterno = document.getElementById('comanda-tipo').value === 'externo';
    document.getElementById('grupo-huesped').style.display = esExterno ? 'none' : 'block';
    document.getElementById('grupo-externo').style.display = esExterno ? 'block' : 'none';
}

function registrarComanda() {
    const tipoCliente = document.getElementById('comanda-tipo').value;
    const comida = document.getElementById('comanda-comida').value;
    const ingredienteId = parseInt(document.getElementById('comanda-plato').value);
    const meseroAsignado = document.getElementById('comanda-mesero').value;
    
    let clienteNombre = "", tipoRegistro = "", valorCobrado = 0;

    let ingrediente = baseDatos.inventario.find(i => i.id === ingredienteId);
    if (!ingrediente || ingrediente.stock <= 0) {
        mostrarToast(`Stock agotado. Revisa el inventario.`, 'error'); return;
    }

    if (tipoCliente === 'huesped') {
        const idHuesped = parseInt(document.getElementById('comanda-huesped').value);
        if (!idHuesped) { mostrarToast('Selecciona un huÃ©sped', 'error'); return; }

        let huesped = baseDatos.huespedes.find(h => h.id === idHuesped);
        
        if (huesped.comidasHoy >= huesped.plan) {
            mostrarToast(`El huÃ©sped ya consumiÃ³ su plan de ${huesped.plan} comidas. Debe pagar como Externo.`, 'error');
            return;
        }
        huesped.comidasHoy++;
        clienteNombre = huesped.nombre;
        tipoRegistro = 'CortesÃ­a (Plan)';
    } else {
        clienteNombre = document.getElementById('comanda-externo').value;
        if (!clienteNombre) { mostrarToast('Ingresa el nombre del externo', 'error'); return; }
        tipoRegistro = 'Cobro';
        valorCobrado = baseDatos.precioEstandar;
        document.getElementById('comanda-externo').value = '';
    }

    ingrediente.stock--;
    let fecha = new Date();
    let hora = fecha.getHours() + ':' + (fecha.getMinutes() < 10 ? '0' : '') + fecha.getMinutes();

    baseDatos.comandas.push({ hora: hora, cliente: clienteNombre, mesero: meseroAsignado, comida: comida, plato: ingrediente.nombre, tipo: tipoRegistro, valor: valorCobrado });
    guardarDatos();
    mostrarToast('Comanda registrada correctamente');
    actualizarVistas();
}

function renderizarComandas() {
    const tbody = document.getElementById('tabla-comandas');
    const selectPlato = document.getElementById('comanda-plato');
    tbody.innerHTML = '';
    
    if (selectPlato.options.length === 0) {
        baseDatos.inventario.forEach(i => { selectPlato.innerHTML += `<option value="${i.id}">${i.nombre}</option>`; });
    }

    let reversa = [...baseDatos.comandas].reverse();
    reversa.forEach(c => {
        let badgeType = c.tipo === 'Cobro' ? 'success' : 'gold';
        tbody.innerHTML += `<tr><td>${c.hora}</td><td>${c.cliente}</td><td>${c.mesero || 'No asignado'}</td><td>${c.comida}</td><td>${c.plato}</td><td><span class="badge ${badgeType}">${c.tipo}</span></td></tr>`;
    });
}

/* ==========================================================================
   5. MÃ“DULO INVENTARIO (SISTEMA STOP)
   ========================================================================== */
function renderizarInventario() {
    const tbody = document.getElementById('tabla-inventario');
    tbody.innerHTML = '';

    baseDatos.inventario.forEach((item, index) => {
        let badgeEstado = item.stock < 5 ? '<span class="badge danger">STOP - CRÃTICO</span>' : '<span class="badge success">Disponible</span>';
        tbody.innerHTML += `<tr><td>${item.nombre}</td><td style="font-size: 1.2rem; font-weight: bold;">${item.stock}</td><td>${item.unidad}</td><td>$${item.costo.toLocaleString()}</td><td>${badgeEstado}</td><td><button class="btn" style="padding: 6px 12px; font-size: 0.8rem;" onclick="sumarInventario(${index})">+ Agregar</button></td></tr>`;
    });
}

function sumarInventario(index) {
    let cantidadStr = prompt("Â¿CuÃ¡ntas unidades deseas agregar al inventario?");
    if (cantidadStr === null || cantidadStr.trim() === "") return;
    
    let cantidad = parseInt(cantidadStr);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast('Por favor, ingresa un nÃºmero vÃ¡lido mayor a 0', 'error');
        return;
    }

    baseDatos.inventario[index].stock += cantidad;
    guardarDatos();
    mostrarToast('Inventario actualizado');
    actualizarVistas();
}

/* ==========================================================================
   6. MÃ“DULO CAJA DIARIA
   ========================================================================== */
function renderizarCaja() {
    const tbody = document.getElementById('tabla-caja');
    tbody.innerHTML = '';
    let totalRecaudado = 0, totalCortesias = 0;

    baseDatos.comandas.forEach(c => {
        if (c.tipo === 'Cobro') {
            totalRecaudado += c.valor;
            tbody.innerHTML += `<tr><td>${c.hora}</td><td>Venta Externo - ${c.cliente} (${c.plato})</td><td style="color: var(--success); font-weight: bold;">+$${c.valor.toLocaleString()}</td></tr>`;
        } else {
            totalCortesias++;
        }
    });

    document.getElementById('caja-total').textContent = '$' + totalRecaudado.toLocaleString();
    document.getElementById('caja-cortesias').textContent = totalCortesias + ' servidas';
    if (totalRecaudado === 0) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--text-secondary);">No hay ingresos registrados hoy</td></tr>`;
}

