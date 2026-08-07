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
        { nombre: "Juan Pérez", documento: "102030", habitacion: "101", plan: 3, comidasHoy: 0 },
        { nombre: "María Gómez", documento: "405060", habitacion: "102", plan: 1, comidasHoy: 0 }
    ],
    inventario: [
        { nombre: "Lomo de Res", stock: 15, unidad: "Porción", costo: 12000 },
        { nombre: "Salmón", stock: 3, unidad: "Porción", costo: 18000 }, // Stock crítico
        { nombre: "Pechuga de Pollo", stock: 20, unidad: "Porción", costo: 6000 },
        { nombre: "Huevos", stock: 40, unidad: "Und", costo: 600 }
    ],
    comandas: [],
    reservas: [],
    precioEstandar: 25000,
    personal: [
        { nombre: "Admin_User", usuario: "admin", clave: "123456", rol: "Administrador", estado: "Activo" },
        { nombre: "Recepción María", usuario: "recepcion", clave: "123456", rol: "Recepcionista", estado: "Activo" },
        { nombre: "Mesero Carlos", usuario: "mesero", clave: "123456", rol: "Mesero", estado: "Activo" }
    ]
};

function cifrarDatos(obj) {
    try {
        // Encriptación Base64 100% segura para UTF-8 y tildes
        let str = JSON.stringify(obj);
        return btoa(encodeURIComponent(str));
    } catch(e) {
        return JSON.stringify(obj);
    }
}

function descifrarDatos(str) {
    try {
        if (str.startsWith('{') || str.startsWith('[')) return JSON.parse(str);
        
        let decodedStr = "";
        try {
            // Intento 1: Nuevo formato seguro
            decodedStr = decodeURIComponent(atob(str));
        } catch(e1) {
            // Intento 2: Formato antiguo (fallback por si quedó guardado con la versión anterior)
            decodedStr = decodeURIComponent(escape(atob(str)));
        }

        // Fix de seguridad para limpiar caracteres raros si se corrompieron previamente
        decodedStr = decodedStr.replace(/Ã©/g, 'é')
                               .replace(/Ã³/g, 'ó')
                               .replace(/Ã\xAD/g, 'í')
                               .replace(/Ã¡/g, 'á')
                               .replace(/Ã±/g, 'ñ');

        return JSON.parse(decodedStr);
    } catch(e) {
        console.error("Error de seguridad al leer la DB", e);
        return null;
    }
}

function guardarDatos() {
    localStorage.setItem('hotelAndino_DB', cifrarDatos(baseDatos));
}

