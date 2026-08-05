/**
 * ==========================================================================
 * HOTEL ANDINO S.A.S. - SEGURIDAD.JS
 * 
 * Contiene toda la lógica de seguridad del sistema:
 * - Control de acceso con login
 * - Bloqueo por intentos fallidos
 * - Cierre de sesión automático por inactividad
 * - Integración con Google reCAPTCHA v2
 * ==========================================================================
 */

// ── VARIABLES DE SEGURIDAD ──────────────────────────────────────────────────

let intentosFallidos = 0;       // Contador de intentos fallidos de login
const MAX_INTENTOS = 3;         // Máximo de intentos antes del bloqueo
let bloqueadoHasta = null;      // Fecha/hora hasta la que el sistema está bloqueado

let timerSesion = null;                     // Timer de inactividad
const TIEMPO_SESION = 20 * 60 * 1000;      // 20 minutos en milisegundos

// ── FUNCIONES DE SESIÓN ─────────────────────────────────────────────────────

/**
 * Reinicia el contador de inactividad.
 * Se llama en cada interacción del usuario (clic o tecla).
 */
function reiniciarTimerSesion() {
    clearTimeout(timerSesion);
    timerSesion = setTimeout(() => {
        if (sessionStorage.getItem('hotelAndino_logged') === 'true') {
            sessionStorage.removeItem('hotelAndino_logged');
            mostrarToast('Sesión cerrada por inactividad', 'error');
            setTimeout(() => location.reload(), 1500);
        }
    }, TIEMPO_SESION);
}

// Escuchar interacciones del usuario para reiniciar el timer
document.addEventListener('click', reiniciarTimerSesion);
document.addEventListener('keypress', reiniciarTimerSesion);

// ── FUNCIONES DEL LOGIN ─────────────────────────────────────────────────────

/**
 * Muestra u oculta la contraseña en el campo del login
 */
function togglePassword() {
    const input = document.getElementById('login-password');
    const btn = document.getElementById('btn-toggle-pw');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

/**
 * Valida las credenciales del usuario y controla el acceso al sistema.
 * Incluye: bloqueo por intentos, sanitización, reCAPTCHA y timeout de sesión.
 */
function validarLogin() {
    const errorDiv = document.getElementById('login-error');
    const captchaError = document.getElementById('captcha-error');
    const card = document.querySelector('.login-card');

    // ── CAPA 1: Verificar si el sistema está bloqueado ──
    if (bloqueadoHasta && new Date() < bloqueadoHasta) {
        const segundos = Math.ceil((bloqueadoHasta - new Date()) / 1000);
        errorDiv.textContent = `🔒 Sistema bloqueado. Espera ${segundos} segundos.`;
        errorDiv.style.display = 'block';
        return;
    }

    // ── CAPA 2: Sanitizar entradas ──
    const usuario = sanitizar(document.getElementById('login-usuario').value);
    const password = document.getElementById('login-password').value;
    const USUARIO_VALIDO = 'admin';
    const PASSWORD_VALIDA = 'andino2024';

    // ── CAPA 3: Campos vacíos ──
    if (campoVacio(usuario) || campoVacio(password)) {
        errorDiv.textContent = '⚠️ Por favor completa usuario y contraseña';
        errorDiv.style.display = 'block';
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        return;
    }

    // ── CAPA 4: Longitud mínima de contraseña ──
    if (!longitudMinima(password, 6)) {
        errorDiv.textContent = '⚠️ La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        return;
    }

    // ── CAPA 5: CAPTCHA Local Seguro ──
    if (!captchaLocalVerificado) {
        captchaError.style.display = 'block';
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        return;
    }
    captchaError.style.display = 'none';

    // ── CAPA 6: Verificar credenciales ──
    if (usuario === USUARIO_VALIDO && password === PASSWORD_VALIDA) {
        intentosFallidos = 0;
        sessionStorage.setItem('hotelAndino_logged', 'true');
        errorDiv.style.display = 'none';
        reiniciarTimerSesion();

        const overlay = document.getElementById('login-overlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.getElementById('app-sidebar').style.display = 'flex';
            document.getElementById('app-main').style.display = 'flex';
            actualizarVistas();
            mostrarToast('👋 Bienvenido, ' + usuario + '!');
        }, 400);

    } else {
        // ── CAPA 7: Bloqueo progresivo por intentos fallidos ──
        intentosFallidos++;
        const restantes = MAX_INTENTOS - intentosFallidos;

        if (intentosFallidos >= MAX_INTENTOS) {
            bloqueadoHasta = new Date(new Date().getTime() + 30000);
            intentosFallidos = 0;
            errorDiv.textContent = '🔒 Demasiados intentos. Sistema bloqueado por 30 segundos.';
        } else {
            errorDiv.textContent = `❌ Credenciales incorrectas. Te quedan ${restantes} intento(s).`;
        }

        errorDiv.style.display = 'block';
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        document.getElementById('login-password').value = '';
        
        // Resetear el CAPTCHA local en caso de fallo
        captchaLocalVerificado = false;
        const box = document.getElementById('local-captcha-container');
        const check = document.getElementById('captcha-checkbox');
        const text = document.getElementById('captcha-text');
        box.classList.remove('verified');
        check.classList.remove('checked');
        text.textContent = 'Verificar que soy humano';
    }
}

// ── LÓGICA DEL CAPTCHA LOCAL ──
let captchaLocalVerificado = false;

function verificarCaptchaLocal() {
    if (captchaLocalVerificado) return; // Si ya está verificado, no hacer nada

    const box = document.getElementById('local-captcha-container');
    const check = document.getElementById('captcha-checkbox');
    const text = document.getElementById('captcha-text');
    const errorDiv = document.getElementById('captcha-error');

    // 1. Iniciar animación de carga
    check.classList.add('loading');
    text.textContent = 'Verificando seguridad...';
    errorDiv.style.display = 'none';

    // 2. Simular tiempo de verificación (como reCAPTCHA)
    setTimeout(() => {
        check.classList.remove('loading');
        check.classList.add('checked');
        box.classList.add('verified');
        text.textContent = 'Verificación exitosa';
        captchaLocalVerificado = true;
    }, 1200); // Tarda 1.2 segundos en verificar
}
