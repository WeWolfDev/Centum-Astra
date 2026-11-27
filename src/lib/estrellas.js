// Estrellas y racha del alumno (#57). Cada quiz o simulador terminado da una
// estrella, una por evaluación al día, y se acumulan. La racha cuenta los días
// seguidos con al menos una estrella. Las reglas viven aquí, sin React, para
// que el servidor pueda replicarlas igual cuando se calculen en la base.

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Fecha del calendario local en formato AAAA-MM-DD. */
export function fechaLocal(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(fecha, dias) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/**
 * Registra que el alumno terminó una evaluación. Devuelve los registros nuevos y
 * si ganó estrella: repetir la misma evaluación el mismo día no da otra.
 */
export function registrarEstrella(registros, evaluacionId, fecha) {
  const dia = fechaLocal(fecha);
  const yaLaGano = registros.some(r => r.evaluacionId === evaluacionId && r.fecha === dia);
  if (yaLaGano) return { registros, gano: false };
  return { registros: [...registros, { evaluacionId, fecha: dia }], gano: true };
}

function estrellasPorDia(registros) {
  return registros.reduce((cuenta, r) => cuenta.set(r.fecha, (cuenta.get(r.fecha) ?? 0) + 1), new Map());
}

/** La semana de `hoy`, de lunes a domingo, con las estrellas de cada día. */
export function semana(registros, hoy) {
  const cuenta = estrellasPorDia(registros);
  const lunes = sumarDias(hoy, -((hoy.getDay() + 6) % 7));
  const hoyTexto = fechaLocal(hoy);
  return DIAS.map((dia, i) => {
    const fecha = fechaLocal(sumarDias(lunes, i));
    return { dia, fecha, estrellas: cuenta.get(fecha) ?? 0, esHoy: fecha === hoyTexto };
  });
}

/**
 * Días seguidos con estrella. Si hoy todavía no hay, cuenta desde ayer: la racha
 * se pierde hasta que pasa un día completo sin estrella.
 */
export function racha(registros, hoy) {
  const cuenta = estrellasPorDia(registros);
  let dia = cuenta.has(fechaLocal(hoy)) ? hoy : sumarDias(hoy, -1);
  let dias = 0;
  while (cuenta.has(fechaLocal(dia))) {
    dias += 1;
    dia = sumarDias(dia, -1);
  }
  return dias;
}