function cargarDatos() {
    let datosGuardados = localStorage.getItem('hotelAndino_DB');
    if (datosGuardados) {
        let datosExtraidos = descifrarDatos(datosGuardados);
        if (datosExtraidos) baseDatos = datosExtraidos;

        // Migraciones para estructura antigua
        if (!baseDatos.reservas) {
            baseDatos.reservas = [];
            guardarDatos();
        }
        if (!baseDatos.personal) {
            baseDatos.personal = [
                { nombre: "Admin_User", usuario: "admin", clave: "123456", rol: "Administrador", estado: "Activo" },
                { nombre: "Recepción María", usuario: "recepcion", clave: "123456", rol: "Recepcionista", estado: "Activo" },
                { nombre: "Mesero Carlos", usuario: "mesero", clave: "123456", rol: "Mesero", estado: "Activo" }
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
                    else p.usuario = p.nombre.split(' ')[0].toLowerCase() + (p.documento || Math.floor(Math.random()*1000));
                    
                    p.clave = '123456';
                    necesitaGuardar = true;
                }
            });
            if (necesitaGuardar) guardarDatos();
        }

        if (!baseDatos.historialHuespedes) {
            baseDatos.historialHuespedes = [];
            guardarDatos();
        }

        // Migración: asegurar que los huéspedes tengan fechas para el calendario
        let necesitaGuardarFechas = false;
        let hoyFormat = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        let mananaFormat = new Date(Date.now() + 86400000 - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        baseDatos.huespedes.forEach(h => {
            if (!h.ingreso || !h.salida) {
                h.ingreso = hoyFormat;
                h.salida = mananaFormat;
                necesitaGuardarFechas = true;
            }
        });
        if (necesitaGuardarFechas) guardarDatos();
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
    renderizarCalendarioReservas();

    // NUEVO: Control de Accesos por Roles (RBAC)
    const rolActual = sessionStorage.getItem('hotelAndino_userRol');
    
    // Reset display (mostrar todo por defecto para admin)
    document.getElementById('nav-huespedes').style.display = 'flex';
    document.getElementById('nav-reservas').style.display = 'flex';
    document.getElementById('nav-comandas').style.display = 'flex';
    document.getElementById('nav-inventario').style.display = 'flex';
    document.getElementById('nav-caja').style.display = 'flex';
    document.getElementById('nav-personal').style.display = 'flex';

    if (rolActual === 'Mesero') {
        document.getElementById('nav-huespedes').style.display = 'none';
        document.getElementById('nav-reservas').style.display = 'none';
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

    // V6: Validar orden y fechas pasadas
    let hoyStr = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (ingreso < hoyStr) {
        mostrarToast('⚠️ La fecha de ingreso no puede ser en el pasado', 'error'); return;
    }

    let dIngreso = new Date(ingreso);
    let dSalida = new Date(salida);
    if (dSalida <= dIngreso) {
        mostrarToast('⚠️ La fecha de salida debe ser POSTERIOR a la de ingreso', 'error'); return;
    }

    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1); // Capitalizar
    baseDatos.huespedes.push({
        nombre, documento: doc, correo, ingreso, salida, habitacion: hab, plan, comidasHoy: 0
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
            <td><button class="btn" style="background: var(--danger); padding: 5px 10px; font-size: 0.8rem;" onclick="realizarCheckout('${h.documento}')">Check-out</button></td>
        `;
        tbody.appendChild(fila);
        selectComanda.innerHTML += `<option value="${h.documento}">${h.nombre} (Hab. ${h.habitacion})</option>`;
    });

    // Rellenar historial
    const tbodyHistorial = document.getElementById('tabla-historial-huespedes');
    tbodyHistorial.innerHTML = '';
    
    if (!baseDatos.historialHuespedes) baseDatos.historialHuespedes = [];
    
    baseDatos.historialHuespedes.forEach(h => {
        let fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${h.nombre}</td>
            <td>${h.documento}</td>
            <td>Hab. ${h.habitacion}</td>
            <td>${h.ingreso || '--'}</td>
            <td>${h.salida || '--'}</td>
            <td><span class="badge" style="background:var(--danger); opacity:0.8; color:white;">Check-out</span></td>
        `;
        tbodyHistorial.appendChild(fila);
    });
}

function realizarCheckout(documentoHuesped) {
    if (!confirm('¿Estás seguro de realizar el Check-out de este huésped?')) return;
    
    let index = baseDatos.huespedes.findIndex(h => h.documento === documentoHuesped);
    if (index > -1) {
        let huesped = baseDatos.huespedes[index];
        // Quitar de activos y mandar a historial
        baseDatos.huespedes.splice(index, 1);
        if (!baseDatos.historialHuespedes) baseDatos.historialHuespedes = [];
        baseDatos.historialHuespedes.push(huesped);
        
        guardarDatos();
        mostrarToast('✅ Check-out realizado. Huésped movido al historial.');
        actualizarVistas();
    }
}

/* ==========================================================================
   3.5 MÓDULO RESERVAS
   ========================================================================== */
let mesActualReservas = new Date().getMonth();
let anioActualReservas = new Date().getFullYear();

function cambiarMesReservas(delta) {
    mesActualReservas += delta;
    if (mesActualReservas > 11) {
        mesActualReservas = 0;
        anioActualReservas++;
    } else if (mesActualReservas < 0) {
        mesActualReservas = 11;
        anioActualReservas--;
    }
    renderizarCalendarioReservas();
}

