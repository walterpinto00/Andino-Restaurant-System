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
    precioEstandar: 25000,
    personal: [
        { id: 1, nombre: "Admin_User", usuario: "admin", clave: "123456", rol: "Administrador", estado: "Activo" },
        { id: 2, nombre: "Recepción María", usuario: "recepcion", clave: "123456", rol: "Recepcionista", estado: "Activo" },
        { id: 3, nombre: "Mesero Carlos", usuario: "mesero", clave: "123456", rol: "Mesero", estado: "Activo" }
    ]
};

function guardarDatos() {
    localStorage.setItem('hotelAndino_DB', JSON.stringify(baseDatos));
}

function cargarDatos() {
    let datosGuardados = localStorage.getItem('hotelAndino_DB');
    if (datosGuardados) {
        baseDatos = JSON.parse(datosGuardados);
        // Migración para usuarios antiguos
        if (!baseDatos.personal) {
            baseDatos.personal = [
                { id: 1, nombre: "Admin_User", usuario: "admin", clave: "123456", rol: "Administrador", estado: "Activo" },
                { id: 2, nombre: "Recepción María", usuario: "recepcion", clave: "123456", rol: "Recepcionista", estado: "Activo" },
                { id: 3, nombre: "Mesero Carlos", usuario: "mesero", clave: "123456", rol: "Mesero", estado: "Activo" }
            ];
            guardarDatos();
        } else {
            // Parche para agregar credenciales a la nómina si se actualizó el sistema después de crearlos
            let necesitaGuardar = false;
            baseDatos.personal.forEach(p => {
                if (!p.usuario || !p.clave) {
                    if (p.rol === 'Administrador') p.usuario = 'admin';
                    else if (p.rol === 'Recepcionista') p.usuario = 'recepcion';
                    else if (p.rol === 'Mesero') p.usuario = 'mesero';
                    else p.usuario = p.nombre.split(' ')[0].toLowerCase() + p.id;
                    
                    p.clave = '123456';
                    necesitaGuardar = true;
                }
            });
            if (necesitaGuardar) guardarDatos();
        }
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
    renderizarInventario();
    renderizarCaja();
    renderizarPersonal();
    renderizarComandas();

    // NUEVO: Control de Accesos por Roles (RBAC)
    const rolActual = sessionStorage.getItem('hotelAndino_userRol');
    
    // Reset display (mostrar todo por defecto para admin)
    document.getElementById('nav-huespedes').style.display = 'flex';
    document.getElementById('nav-comandas').style.display = 'flex';
    document.getElementById('nav-inventario').style.display = 'flex';
    document.getElementById('nav-caja').style.display = 'flex';
    document.getElementById('nav-personal').style.display = 'flex';

    if (rolActual === 'Mesero') {
        document.getElementById('nav-huespedes').style.display = 'none';
        document.getElementById('nav-inventario').style.display = 'none';
        document.getElementById('nav-caja').style.display = 'none';
        document.getElementById('nav-personal').style.display = 'none';
        
        // Si entra como mesero, forzar que vea comandas de una vez si estaba en el dashboard
        if(document.getElementById('seccion-dashboard').classList.contains('active')){
            cambiarSeccion('comandas');
        }
    } 
    else if (rolActual === 'Recepcionista') {
        document.getElementById('nav-inventario').style.display = 'none';
        document.getElementById('nav-caja').style.display = 'none';
        document.getElementById('nav-personal').style.display = 'none';
    }
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
    let correo = sanitizar(document.getElementById('huesped-correo').value);
    let ingreso = document.getElementById('huesped-ingreso').value;
    let salida = document.getElementById('huesped-salida').value;
    let plan = parseInt(document.getElementById('huesped-plan').value);

    // V1: Campos vacíos
    if (campoVacio(nombre) || campoVacio(doc) || campoVacio(hab) || campoVacio(correo) || !ingreso || !salida) {
        mostrarToast('⚠️ Todos los campos (incluyendo fechas) son obligatorios', 'error'); return;
    }
    // V1.5: Validar formato de correo básico
    if (!correo.includes('@') || !correo.includes('.')) {
        mostrarToast('⚠️ Ingrese un correo electrónico válido', 'error'); return;
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
    
    // V6: Habitación ocupada
    let habitacionOcupada = baseDatos.huespedes.some(h => h.habitacion === hab.trim());
    if (habitacionOcupada) {
        mostrarToast(`⚠️ La habitación ${hab} ya está ocupada por otro huésped`, 'error'); return;
    }

    // V6: Validar orden de fechas
    let dIngreso = new Date(ingreso);
    let dSalida = new Date(salida);
    if (dSalida <= dIngreso) {
        mostrarToast('⚠️ La fecha de salida debe ser POSTERIOR a la de ingreso', 'error'); return;
    }

    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1); // Capitalizar
    baseDatos.huespedes.push({
        id: Date.now(), nombre, documento: doc, correo, ingreso, salida, habitacion: hab, plan, comidasHoy: 0
    });
    guardarDatos();
    mostrarToast('✅ Huésped registrado exitosamente');
    document.getElementById('huesped-nombre').value = '';
    document.getElementById('huesped-doc').value = '';
    document.getElementById('huesped-hab').value = '';
    document.getElementById('huesped-correo').value = '';
    document.getElementById('huesped-ingreso').value = '';
    document.getElementById('huesped-salida').value = '';
    actualizarVistas();
}

function renderizarHuespedes() {
    const tbody = document.getElementById('tabla-huespedes');
    const selectComanda = document.getElementById('comanda-huesped');
    tbody.innerHTML = '';
    selectComanda.innerHTML = '<option value="">-- Selecciona un huésped --</option>';

    baseDatos.huespedes.forEach(h => {
        let nombrePlan = h.plan === 3 ? 'Pensión Completa' : h.plan === 2 ? 'Media Pensión' : h.plan === 1 ? 'Solo Desayuno' : 'Solo Alojamiento';
        let colorBadge = h.plan === 0 ? '--danger' : '--gold';
        let textoPlan = nombrePlan;
        let fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${h.nombre}</td>
            <td>${h.documento}</td>
            <td style="font-size:0.85rem;">
                <span style="color:var(--success);">In:</span> ${h.ingreso || '--'}<br>
                <span style="color:var(--danger);">Out:</span> ${h.salida || '--'}
            </td>
            <td>Hab. ${h.habitacion}</td>
            <td><span class="badge" style="background:var(${colorBadge}); color:#11111a;">${textoPlan}</span></td>
            <td>${h.comidasHoy} / ${h.plan}</td>
        `;
        tbody.appendChild(fila);
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

    // --- NUEVO: Validar horario de comidas ---
    let fecha = new Date();
    let horaActual = fecha.getHours();
    let minActual = fecha.getMinutes();
    let tiempoNum = horaActual + (minActual / 60);

    if (comida === 'Desayuno' && (tiempoNum < 6 || tiempoNum > 10.5)) {
        mostrarToast('El Desayuno solo se sirve de 6:00 AM a 10:30 AM', 'error'); return;
    }
    if (comida === 'Almuerzo' && (tiempoNum < 12 || tiempoNum > 15.5)) {
        mostrarToast('El Almuerzo solo se sirve de 12:00 PM a 3:30 PM', 'error'); return;
    }
    if (comida === 'Cena' && (tiempoNum < 18 || tiempoNum > 21.5)) {
        mostrarToast('La Cena solo se sirve de 6:00 PM a 9:30 PM', 'error'); return;
    }

    let ingrediente = baseDatos.inventario.find(i => i.id === ingredienteId);
    if (!ingrediente || ingrediente.stock <= 0) {
        mostrarToast(`Stock agotado. Revisa el inventario.`, 'error'); return;
    }

    if (tipoCliente === 'huesped') {
        const idHuesped = parseInt(document.getElementById('comanda-huesped').value);
        if (!idHuesped) { mostrarToast('Selecciona un huésped', 'error'); return; }

        let huesped = baseDatos.huespedes.find(h => h.id === idHuesped);
        
        // --- NUEVO: Validar qué comidas tiene permitidas según su plan ---
        let comidasPermitidas = [];
        if (huesped.plan === 3) comidasPermitidas = ['Desayuno', 'Almuerzo', 'Cena'];
        if (huesped.plan === 2) comidasPermitidas = ['Desayuno', 'Cena'];
        if (huesped.plan === 1) comidasPermitidas = ['Desayuno'];

        if (!comidasPermitidas.includes(comida)) {
            mostrarToast(`El plan de este huésped no incluye ${comida} de cortesía. Debe pagar como Externo.`, 'error');
            return;
        }

        // --- NUEVO: Evitar que pida dos desayunos o dos almuerzos ---
        if (!huesped.consumosHoy) huesped.consumosHoy = [];
        
        if (huesped.consumosHoy.includes(comida)) {
            mostrarToast(`El huésped ya reclamó su ${comida} de cortesía hoy. Debe pagar como Externo.`, 'error');
            return;
        }

        huesped.consumosHoy.push(comida); // Registrar qué comida consumió
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
    
    // --- NUEVO: Procesar observaciones ---
    let notas = document.getElementById('comanda-notas').value.trim();
    let platoFinal = notas ? `${ingrediente.nombre} <br><small style="color:var(--gold);">Nota: ${notas}</small>` : ingrediente.nombre;
    document.getElementById('comanda-notas').value = ''; // Limpiar

    let horaStr = horaActual + ':' + (minActual < 10 ? '0' : '') + minActual;

    baseDatos.comandas.push({ hora: horaStr, cliente: clienteNombre, mesero: meseroAsignado, comida: comida, plato: platoFinal, tipo: tipoRegistro, valor: valorCobrado });
    guardarDatos();
    mostrarToast('Comanda registrada correctamente');
    actualizarVistas();
}

function renderizarComandas() {
    const tbody = document.getElementById('tabla-comandas');
    const selectPlato = document.getElementById('comanda-plato');
    const selectMesero = document.getElementById('comanda-mesero');
    tbody.innerHTML = '';
    
    // Llenar Platos si está vacío
    if (selectPlato.options.length === 0) {
        baseDatos.inventario.forEach(i => { selectPlato.innerHTML += `<option value="${i.id}">${i.nombre}</option>`; });
    }

    // Llenar Meseros dinámicamente desde baseDatos.personal
    selectMesero.innerHTML = '';
    let hayMeseros = false;
    baseDatos.personal.forEach(p => {
        if (p.rol === 'Mesero' && p.estado === 'Activo') {
            selectMesero.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`;
            hayMeseros = true;
        }
    });
    if (!hayMeseros) {
        selectMesero.innerHTML = `<option value="">No hay meseros activos</option>`;
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
        let isCritical = item.stock < 5;
        let badgeEstado = isCritical ? '<span class="badge danger">⚠️ STOP - CRÍTICO</span>' : '<span class="badge success">✓ Disponible</span>';
        let stockStyle = isCritical ? 'color: var(--danger); text-shadow: 0 0 10px rgba(248,113,113,0.5);' : 'color: var(--gold);';
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${item.nombre}</td>
                <td style="font-size: 1.4rem; font-weight: 800; ${stockStyle}">${item.stock}</td>
                <td style="color: var(--text-secondary);">${item.unidad}</td>
                <td style="font-family: monospace; font-size: 1.1rem;">$${item.costo.toLocaleString()}</td>
                <td>${badgeEstado}</td>
                <td>
                    <button class="btn-sm" onclick="abrirModalStock(${index}, '${item.nombre}')">
                        <span style="color:var(--success); font-weight:bold;">+</span> Agregar
                    </button>
                </td>
            </tr>`;
    });
}

function abrirModalStock(index, nombre) {
    // Crear un modal estilo SweetAlert local
    const modalHTML = `
        <div id="custom-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);">
            <div style="background:var(--bg-card); padding:30px; border-radius:var(--radius); border:1px solid rgba(212,168,83,0.3); width:350px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: modalPop 0.3s forwards;">
                <h3 style="margin-top:0; color:var(--text-primary); font-size:1.2rem;">Actualizar Stock</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:20px;">¿Cuántas unidades deseas agregar de <strong style="color:var(--gold)">${nombre}</strong>?</p>
                <input type="number" id="input-modal-stock" class="search-bar" style="width:100%; margin-bottom:20px; text-align:center; font-size:1.5rem; border-radius:8px;" placeholder="Ej: 10" autofocus>
                <div style="display:flex; gap:10px;">
                    <button class="btn-sm" style="flex:1; justify-content:center; padding:12px;" onclick="document.getElementById('custom-modal').remove()">Cancelar</button>
                    <button class="btn" style="flex:1; padding:12px;" onclick="confirmarStock(${index})">Guardar</button>
                </div>
            </div>
        </div>
        <style>@keyframes modalPop { to { transform: scale(1); } }</style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => document.getElementById('input-modal-stock').focus(), 100);
}

