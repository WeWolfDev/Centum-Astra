// Fuente única de presentación por área (imagen, icono, intensidad del tinte y
// la descripción breve que muestra la landing).
// El `id` coincide con `mockModules`. El título oficial sigue viniendo del
// dominio (mockModules); aquí vive solo la capa visual.
//
// `intensidadTinte` es el default sugerido para TarjetaArea en el panel del
// alumno (Ciencias de la Salud tiene foto más clara, por eso 'fuerte').
import mathSrc from '../assets/areas/math.jpg';
import spanishSrc from '../assets/areas/spanish.jpg';
import redaccionSrc from '../assets/areas/redaccion.jpg';
import doctorSrc from '../assets/areas/doctor.jpg';
import medicineSrc from '../assets/areas/medicine.jpg';

// `clave` reconoce el área en el título de un módulo real de Supabase, cuyo id
// es un uuid y no coincide con estos ids.
export const AREAS = [
  { id: 1, clave: 'matematic', icono: 'math',    imagen: mathSrc,      intensidadTinte: 'media',
    descripcion: 'Aritmética, álgebra, geometría y probabilidad, con problemas para razonar, no para memorizar.' },
  { id: 2, clave: 'lector',    icono: 'reading', imagen: spanishSrc,   intensidadTinte: 'media',
    descripcion: 'Encontrar la idea principal de un texto, hacer inferencias y reconocer su propósito.' },
  { id: 3, clave: 'redaccion', icono: 'writing', imagen: redaccionSrc, intensidadTinte: 'media',
    descripcion: 'Ortografía, puntuación, concordancia y orden de las ideas al escribir.' },
  { id: 4, clave: 'medicina',  icono: 'premed',  imagen: doctorSrc,    intensidadTinte: 'media',
    descripcion: 'Para quien va a Medicina: biología, química y bases de las ciencias de la salud.' },
  { id: 5, clave: 'salud',     icono: 'health',  imagen: medicineSrc,  intensidadTinte: 'fuerte',
    descripcion: 'Para carreras de la salud: biología y química con preguntas tipo examen.' },
];

export const AREA_POR_ID = Object.fromEntries(AREAS.map((a) => [a.id, a]));

function normalizar(texto) {
  return (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Capa visual de un módulo: por id (mocks) o por su título (Supabase). */
export function areaDeModulo(mod) {
  const titulo = normalizar(mod?.title);
  return AREA_POR_ID[mod?.id] ?? AREAS.find((a) => titulo.includes(a.clave)) ?? null;
}
