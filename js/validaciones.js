/**
 * ==========================================================================
 * HOTEL ANDINO S.A.S. - VALIDACIONES.JS
 * 
 * Contiene todas las funciones de validación de datos del sistema.
 * Se encarga de verificar que la información ingresada sea correcta
 * antes de guardarla en la base de datos.
 * ==========================================================================
 */

// --- VALIDACION 1: Verificar que el campo no esté vacío ---
function campoVacio(valor) {
    return !valor || valor.trim() === '';
}

// --- VALIDACION 2: Validar que solo sean letras (para nombres) ---
function soloLetras(texto) {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(texto.trim());
}

// --- VALIDACION 3: Validar que solo sean números (para documentos y habitaciones) ---
function soloNumeros(texto) {
    return /^\d+$/.test(texto.trim());
}

// --- VALIDACION 4: Sanitizar inputs (Prevenir XSS e Inyecciones SQL) ---
function sanitizar(texto) {
    if (!texto) return '';
    let limpio = texto.replace(/[<>"'%;()&+]/g, '').trim();
    // Simulador de Firewall Anti-SQL Injection (eliminar palabras clave)
    limpio = limpio.replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|FROM|WHERE)\b/gi, '');
    return limpio.trim();
}

// --- VALIDACION 5: Verificar si un documento ya está registrado (evitar duplicados) ---
function documentoExiste(doc) {
    return baseDatos.huespedes.some(h => h.documento === doc.trim());
}

// --- VALIDACION 6: Validar longitud mínima de un campo ---
function longitudMinima(texto, min) {
    return texto.trim().length >= min;
}

// --- VALIDACION 7: Validar que un número sea positivo y mayor a cero ---
function numeroPositivo(valor) {
    const num = parseInt(valor);
    return !isNaN(num) && num > 0;
}

// --- VALIDACION 8: Verificar stock disponible antes de registrar comanda ---
function hayStockDisponible(ingredienteId) {
    const item = baseDatos.inventario.find(i => i.id === ingredienteId);
    return item && item.stock > 0;
}

// --- VALIDACION 9: Verificar que el huésped no haya superado su plan ---
function huespedPuedeComer(idHuesped) {
    const huesped = baseDatos.huespedes.find(h => h.id === idHuesped);
    if (!huesped) return false;
    return huesped.comidasHoy < huesped.plan;
}

// --- VALIDACION 10: Validar formato básico de texto (sin espacios al inicio/fin) ---
function formatoTexto(texto) {
    return texto === texto.trim() && texto.length > 0;
}