function registrarReserva() {
    let nombre = sanitizar(document.getElementById('reserva-nombre').value);
    let doc = document.getElementById('reserva-documento').value;
    let ingreso = document.getElementById('reserva-ingreso').value;
    let salida = document.getElementById('reserva-salida').value;
    let hab = document.getElementById('reserva-habitacion').value;
    let plan = parseInt(document.getElementById('reserva-plan').value);

    if (campoVacio(nombre) || campoVacio(doc) || campoVacio(ingreso) || campoVacio(salida) || campoVacio(hab)) {
        mostrarToast('⚠️ Completa todos los campos obligatorios', 'error'); return;
    }
    if (!/^\d+$/.test(doc)) {
        mostrarToast('⚠️ El documento solo puede contener números', 'error'); return;
    }

    let hoyStr = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (ingreso < hoyStr) {
        mostrarToast('⚠️ La fecha de check-in no puede ser en el pasado', 'error'); return;
    }

    let dIngreso = new Date(ingreso);
    let dSalida = new Date(salida);
    if (dSalida <= dIngreso) {
        mostrarToast('⚠️ La fecha de check-out debe ser posterior al check-in', 'error'); return;
    }

    // OVERBOOKING VALIDATION
    let choca = false;
    
    // Check against active huespedes
    let huespedActivo = baseDatos.huespedes.find(h => h.habitacion === hab.trim());
    if (huespedActivo) {
        // If the current guest's checkout is AFTER the new reservation's checkin, it's a crash
        if (huespedActivo.salida > ingreso) {
            choca = true;
        }
    }

    // Check against other reservations for the same room
    if (!choca) {
        choca = baseDatos.reservas.some(r => {
            if (r.habitacion === hab.trim()) {
                // If new check-in is before existing checkout AND new check-out is after existing check-in
                return (ingreso < r.salida && salida > r.ingreso);
            }
            return false;
        });
    }

    if (choca) {
        mostrarToast(`⚠️ La habitación ${hab} ya está ocupada o reservada en esas fechas`, 'error'); return;
    }

    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    let idReserva = "RES-" + Date.now();
    baseDatos.reservas.push({
        id: idReserva,
        nombre, documento: doc, ingreso, salida, habitacion: hab, plan
    });
    
    guardarDatos();
    mostrarToast('✅ Reserva agendada exitosamente');
    document.getElementById('reserva-nombre').value = '';
    document.getElementById('reserva-documento').value = '';
    document.getElementById('reserva-habitacion').value = '';
    document.getElementById('reserva-ingreso').value = '';
    document.getElementById('reserva-salida').value = '';
    actualizarVistas();
}

