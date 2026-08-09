/**
 * ==========================================================================
 * HOTEL ANDINO S.A.S. - VALIDACIONES.JS
 * 
 * @author walterpinto00
 * @version 2.0.0
 * @description
 * Módulo de validación y saneamiento de datos del sistema.
 * Se encarga de verificar que la información ingresada por el usuario
 * sea correcta, segura y consistente antes de persistirla en la base
 * de datos cifrada (localStorage).
 *
 * Funciones incluidas:
 *  - campoVacio()        : Detecta campos en blanco
 *  - soloLetras()        : Valida nombres propios
 *  - soloNumeros()       : Valida documentos y habitaciones
 *  - sanitizar()         : Bloquea XSS e inyección SQL
 *  - documentoExiste()   : Previene registros duplicados
 *  - longitudMinima()    : Valida longitud mínima de un campo
 *  - numeroPositivo()    : Valida números mayores a cero
 *  - hayStockDisponible(): Verifica inventario antes de servir
 *  - huespedPuedeComer() : Controla el plan alimenticio del huésped
 *  - formatoTexto()      : Verifica formato básico de texto
 * ==========================================================================
 */

/**
 * Verifica si un campo de texto está vacío o solo contiene espacios.
 * @param {string} valor - El valor del campo a verificar.
 * @returns {boolean} true si el campo está vacío, false si tiene contenido.
 */
function campoVacio(valor) {
    return !valor || valor.trim() === '';
}


/**
 * Valida que un texto contenga únicamente letras (incluyendo tildes y ñ).
 * Útil para validar nombres completos de huéspedes y personal.
 * @param {string} texto - El texto a validar.
 * @returns {boolean} true si el texto contiene solo letras, false si tiene números o símbolos.
 */
function soloLetras(texto) {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(texto.trim());
}


/**
 * Valida que un texto contenga únicamente dígitos (0-9).
 * Se usa para validar números de documento de identidad y números de habitación.
 * @param {string} texto - El texto a validar.
 * @returns {boolean} true si el texto es puramente numérico.
 */
function soloNumeros(texto) {
    return /^\d+$/.test(texto.trim());
}


/**
 * Sanitiza un texto para prevenir ataques XSS e inyección SQL.
 * Elimina caracteres especiales peligrosos y palabras clave de SQL.
 * @param {string} texto - El texto crudo ingresado por el usuario.
 * @returns {string} Texto limpio y seguro para almacenar.
 */
function sanitizar(texto) {
    if (!texto) return '';
    // Eliminar caracteres especiales que se usan en ataques XSS
    let limpio = texto.replace(/[<>"'%;()&+]/g, '').trim();
    // Eliminar palabras clave de SQL para prevenir inyección
    limpio = limpio.replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|FROM|WHERE)\b/gi, '');
    return limpio.trim();
}


/**
 * Verifica si un número de documento ya existe en el registro de huéspedes activos.
 * Previene el registro de huéspedes duplicados en el sistema.
 * @param {string} doc - El número de documento a buscar.
 * @returns {boolean} true si el documento ya está registrado.
 */
function documentoExiste(doc) {
    return baseDatos.huespedes.some(h => h.documento === doc.trim());
}


/**
 * Valida que un campo de texto tenga al menos una longitud mínima de caracteres.
 * @param {string} texto - El texto a verificar.
 * @param {number} min - La cantidad mínima de caracteres requeridos.
 * @returns {boolean} true si el texto cumple la longitud mínima.
 */
function longitudMinima(texto, min) {
    return texto.trim().length >= min;
}


/**
 * Verifica que un valor numérico sea válido y mayor a cero.
 * Se usa para validar cantidades en comandas e inventario.
 * @param {string|number} valor - El valor a validar.
 * @returns {boolean} true si el valor es un número positivo.
 */
function numeroPositivo(valor) {
    const num = parseInt(valor);
    return !isNaN(num) && num > 0;
}


/**
 * Verifica si hay stock disponible en el inventario para un ingrediente.
 * Previene registrar comandas con ingredientes agotados.
 * @param {string} ingredienteId - El identificador del ingrediente en inventario.
 * @returns {boolean} true si el stock es mayor a 0.
 */
function hayStockDisponible(ingredienteId) {
    const item = baseDatos.inventario.find(i => i.id === ingredienteId);
    return item && item.stock > 0;
}


/**
 * Verifica si un huésped tiene comidas disponibles según su plan alimenticio.
 * Controla que no se excedan las comidas incluidas en el plan (0, 1, 2 o 3 diarias).
 * @param {string} idHuesped - El identificador del huésped.
 * @returns {boolean} true si el huésped aún tiene comidas disponibles hoy.
 */
function huespedPuedeComer(idHuesped) {
    const huesped = baseDatos.huespedes.find(h => h.id === idHuesped);
    if (!huesped) return false;
    return huesped.comidasHoy < huesped.plan;
}


/**
 * Valida el formato básico de un texto: sin espacios al inicio ni al final
 * y con al menos un carácter de contenido.
 * @param {string} texto - El texto a verificar.
 * @returns {boolean} true si el texto tiene formato correcto.
 */
function formatoTexto(texto) {
    return texto === texto.trim() && texto.length > 0;
}
