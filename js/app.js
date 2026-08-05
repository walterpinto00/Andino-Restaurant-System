/**
 * ==========================================================================
 * HOTEL ANDINO S.A.S. - LÓGICA PRINCIPAL DEL SISTEMA (app.js)
 * 
 * Todo el código está unificado en este archivo para cumplir con las 
 * reglas del Hackathon, pero dividido por bloques para fácil explicación.
 * ==========================================================================
 */

/* ==========================================================================
   1. BASE DE DATOS Y ESTADO GLOBAL
   ========================================================================== */
let baseDatos = {
    huespedes: [
        { id: 1, nombre: "Juan Pérez", documento: "102030", habitacion: "101", plan: 3, comidasHoy: 0 },
        { id: 2, nombre: "María Gómez", documento: "405060", habitacion: "102", plan: 1, comidasHoy: 0 }
    ],
    inventario: [
        { id: 1, nombre: "Lomo de Res", stock: 15, unidad: "Porción", costo: 12000 },
        { id: 2, nombre: "Salmón", stock: 3, unidad: "Porción", costo: 18000 }, // Stock crítico
        { id: 3, nombre: "Pechuga de Pollo", stock: 20, unidad: "Porción", costo: 6000 },
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
   2. INICIALIZACIÓN Y CONTROL DE VISTAS (APP.JS BASE)
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

/**
 * Validar el PIN de seguridad (Simulación Básica)
 */
function validarLogin() {
    const pin = document.getElementById('login-pin').value;
    
    // PIN de seguridad fijo para el prototipo
    if (pin === '1234') {
        sessionStorage.setItem('hotelAndino_logged', 'true');
        
        // Efecto de transición
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('app-sidebar').style.display = 'flex';
            document.getElementById('app-main').style.display = 'flex';
            actualizarVistas();
            mostrarToast('Bienvenido al Sistema');
        }, 300);
    } else {
        mostrarToast('PIN incorrecto. Acceso denegado.', 'error');
    }
}

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
    toast.innerHTML = `<span>${tipo === 'success' ? '✅' : '❌'}</span><span>${mensaje}</span>`;
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
   3. MÓDULO HUÉSPEDES
   ========================================================================== */
function registrarHuesped() {
    let nombre = document.getElementById('huesped-nombre').value;
    let doc = document.getElementById('huesped-doc').value;
    let hab = document.getElementById('huesped-hab').value;
    let plan = parseInt(document.getElementById('huesped-plan').value);

    if (!nombre || !doc || !hab) {
        mostrarToast('Por favor completa todos los campos', 'error');
        return;
    }

    baseDatos.huespedes.push({
        id: Date.now(), nombre: nombre, documento: doc, habitacion: hab, plan: plan, comidasHoy: 0
    });
    guardarDatos();
    mostrarToast('Huésped registrado exitosamente');
    
    document.getElementById('huesped-nombre').value = '';
    document.getElementById('huesped-doc').value = '';
    document.getElementById('huesped-hab').value = '';
    actualizarVistas();
}

function renderizarHuespedes() {
    const tbody = document.getElementById('tabla-huespedes');
    const selectComanda = document.getElementById('comanda-huesped');
    tbody.innerHTML = '';
    selectComanda.innerHTML = '<option value="">-- Selecciona un huésped --</option>';

    baseDatos.huespedes.forEach(h => {
        let nombrePlan = h.plan === 3 ? 'Pensión Completa' : h.plan === 2 ? 'Media Pensión' : h.plan === 1 ? 'Solo Desayuno' : 'Solo Alojamiento';
        let colorPlan = h.plan === 0 ? 'danger' : 'gold';
        tbody.innerHTML += `<tr><td>${h.nombre}</td><td>${h.documento}</td><td>Hab. ${h.habitacion}</td><td><span class="badge ${colorPlan}">${nombrePlan}</span></td><td><strong>${h.comidasHoy}</strong> de ${h.plan} permitidas</td></tr>`;
        selectComanda.innerHTML += `<option value="${h.id}">${h.nombre} (Hab. ${h.habitacion})</option>`;
    });
}

/* ==========================================================================
   4. MÓDULO COMANDAS Y VALIDACIÓN
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
        if (!idHuesped) { mostrarToast('Selecciona un huésped', 'error'); return; }

        let huesped = baseDatos.huespedes.find(h => h.id === idHuesped);
        
        if (huesped.comidasHoy >= huesped.plan) {
            mostrarToast(`El huésped ya consumió su plan de ${huesped.plan} comidas. Debe pagar como Externo.`, 'error');
            return;
        }
        huesped.comidasHoy++;
        clienteNombre = huesped.nombre;
        tipoRegistro = 'Cortesía (Plan)';
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
   5. MÓDULO INVENTARIO (SISTEMA STOP)
   ========================================================================== */
function renderizarInventario() {
    const tbody = document.getElementById('tabla-inventario');
    tbody.innerHTML = '';

    baseDatos.inventario.forEach((item, index) => {
        let badgeEstado = item.stock < 5 ? '<span class="badge danger">STOP - CRÍTICO</span>' : '<span class="badge success">Disponible</span>';
        tbody.innerHTML += `<tr><td>${item.nombre}</td><td style="font-size: 1.2rem; font-weight: bold;">${item.stock}</td><td>${item.unidad}</td><td>$${item.costo.toLocaleString()}</td><td>${badgeEstado}</td><td><button class="btn" style="padding: 6px 12px; font-size: 0.8rem;" onclick="sumarInventario(${index})">+ Agregar</button></td></tr>`;
    });
}

function sumarInventario(index) {
    let cantidadStr = prompt("¿Cuántas unidades deseas agregar al inventario?");
    if (cantidadStr === null || cantidadStr.trim() === "") return;
    
    let cantidad = parseInt(cantidadStr);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast('Por favor, ingresa un número válido mayor a 0', 'error');
        return;
    }

    baseDatos.inventario[index].stock += cantidad;
    guardarDatos();
    mostrarToast('Inventario actualizado');
    actualizarVistas();
}

/* ==========================================================================
   6. MÓDULO CAJA DIARIA
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