function renderizarCalendarioReservas() {
    const grid = document.getElementById('calendario-grid');
    const labelMes = document.getElementById('calendario-mes-actual');
    if (!grid || !labelMes) return;

    grid.innerHTML = '';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    labelMes.textContent = `${meses[mesActualReservas]} ${anioActualReservas}`;

    let primerDia = new Date(anioActualReservas, mesActualReservas, 1).getDay();
    let diasEnMes = new Date(anioActualReservas, mesActualReservas + 1, 0).getDate();

    for (let i = 0; i < primerDia; i++) {
        let div = document.createElement('div');
        div.style.background = 'transparent';
        grid.appendChild(div);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        let div = document.createElement('div');
        div.style.background = 'rgba(255,255,255,0.03)';
        div.style.border = '1px solid rgba(255,255,255,0.05)';
        div.style.borderRadius = '8px';
        div.style.padding = '10px';
        div.style.minHeight = '60px';
        div.style.cursor = 'pointer';
        div.style.position = 'relative';
        div.style.transition = 'all 0.3s';
        
        let diaStr = `${anioActualReservas}-${(mesActualReservas+1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        
        // Contar reservas (pendientes) y huéspedes (hechas) que cruzan este día
        let reservasPendientes = baseDatos.reservas.filter(r => diaStr >= r.ingreso && diaStr < r.salida).map(r => ({...r, tipo: 'pendiente'}));
        let reservasHechas = baseDatos.huespedes.filter(h => diaStr >= h.ingreso && diaStr < h.salida).map(h => ({...h, tipo: 'hecha'}));
        
        let todasLasOcupaciones = [...reservasPendientes, ...reservasHechas];
        
        div.innerHTML = `<div style="color: var(--gold); font-weight: bold; margin-bottom: 5px;">${dia}</div>`;
        
        if (todasLasOcupaciones.length > 0) {
            div.innerHTML += `<div style="background: var(--gold); color: black; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">${todasLasOcupaciones.length}</div>`;
        }

        div.onmouseover = () => div.style.background = 'rgba(212, 168, 83, 0.1)';
        div.onmouseout = () => div.style.background = 'rgba(255,255,255,0.03)';
        div.onclick = () => verDetalleReserva(diaStr, todasLasOcupaciones);

        grid.appendChild(div);
    }
}

function verDetalleReserva(fecha, reservas) {
    document.getElementById('modal-reservas-dia').style.display = 'flex';
    document.getElementById('modal-reservas-titulo').textContent = `Ocupación para el ${fecha}`;
    let lista = document.getElementById('modal-reservas-lista');
    lista.innerHTML = '';

    if (reservas.length === 0) {
        lista.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No hay ocupación para este día.</p>';
        return;
    }

    reservas.forEach(r => {
        let esHecha = r.tipo === 'hecha';
        let badge = esHecha ? '<span class="badge" style="background:var(--success); color:black; font-size:0.7rem;">Check-in (Huésped)</span>' : '<span class="badge" style="background:var(--gold); color:black; font-size:0.7rem;">Reserva Pendiente</span>';
        
        let botones = esHecha ? 
            `<button class="btn-sm" onclick="document.getElementById('modal-reservas-dia').style.display='none'; cambiarSeccion('huespedes');" style="background: var(--gold); color: black;">Ver Huésped</button>` :
            `<button class="btn-sm" onclick="hacerCheckinReserva('${r.id}')" style="background: var(--success); color: black;">Hacer Check-in</button>
             <button class="btn-sm" onclick="cancelarReserva('${r.id}')" style="background: var(--danger); border-color: var(--danger); color: white;">Cancelar</button>`;

        lista.innerHTML += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--gold);">${r.nombre} ${badge}</h4>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Hab: ${r.habitacion} | Doc: ${r.documento}</p>
                    <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Del ${r.ingreso} al ${r.salida}</p>
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    ${botones}
                </div>
            </div>
        `;
    });
}

function cancelarReserva(id) {
    if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
        baseDatos.reservas = baseDatos.reservas.filter(r => r.id !== id);
        guardarDatos();
        mostrarToast('Reserva cancelada');
        document.getElementById('modal-reservas-dia').style.display = 'none';
        actualizarVistas();
    }
}

function hacerCheckinReserva(id) {
    let reserva = baseDatos.reservas.find(r => r.id === id);
    if (!reserva) return;

    let hoyStr = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (hoyStr < reserva.ingreso) {
        if (!confirm("Esta reserva empieza en el futuro. ¿Hacer Check-in anticipado de todas formas?")) return;
    }

    // Mover a huéspedes
    baseDatos.huespedes.push({
        nombre: reserva.nombre,
        documento: reserva.documento,
        correo: "", // No lo guardamos en reserva por ahora
        ingreso: reserva.ingreso,
        salida: reserva.salida,
        habitacion: reserva.habitacion,
        plan: reserva.plan,
        comidasHoy: 0
    });

    // Eliminar de reservas
    baseDatos.reservas = baseDatos.reservas.filter(r => r.id !== id);
    guardarDatos();
    mostrarToast('✅ Check-in realizado. Huésped transferido.');
    document.getElementById('modal-reservas-dia').style.display = 'none';
    cambiarSeccion('huespedes');
}

/* ==========================================================================
   4. MÃ“DULO COMANDAS Y VALIDACIÃ“N
   ========================================================================== */
