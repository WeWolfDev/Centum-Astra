// Formato de las estadísticas (#31, docs/ESTADISTICAS.md). Un promedio en null
// es "sin resultados", nunca 0.
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export const porcentaje = valor => `${Math.round(valor)} %`;
export const puntos = valor => Math.round(valor).toLocaleString('es-MX');

const FORMATO_FECHA = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' };
export const fecha = iso => new Date(iso).toLocaleDateString('es-MX', FORMATO_FECHA);
// Una fecha sin hora ('2026-11-30') se muestra tal cual, sin correrla por zona horaria.
export const dia = texto => new Date(`${texto}T12:00:00Z`).toLocaleDateString('es-MX', { ...FORMATO_FECHA, timeZone: 'UTC' });