function confirmarStock(index) {
    let cantidadStr = document.getElementById('input-modal-stock').value;
    if (cantidadStr.trim() === "") return;
    
    let cantidad = parseInt(cantidadStr);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast('Por favor, ingresa un número válido mayor a 0', 'error');
        return;
    }

    baseDatos.inventario[index].stock += cantidad;
    guardarDatos();
    document.getElementById('custom-modal').remove();
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


/* ==========================================================================
   7. MÓDULO GESTIÓN DE PERSONAL Y ROLES
   ========================================================================== */
function registrarPersonal() {
    let nombre = document.getElementById('personal-nombre').value;
    let rol = document.getElementById('personal-rol').value;

    if (campoVacio(nombre)) {
        mostrarToast('Por favor, ingresa el nombre del empleado', 'error');
        return;
    }

    let nuevoId = baseDatos.personal.length > 0 ? Math.max(...baseDatos.personal.map(p => p.id)) + 1 : 1;
    
    // Generar usuario automático a partir del primer nombre y una clave genérica
    let usuarioGenerado = nombre.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + nuevoId;
    let claveGenerica = "123456";

    baseDatos.personal.push({ 
        id: nuevoId, 
        nombre: nombre, 
        usuario: usuarioGenerado, 
        clave: claveGenerica, 
        rol: rol, 
        estado: "Activo" 
    });
    
    guardarDatos();
    document.getElementById('personal-nombre').value = '';
    mostrarToast(`Empleado registrado. Usuario: ${usuarioGenerado} | Clave: 123456`);
    actualizarVistas();
}