function toggleTipoCliente() {
    const esExterno = document.getElementById('comanda-tipo').value === 'externo';
    document.getElementById('grupo-huesped').style.display = esExterno ? 'none' : 'block';
    document.getElementById('grupo-externo').style.display = esExterno ? 'block' : 'none';
}

function calcularTotalComanda() {
    let nombreIngrediente = document.getElementById('comanda-plato').value;
    let cantidadInput = document.getElementById('comanda-cantidad');
    let cantidad = cantidadInput ? (parseInt(cantidadInput.value) || 1) : 1;
    let ingrediente = baseDatos.inventario.find(i => i.nombre === nombreIngrediente);
    
    let total = 0;
    if (ingrediente) {
        total = ingrediente.costo * cantidad;
    }
    let visual = document.getElementById('comanda-total-visual');
    if (visual) visual.innerText = `$${total.toLocaleString()}`;
}

function registrarComanda() {
    let tipoCliente = document.getElementById('comanda-tipo').value;
    let documentoHuesped = document.getElementById('comanda-huesped').value;
    let comida = document.getElementById('comanda-comida').value;
    let nombreIngrediente = document.getElementById('comanda-plato').value;
    let cantidadInput = document.getElementById('comanda-cantidad');
    let cantidad = cantidadInput ? (parseInt(cantidadInput.value) || 1) : 1;
    let meseroAsignado = document.getElementById('comanda-mesero').value;
    
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

    let ingrediente = baseDatos.inventario.find(i => i.nombre === nombreIngrediente);
    if (!ingrediente || ingrediente.stock < cantidad) {
        mostrarToast(`Stock insuficiente. Stock actual: ${ingrediente ? ingrediente.stock : 0}`, 'error'); return;
    }

    if (tipoCliente === 'huesped') {
        if (!documentoHuesped) { mostrarToast('Selecciona un huésped', 'error'); return; }

        let huesped = baseDatos.huespedes.find(h => h.documento === documentoHuesped);
        
        let comidasPermitidas = [];
        if (huesped.plan === 3) comidasPermitidas = ['Desayuno', 'Almuerzo', 'Cena'];
        if (huesped.plan === 2) comidasPermitidas = ['Desayuno', 'Cena'];
        if (huesped.plan === 1) comidasPermitidas = ['Desayuno'];

        if (!comidasPermitidas.includes(comida)) {
            mostrarToast(`El plan de este huésped no incluye ${comida} de cortesía. Debe pagar como Externo.`, 'error');
            return;
        }

        if (!huesped.consumosHoy) huesped.consumosHoy = [];
        
        if (huesped.consumosHoy.includes(comida)) {
            mostrarToast(`El huésped ya reclamó su ${comida} de cortesía hoy. Debe pagar como Externo.`, 'error');
            return;
        }

        huesped.consumosHoy.push(comida); // Registrar qué comida consumió
        huesped.comidasHoy++;
        
        clienteNombre = huesped.nombre;
        tipoRegistro = 'Cortesía (Plan)';
        valorCobrado = 0;
    } else {
        clienteNombre = document.getElementById('comanda-externo').value;
        if (!clienteNombre) { mostrarToast('Ingresa el nombre del externo', 'error'); return; }
        tipoRegistro = 'Cobro';
        valorCobrado = ingrediente.costo * cantidad;
        document.getElementById('comanda-externo').value = '';
    }

    ingrediente.stock -= cantidad;
    
    // --- NUEVO: Procesar observaciones ---
    let notas = document.getElementById('comanda-notas').value.trim();
    let platoFinal = notas ? `${ingrediente.nombre} <br><small style="color:var(--gold);">Nota: ${notas}</small>` : ingrediente.nombre;
    document.getElementById('comanda-notas').value = ''; // Limpiar

    let horaStr = horaActual + ':' + (minActual < 10 ? '0' : '') + minActual;

    baseDatos.comandas.push({ 
        hora: horaStr, 
        cliente: clienteNombre, 
        mesero: meseroAsignado, 
        comida: comida, 
        plato: platoFinal, 
        cantidad: cantidad,
        tipo: tipoRegistro, 
        valor: valorCobrado 
    });
    
    guardarDatos();
    mostrarToast('✅ Comanda registrada correctamente');
    if (cantidadInput) cantidadInput.value = 1;
    calcularTotalComanda();
    actualizarVistas();
}

