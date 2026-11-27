import { ArrowDown, CalendarDays, Eye, MessageCircle, Wifi } from 'lucide-react';
import { enlaceInformes } from '../../../config/contacto';
import { AREAS } from '../../../config/areas';
import { mockModules } from '../../../data/mockData';
import TarjetaAreaGiratoria from './TarjetaAreaGiratoria';
import Testimonios from './Testimonios';
import { testimonios } from '../../../data/testimonios';

// Secciones de la landing como historia: cada una afirma una cosa, la muestra y
// termina con una pregunta que lleva a la siguiente.
function Siguiente({ href, children }) {
  return (
    <a href={href} className="inline-flex items-center gap-2 mt-10 text-white font-semibold text-[17px] hover:underline" style={{ minHeight: 44 }}>
      {children} <ArrowDown size={18} aria-hidden="true" />
    </a>
  );
}

function Titulo({ id, children }) {
  return (
    <h2 id={id} className="m-0 font-display font-extrabold text-white" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em', textWrap: 'balance' }}>
      {children}
    </h2>
  );
}

function Seccion({ id, children, fondo = '#030a1a' }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="px-6 md:px-12" style={{ background: fondo, paddingTop: 'clamp(72px, 10vw, 120px)', paddingBottom: 'clamp(72px, 10vw, 120px)', scrollMarginTop: 72 }}>
      <div className="mx-auto" style={{ maxWidth: 1100 }}>{children}</div>
    </section>
  );
}

export function SeccionAreas() {
  const areas = AREAS.map(a => ({ ...a, titulo: mockModules.find(m => m.id === a.id)?.title ?? '' })).filter(a => a.titulo);
  return (
    <Seccion id="estudias">
      <Titulo id="estudias-titulo">Lo que pide el examen, por áreas.</Titulo>
      <p className="mt-4 mb-10 text-white/75 text-[17px]" style={{ maxWidth: 620 }}>
        Cada área tiene clases, material y quizzes. Toca una para ver qué incluye.
      </p>
      <ul className="grid gap-4 m-0 p-0 list-none" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }} aria-label="Áreas">
        {areas.map(a => (
          <li key={a.id}>
            <TarjetaAreaGiratoria titulo={a.titulo} imagen={a.imagen} descripcion={a.descripcion} />
          </li>
        ))}
      </ul>
      <Siguiente href="#testimonios">¿Qué dicen quienes ya se prepararon aquí?</Siguiente>
    </Seccion>
  );
}

export function SeccionTestimonios() {
  return (
    <Seccion id="testimonios" fondo="#04091f">
      <Titulo id="testimonios-titulo">Alumnos de Centum.</Titulo>
      <p className="mt-4 mb-6 text-white/75 text-[17px]">Desliza para ver más.</p>
      <Testimonios testimonios={testimonios} />
      <Siguiente href="#padres">¿Eres mamá o papá?</Siguiente>
    </Seccion>
  );
}

// Horarios registrados con el cliente (docs/RESPUESTAS_Y_PREGUNTAS_PENDIENTES_CLIENTE.md, 1.8):
// cada grupo tiene uno solo. El precio y las formas de pago se piden por WhatsApp.
const DATOS_PADRES = [
  { Icono: Wifi, titulo: '100 % en línea', texto: 'Las clases son en vivo y se toman desde casa, sin trasladarse.' },
  { Icono: CalendarDays, titulo: 'Grupo entre semana', texto: 'Martes y jueves, de 7:00 a 9:00 p. m.' },
  { Icono: CalendarDays, titulo: 'Grupo sabatino', texto: 'Sábados, de 8:00 a. m. a 12:00 p. m.' },
  { Icono: Eye, titulo: 'Qué ve su hijo o hija', texto: 'Sus resultados de cada simulador y quiz, y su avance en cada área.' },
];

export function SeccionPadres() {
  return (
    <Seccion id="padres">
      <Titulo id="padres-titulo">Para mamá y papá.</Titulo>
      <ul className="grid gap-4 mt-10 m-0 p-0 list-none sm:grid-cols-2">
        {DATOS_PADRES.map(({ Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-4 rounded-2xl p-6" style={{ background: 'rgb(12 29 69)', border: '1px solid rgb(255 255 255 / 0.1)' }}>
            <Icono size={26} color="#f5c842" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 className="m-0 text-white font-semibold text-[17px]">{titulo}</h3>
              <p className="mt-1 mb-0 text-white/75 text-[15px] leading-relaxed">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
      <a
        href={enlaceInformes()}
        target={enlaceInformes().startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="btn-gold inline-flex items-center gap-2 mt-10"
        style={{ minHeight: 48, padding: '0 24px', fontSize: 16, borderRadius: 12 }}
      >
        <MessageCircle size={18} aria-hidden="true" /> Pide informes de precio y pagos
      </a>
      <div>
        <Siguiente href="#registro">¿Listo para empezar?</Siguiente>
      </div>
    </Seccion>
  );
}
