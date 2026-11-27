import { ArrowDown, CreditCard, Eye, Receipt, ScrollText } from 'lucide-react';
import ColeccionEstrellas from '../../../components/rediseno/ColeccionEstrellas';
import { fechaLocal } from '../../../lib/estrellas';
import { AREAS } from '../../../config/areas';
import { mockModules } from '../../../data/mockData';
import CalculadoraPuntaje from './CalculadoraPuntaje';
import Testimonios from './Testimonios';
import { testimonios } from '../../../data/testimonios';

// Secciones de la landing como historia: cada una afirma una cosa, la muestra y
// termina con una pregunta que lleva a la siguiente.
const FOTO_ESTRELLA = '/group.jpg';

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

export function SeccionCalcula() {
  return (
    <Seccion id="calcula">
      <Titulo id="calcula-titulo">¿Cuánto sacarías hoy?</Titulo>
      <p className="mt-4 mb-10 text-white/75 text-[17px]" style={{ maxWidth: 620 }}>
        Mueve tus aciertos. La plataforma calcula tu puntaje igual después de cada simulador.
      </p>
      <CalculadoraPuntaje />
      <Siguiente href="#estrellas">¿Y cómo se mantiene la constancia?</Siguiente>
    </Seccion>
  );
}

// Ejemplo de la colección para la landing: 5 días seguidos hasta hoy.
function estrellasDeEjemplo() {
  const hoy = new Date();
  return [0, 1, 2, 3, 4, 4, 6].map((dias, i) => ({
    evaluacionId: `landing-${i}`,
    fecha: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias)),
  }));
}

export function SeccionEstrellas() {
  return (
    <Seccion id="estrellas" fondo="#04091f">
      <div className="grid gap-10 md:grid-cols-2 items-center">
        <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: '4 / 3' }}>
          <img src={FOTO_ESTRELLA} alt="Estudiantes graduados forman una estrella con las manos" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div>
          <Titulo id="estrellas-titulo">Cada quiz terminado es una estrella.</Titulo>
          <p className="mt-4 mb-8 text-white/75 text-[17px]">
            Las estrellas se juntan y cada día con una suma a tu racha. Así se ve en la plataforma:
          </p>
          <ColeccionEstrellas registros={estrellasDeEjemplo()} />
        </div>
      </div>
      <Siguiente href="#estudias">¿Qué vas a estudiar?</Siguiente>
    </Seccion>
  );
}

export function SeccionAreas() {
  const areas = AREAS.map(a => ({ ...a, titulo: mockModules.find(m => m.id === a.id)?.title ?? '' })).filter(a => a.titulo);
  return (
    <Seccion id="estudias">
      <Titulo id="estudias-titulo">Lo que pide el examen, por áreas.</Titulo>
      <p className="mt-4 mb-10 text-white/75 text-[17px]" style={{ maxWidth: 620 }}>
        Cada área tiene clases, material y quizzes. Pre-medicina y Ciencias de la Salud son para quien va a carreras de la salud.
      </p>
      <ul className="scrollbar-hide flex gap-4 m-0 p-0 list-none" style={{ overflowX: 'auto', scrollSnapType: 'x mandatory' }} aria-label="Áreas">
        {areas.map(a => (
          <li key={a.id} className="relative overflow-hidden rounded-2xl" style={{ flex: '0 0 min(260px, 70vw)', aspectRatio: '3 / 4', scrollSnapAlign: 'start' }}>
            <img src={a.imagen} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(3 10 26 / 0.92) 20%, rgb(3 10 26 / 0.1) 70%)' }} />
            <p className="absolute left-5 right-5 bottom-5 m-0 font-display font-bold text-white text-[22px] leading-tight">{a.titulo}</p>
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

const DATOS_PADRES = [
  { Icono: CreditCard, titulo: 'Cuánto cuesta', texto: '$4,500 MXN el curso completo, con la inscripción de $500 incluida. También se puede pagar en mensualidades.' },
  { Icono: Receipt, titulo: 'Cómo se paga', texto: 'Fuera de la plataforma. Después envían el comprobante y un administrador lo revisa.' },
  { Icono: Eye, titulo: 'Qué ve su hijo o hija', texto: 'Sus resultados de cada simulador y quiz, su avance por área y sus estrellas.' },
  { Icono: ScrollText, titulo: 'Qué significa el puntaje', texto: 'Es una estimación de práctica de 700 a 1300. No es resultado oficial del EXANI-II.' },
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
      <Siguiente href="#registro">¿Listo para empezar?</Siguiente>
    </Seccion>
  );
}