function renderizarComandas() {
    const tbody = document.getElementById('tabla-comandas');
    const selectPlato = document.getElementById('comanda-plato');
    const selectMesero = document.getElementById('comanda-mesero');
    if(!tbody || !selectPlato || !selectMesero) return;
    
    tbody.innerHTML = '';
    
    // Llenar Platos si está vacío
    if (selectPlato.options.length === 0) {
        baseDatos.inventario.forEach(i => { selectPlato.innerHTML += `<option value="${i.nombre}">${i.nombre}</option>`; });
        setTimeout(calcularTotalComanda, 100);
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
        let totalStr = c.valor > 0 ? `$${c.valor.toLocaleString()}` : '--';
        let cantStr = c.cantidad || 1;
        tbody.innerHTML += `<tr>
            <td>${c.hora}</td>
            <td>${c.cliente}</td>
            <td>${c.mesero || 'No asignado'}</td>
            <td>${c.comida}</td>
            <td>${c.plato}</td>
            <td>${cantStr}</td>
            <td style="color:var(--gold); font-weight:bold;">${totalStr}</td>
            <td><span class="badge ${badgeType}">${c.tipo}</span></td>
        </tr>`;
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
    let nombre = sanitizar(document.getElementById('personal-nombre').value);
    let rol = document.getElementById('personal-rol').value;

    if (campoVacio(nombre)) { mostrarToast('Ingresa un nombre', 'error'); return; }

    let usuario = "";
    if (rol === 'Administrador') usuario = 'admin_' + nombre.split(' ')[0].toLowerCase();
    else if (rol === 'Recepcionista') usuario = 'recepcion_' + nombre.split(' ')[0].toLowerCase();
    else usuario = 'mesero_' + nombre.split(' ')[0].toLowerCase();

    baseDatos.personal.push({
        nombre, usuario, clave: '123456', rol, estado: "Activo"
    });
    
    guardarDatos();
    mostrarToast('✅ Empleado registrado. Usr: ' + usuario);
    document.getElementById('personal-nombre').value = '';
    actualizarVistas();
}

function eliminarPersonal(usuarioEmp) {
    if (confirm("¿Estás seguro de que deseas dar de baja a este empleado?")) {
        let emp = baseDatos.personal.find(p => p.usuario === usuarioEmp);
        if (emp) {
            emp.estado = "Inactivo";
            guardarDatos();
            mostrarToast('Empleado dado de baja');
            actualizarVistas();
        }
    }
}

function renderizarPersonal() {
    const tbody = document.getElementById('tabla-personal');
    if (!tbody) return; 
    tbody.innerHTML = '';

    baseDatos.personal.forEach(p => {
        let badgeRol = '';
        if (p.rol === 'Administrador') badgeRol = '<span class="badge danger">Admin</span>';
        else if (p.rol === 'Recepcionista') badgeRol = '<span class="badge gold">Recepción</span>';
        else badgeRol = '<span class="badge success">Mesero</span>';

        let estadoColor = p.estado === 'Activo' ? 'var(--success)' : 'var(--text-secondary)';
        
        let botonAccion = p.estado === 'Activo' 
            ? `<button class="btn-sm" style="color:var(--danger); border-color:var(--danger)" onclick="eliminarPersonal('${p.usuario}')">❌ Dar de Baja</button>`
            : `<span style="color:var(--text-secondary)">Inactivo</span>`;

        tbody.innerHTML += `
            <tr style="opacity: ${p.estado === 'Activo' ? '1' : '0.5'}">
                <td style="font-weight:bold;">${p.nombre}<br><small style="color:var(--text-secondary); font-weight:normal;">User: ${p.usuario}</small></td>
                <td>${badgeRol}</td>
                <td style="color:${estadoColor}; font-weight:600;">${p.estado}</td>
                <td>${botonAccion}</td>
            </tr>`;
    });
}