function eliminarPersonal(index) {
    if (confirm("¿Estás seguro de que deseas dar de baja a este empleado?")) {
        baseDatos.personal[index].estado = "Inactivo";
        guardarDatos();
        mostrarToast('Empleado dado de baja');
        actualizarVistas();
    }
}

function renderizarPersonal() {
    const tbody = document.getElementById('tabla-personal');
    if (!tbody) return; // Por si el HTML aún no está listo
    tbody.innerHTML = '';

    baseDatos.personal.forEach((p, index) => {
        let badgeRol = '';
        if (p.rol === 'Administrador') badgeRol = '<span class="badge danger">Admin</span>';
        else if (p.rol === 'Recepcionista') badgeRol = '<span class="badge gold">Recepción</span>';
        else badgeRol = '<span class="badge success">Mesero</span>';

        let estadoColor = p.estado === 'Activo' ? 'var(--success)' : 'var(--text-secondary)';
        
        let botonAccion = p.estado === 'Activo' 
            ? `<button class="btn-sm" style="color:var(--danger); border-color:var(--danger)" onclick="eliminarPersonal(${index})">❌ Dar de Baja</button>`
            : `<span style="color:var(--text-secondary)">Inactivo</span>`;

        tbody.innerHTML += `
            <tr style="opacity: ${p.estado === 'Activo' ? '1' : '0.5'}">
                <td style="font-weight:bold;">${p.nombre}<br><small style="color:var(--text-secondary); font-weight:normal;">User: ${p.usuario || 'N/A'}</small></td>
                <td>${badgeRol}</td>
                <td style="color:${estadoColor}; font-weight:600;">${p.estado}</td>
                <td>${botonAccion}</td>
            </tr>`;
    });
}


