// Preferencia de modo claro u oscuro (#58). El valor vive en data-theme de <html>
// y src/index.css define los colores de cada modo.

export const TEMA_STORAGE_KEY = 'centum-astra:tema';

// El modo claro queda detrás de un flag mientras falten pantallas por migrar.
export const modoClaroHabilitado = import.meta.env.VITE_LIGHT_MODE === 'true';

/** @returns {'light' | 'dark' | null} */
function leerGuardado() {
  try {
    const guardado = localStorage.getItem(TEMA_STORAGE_KEY);
    return guardado === 'light' || guardado === 'dark' ? guardado : null;
  } catch {
    // Sin acceso al almacenamiento (modo privado o bloqueado): se usa el del sistema.
    return null;
  }
}

/**
 * Tema guardado por el usuario; si no eligió uno, el del sistema.
 * Con el flag apagado siempre es oscuro.
 * @param {boolean} [habilitado]
 * @returns {'light' | 'dark'}
 */
export function temaInicial(habilitado = modoClaroHabilitado) {
  if (!habilitado) return 'dark';
  const guardado = leerGuardado();
  if (guardado) return guardado;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** @param {'light' | 'dark'} tema */
export function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
}

/** @param {'light' | 'dark'} tema */
export function guardarTema(tema) {
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
  } catch {
    // Sin almacenamiento el cambio dura solo esta sesión; no es un error para el usuario.
  }
}
