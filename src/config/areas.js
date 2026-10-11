// Fuente única de presentación por área (imagen, icono, intensidad del tinte).
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

export const AREAS = [
  { id: 1, icono: 'math',    imagen: mathSrc,      intensidadTinte: 'media'  },
  { id: 2, icono: 'reading', imagen: spanishSrc,   intensidadTinte: 'media'  },
  { id: 3, icono: 'writing', imagen: redaccionSrc, intensidadTinte: 'media'  },
  { id: 4, icono: 'premed',  imagen: doctorSrc,    intensidadTinte: 'media'  },
  { id: 5, icono: 'health',  imagen: medicineSrc,  intensidadTinte: 'fuerte' },
];

export const AREA_POR_ID = Object.fromEntries(AREAS.map((a) => [a.id, a]));
