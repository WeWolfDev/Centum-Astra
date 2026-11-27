import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// Carrusel horizontal de testimonios: se desliza con el dedo o con los botones.
// Sin testimonios reales todavía, muestra tarjetas marcadas como "Ejemplo" para
// enseñar el lugar, sin inventar nombres ni historias.
const EJEMPLOS = [
  { id: 'e1', carrera: 'Medicina' },
  { id: 'e2', carrera: 'Enfermería' },
  { id: 'e3', carrera: 'Odontología' },
  { id: 'e4', carrera: 'Nutrición' },
];

function iniciales(nombre) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function Tarjeta({ testimonio, ejemplo }) {
  return (
    <li
      className="flex flex-col gap-5 rounded-2xl p-6"
      style={{
        flex: '0 0 min(340px, 82vw)',
        scrollSnapAlign: 'start',
        background: 'rgb(12 29 69)',
        border: ejemplo ? '1.5px dashed rgb(255 255 255 / 0.22)' : '1px solid rgb(255 255 255 / 0.1)',
      }}
    >
      <Quote size={28} color="#f5c842" aria-hidden="true" />
      {ejemplo ? (
        <p className="m-0 text-white/70 text-[16px] leading-relaxed">
          Aquí va lo que cuenta un alumno de Centum: cómo se preparó y a qué carrera entró.
        </p>
      ) : (
        <p className="m-0 text-white text-[17px] leading-relaxed">“{testimonio.texto}”</p>
      )}
      <div className="mt-auto flex items-center gap-3">
        <span className="grid place-items-center rounded-full font-bold text-[15px]" style={{ width: 44, height: 44, background: '#f5c842', color: '#030a1a' }} aria-hidden="true">
          {ejemplo ? '?' : iniciales(testimonio.nombre)}
        </span>
        <div>
          <p className="m-0 text-white font-semibold text-[15px]">{ejemplo ? 'Ejemplo' : testimonio.nombre}</p>
          <p className="m-0 text-white/65 text-[13px]">
            {testimonio.carrera}{testimonio.universidad ? ` · ${testimonio.universidad}` : ''}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function Testimonios({ testimonios }) {
  const carrilRef = useRef(null);
  const ejemplo = testimonios.length === 0;
  const lista = ejemplo ? EJEMPLOS : testimonios;

  function mover(direccion) {
    const carril = carrilRef.current;
    if (!carril) return;
    carril.scrollBy({ left: direccion * carril.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button type="button" onClick={() => mover(-1)} aria-label="Testimonio anterior" className="grid place-items-center rounded-full border border-white/20 text-white hover:bg-white/10" style={{ width: 44, height: 44 }}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => mover(1)} aria-label="Testimonio siguiente" className="grid place-items-center rounded-full border border-white/20 text-white hover:bg-white/10" style={{ width: 44, height: 44 }}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <ul
        ref={carrilRef}
        aria-label="Testimonios"
        tabIndex={0}
        className="scrollbar-hide flex gap-4 m-0 p-0 list-none"
        style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}
      >
        {lista.map(t => <Tarjeta key={t.id} testimonio={t} ejemplo={ejemplo} />)}
      </ul>
    </div>
  );
}
