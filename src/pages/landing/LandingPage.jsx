import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Play, Star,
  MapPin, Phone, Mail, User, CheckCircle,
  ShieldCheck, Zap, BookOpen, Trophy,
} from 'lucide-react';
import PublicNav from '../../components/layout/PublicNav';

/* ── Mexican states ─────────────────────────────────────── */
const MX_STATES = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán',
  'Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas',
];

/* ── Testimonials mock data ─────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sofía Ramírez',
    career: 'Medicina · UNAM',
    state: 'Ciudad de México',
    score: '1,180 pts',
    quote: 'Gracias a Centum Astra entendí que el EXANI-II se puede dominar con método. Los simuladores son exactamente como el examen real.',
    avatar: 'SR',
    color: '#f5c842',
    thumbBg: 'from-amber-900/60 to-slate-900',
  },
  {
    id: 2,
    name: 'Diego Hernández',
    career: 'Odontología · UAG',
    state: 'Guadalajara, Jalisco',
    score: '1,095 pts',
    quote: 'Estudié dos meses con la plataforma y superé el puntaje que necesitaba. Las retroalimentaciones en cada pregunta son increíbles.',
    avatar: 'DH',
    color: '#1de9b6',
    thumbBg: 'from-teal-900/60 to-slate-900',
  },
  {
    id: 3,
    name: 'Valentina Cruz',
    career: 'Enfermería · UANL',
    state: 'Monterrey, N.L.',
    score: '1,040 pts',
    quote: 'Tenía mucho miedo al examen. La metodología de Centum me dio la confianza que necesitaba. ¡Lo recomiendo al 100%!',
    avatar: 'VC',
    color: '#93c5fd',
    thumbBg: 'from-blue-900/60 to-slate-900',
  },
  {
    id: 4,
    name: 'Andrés Morales',
    career: 'Médico Cirujano · UdG',
    state: 'Guadalajara, Jalisco',
    score: '1,210 pts',
    quote: 'El módulo de Pre-medicina es brutal. Repasar biología y química de forma organizada hizo toda la diferencia.',
    avatar: 'AM',
    color: '#f5c842',
    thumbBg: 'from-amber-900/60 to-slate-900',
  },
  {
    id: 5,
    name: 'Camila Torres',
    career: 'Nutrición · IPN',
    state: 'Ciudad de México',
    score: '1,155 pts',
    quote: 'Pensé que no tendría tiempo para estudiar y trabajar. Centum Astra me permitió avanzar a mi propio ritmo desde el celular.',
    avatar: 'CT',
    color: '#1de9b6',
    thumbBg: 'from-teal-900/60 to-slate-900',
  },
];

/* ── Stats for Hero ─────────────────────────────────────── */
const HERO_STATS = [
  { val: '95%',  label: 'Tasa de aprobación' },
  { val: '500+', label: 'Alumnos admitidos' },
  { val: '5 años', label: 'De experiencia' },
  { val: '1,200+', label: 'Preguntas EXANI-II' },
];

/* ── Pricing ────────────────────────────────────────────── */
const PLAN_FEATURES = [
  'Acceso completo al simulador EXANI-II',
  '+1,200 preguntas con retroalimentación',
  'Módulos: Matemáticas, Redacción, Lectura',
  'Módulo específico Pre-medicina',
  'Estadísticas de progreso personalizadas',
  'Acceso desde celular, tablet y PC',
  'Soporte vía WhatsApp',
  'Vigencia de 6 meses completos',
];

/* ══════════════════════════════════════════════════════════
   SECTION A — Hero (minimalista)
══════════════════════════════════════════════════════════ */
function Hero({ onRegisterClick }) {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };
  const item = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Fondo: una sola capa (degradado radial del rediseño) + halo dorado sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            'radial-gradient(ellipse 90% 60% at 50% 0%, #0c1d45 0%, transparent 70%), #030a1a',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 1,
          top: '12%', left: '50%', transform: 'translateX(-50%)',
          width: 'min(640px, 90vw)', height: 'min(640px, 90vw)',
          background:
            'radial-gradient(circle at 50% 50%, rgba(245,200,66,0.08) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Contenido centrado */}
      <motion.div
        className="relative flex flex-col flex-1 items-center justify-center text-center px-6 pt-28 pb-24"
        style={{ zIndex: 5 }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={item} className="mb-7">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 999,
            background: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.22)',
            fontSize: 12, fontWeight: 600, color: '#f5c842',
            letterSpacing: '0.05em',
          }}>
            <Zap size={11} />
            PREPARACIÓN EXANI-II · CARRERAS DE SALUD
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="mb-7"
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(44px, 8vw, 80px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            maxWidth: 920,
          }}
        >
          <span style={{ color: 'white' }}>Domina el EXANI-II.</span>
          <br />
          <span style={{ color: '#f5c842' }}>Vive tu vocación.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={item}
          style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            lineHeight: 1.7,
            maxWidth: 560,
            marginBottom: 36,
          }}
        >
          La plataforma diseñada para aspirantes a carreras de salud.
          Simuladores reales, metodología probada y seguimiento personalizado
          para que llegues donde quieres.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-wrap gap-3 justify-center mb-14">
          <button
            className="btn-gold-flat"
            onClick={onRegisterClick}
            style={{ padding: '14px 28px', fontSize: 15 }}
          >
            Quiero acceder a la plataforma
          </button>
          <a
            href="#testimonios"
            className="btn-ghost"
            style={{ padding: '14px 22px', fontSize: 15, borderRadius: 10 }}
          >
            Ver testimonios
          </a>
        </motion.div>

        {/* Stats en línea separados por puntos — colapsa a grid 2x2 en móvil */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3"
          style={{ maxWidth: 720 }}
        >
          {HERO_STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-5">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)',
                  }}
                />
              )}
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 700,
                    fontSize: 20,
                    color: i === 0 ? '#f5c842' : 'white',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {s.val}
                </span>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 12,
                    letterSpacing: '0.03em',
                  }}
                >
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION B — Testimonials Carousel
══════════════════════════════════════════════════════════ */
function TestimonialCard({ t }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-[300px] md:w-[340px] rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Video thumbnail mock */}
      <div
        className={`relative h-44 bg-gradient-to-br ${t.thumbBg} cursor-pointer overflow-hidden`}
        onClick={() => setPlaying(p => !p)}
        style={{ background: '#0c1d45' }}
      >
        {/* Simulated thumbnail gradient */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, #0c1d45 0%, #030a1a 100%)` }}
        />
        {/* Avatar large */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `rgba(${t.color === '#f5c842' ? '245,200,66' : t.color === '#1de9b6' ? '29,233,182' : '147,197,253'},0.15)`,
              border: `2px solid ${t.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22,
              color: t.color,
            }}
          >
            {t.avatar}
          </div>
        </div>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-3">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(3,10,26,0.7)',
            fontSize: 11, fontWeight: 600,
            color: t.color, border: `1px solid ${t.color}30`,
          }}>
            <Trophy size={10} /> {t.score}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: playing ? 'rgba(255,255,255,0.2)' : t.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: playing ? 'none' : `0 0 20px ${t.color}60`,
            transition: 'all 0.2s ease',
          }}>
            <Play size={14} fill={playing ? 'white' : '#030a1a'} color={playing ? 'white' : '#030a1a'} style={{ marginLeft: 2 }} />
          </div>
        </div>
        {/* Stars top right */}
        <div className="absolute top-3 right-3 flex gap-[2px]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} fill="#f5c842" color="#f5c842" />
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <p className="text-slate-700 text-[13.5px] leading-[1.7] mb-4 italic">
          "{t.quote}"
        </p>
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `rgba(${t.color === '#f5c842' ? '245,200,66' : t.color === '#1de9b6' ? '29,233,182' : '147,197,253'},0.12)`,
              border: `1px solid ${t.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12,
              color: t.color, flexShrink: 0,
            }}
          >
            {t.avatar}
          </div>
          <div>
            <p className="text-slate-800 font-semibold text-[13px] leading-tight">{t.name}</p>
            <p className="text-slate-400 text-[11.5px] mt-[2px]">{t.career}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCarousel() {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const visible = 1; // logical navigation unit
  const max = TESTIMONIALS.length - 1;

  function scrollTo(i) {
    const clamped = Math.max(0, Math.min(i, max));
    setIdx(clamped);
    const card = trackRef.current?.children[clamped];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  return (
    <section
      id="testimonios"
      className="py-20 md:py-28"
      style={{ background: '#f8fafc' }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-14">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999, marginBottom: 16,
            background: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.3)',
            fontSize: 11.5, fontWeight: 600, color: '#b8880f',
            letterSpacing: '0.06em',
          }}>
            <Star size={10} fill="#b8880f" color="#b8880f" />
            TESTIMONIOS REALES
          </span>
          <h2
            className="font-syne font-bold text-slate-900 mb-4"
            style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Ellos ya entraron a la universidad.
            <br />
            <span style={{
              background: 'linear-gradient(90deg,#b8880f,#f5c842)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Tú también puedes.
            </span>
          </h2>
          <p className="text-slate-500 text-[15px] max-w-xl mx-auto leading-[1.7]">
            Más de 500 alumnos han logrado su admisión con nuestra metodología.
            Aquí escuchas sus historias directamente.
          </p>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollPaddingLeft: 24 }}
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="snap-center">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => scrollTo(idx - 1)}
            disabled={idx === 0}
            className="btn-ghost"
            style={{
              padding: '10px 16px', borderRadius: 10,
              opacity: idx === 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                style={{
                  width: i === idx ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  background: i === idx ? '#f5c842' : '#cbd5e1',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button
            onClick={() => scrollTo(idx + 1)}
            disabled={idx === max}
            className="btn-ghost"
            style={{
              padding: '10px 16px', borderRadius: 10,
              opacity: idx === max ? 0.3 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION C — Registration + Payment
══════════════════════════════════════════════════════════ */
function FocusField({ label, id, type = 'text', value, onChange, placeholder, required = true, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="field-label" htmlFor={id} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>
        {label}
      </label>
      <div className="field" style={{ position: 'relative' }}>
        {children ? children : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        )}
        <motion.div
          animate={{ width: focused ? '100%' : '0%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: 0, height: 2,
            background: 'linear-gradient(90deg,#b8880f,#f5c842)',
            borderRadius: '0 0 0 10px', pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

function RegistrationPayment({ sectionRef }) {
  const [form, setForm] = useState({
    nombres: '', apellidos: '', celular: '', estado: '', email: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  function set(field) {
    return (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section
      ref={sectionRef}
      id="registro"
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060f28 0%, #030a1a 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{
        top: '-15%', right: '-5%', width: '50vw', height: '50vw',
        background: 'radial-gradient(ellipse,rgba(245,200,66,0.07) 0%,transparent 65%)',
        filter: 'blur(80px)', borderRadius: '50%',
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: '-20%', left: '0%', width: '40vw', height: '40vw',
        background: 'radial-gradient(ellipse,rgba(29,233,182,0.05) 0%,transparent 65%)',
        filter: 'blur(80px)', borderRadius: '50%',
      }} />

      <div className="relative max-w-6xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-14">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999, marginBottom: 16,
            background: 'rgba(245,200,66,0.08)',
            border: '1px solid rgba(245,200,66,0.2)',
            fontSize: 11.5, fontWeight: 600, color: '#f5c842',
            letterSpacing: '0.06em',
          }}>
            <ShieldCheck size={11} />
            ACCESO COMPLETO
          </span>
          <h2
            className="font-syne font-bold text-white mb-4"
            style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Empieza hoy mismo.
            <br />
            <span style={{
              background: 'linear-gradient(90deg,#b8880f,#f5c842)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Tu lugar en la universidad te espera.
            </span>
          </h2>
          <p className="text-white/40 text-[15px] max-w-lg mx-auto leading-[1.7]">
            Regístrate ahora y accede al mismo instante a todos los módulos y simuladores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── Form ── */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-gold rounded-2xl p-10 flex flex-col items-center text-center gap-5"
              >
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(245,200,66,0.12)',
                  border: '2px solid rgba(245,200,66,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={32} color="#f5c842" />
                </div>
                <h3 className="font-syne font-bold text-white text-2xl">¡Solicitud recibida!</h3>
                <p className="text-white/50 text-[15px] leading-[1.7] max-w-sm">
                  Hemos recibido tu registro. En breve recibirás un correo con los pasos
                  para completar tu pago y activar tu cuenta.
                </p>
                <p className="text-gold-dim text-[13px]">
                  Revisa tu bandeja de entrada en <strong className="text-gold">{form.email}</strong>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass rounded-2xl p-8"
              >
                <div className="mb-7">
                  <h3 className="font-syne font-bold text-white text-xl mb-1">Tus datos</h3>
                  <p className="text-white/60 text-[13px]">Todos los campos son obligatorios.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FocusField label="Nombre(s)" id="nombres" value={form.nombres} onChange={set('nombres')} placeholder="Ej. María Fernanda">
                      <div style={{ position: 'relative' }}>
                        <input
                          id="nombres" type="text" value={form.nombres}
                          onChange={set('nombres')} placeholder="Ej. María Fernanda"
                          required
                          style={{ paddingLeft: 40 }}
                          onFocus={() => {}}
                        />
                        <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                      </div>
                    </FocusField>

                    <FocusField label="Apellidos" id="apellidos" value={form.apellidos} onChange={set('apellidos')} placeholder="Ej. López Gutiérrez">
                      <div style={{ position: 'relative' }}>
                        <input
                          id="apellidos" type="text" value={form.apellidos}
                          onChange={set('apellidos')} placeholder="Ej. López Gutiérrez"
                          required
                          style={{ paddingLeft: 40 }}
                        />
                        <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                      </div>
                    </FocusField>
                  </div>

                  <FocusField label="# Celular" id="celular" value={form.celular} onChange={set('celular')} placeholder="Ej. 55 1234 5678">
                    <div style={{ position: 'relative' }}>
                      <input
                        id="celular" type="tel" value={form.celular}
                        onChange={set('celular')} placeholder="Ej. 55 1234 5678"
                        required
                        style={{ paddingLeft: 40 }}
                      />
                      <Phone size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    </div>
                  </FocusField>

                  <div>
                    <label className="field-label" htmlFor="estado" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, display: 'block', marginBottom: 6 }}>
                      ¿Dónde vivo? (Estado)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 1 }} />
                      <select
                        id="estado" value={form.estado} onChange={set('estado')}
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(12,29,69,0.5)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 10,
                          padding: '12px 16px 12px 40px',
                          color: form.estado ? '#e2e8f0' : 'rgba(255,255,255,0.22)',
                          fontSize: 14,
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          outline: 'none',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(245,200,66,0.4)'; e.target.style.background = 'rgba(22,40,80,0.6)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(12,29,69,0.5)'; }}
                      >
                        <option value="" disabled style={{ background: '#0c1d45', color: 'rgba(255,255,255,0.4)' }}>
                          Selecciona tu estado
                        </option>
                        {MX_STATES.map(s => (
                          <option key={s} value={s} style={{ background: '#0c1d45', color: '#e2e8f0' }}>{s}</option>
                        ))}
                      </select>
                      <ChevronRight size={13} style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%) rotate(90deg)',
                        color: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
                      }} />
                    </div>
                  </div>

                  <FocusField label="Correo electrónico" id="email" type="email" value={form.email} onChange={set('email')} placeholder="tu@correo.com">
                    <div style={{ position: 'relative' }}>
                      <input
                        id="email" type="email" value={form.email}
                        onChange={set('email')} placeholder="tu@correo.com"
                        required
                        style={{ paddingLeft: 40 }}
                      />
                      <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    </div>
                  </FocusField>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold mt-2 w-full"
                    style={{ padding: '16px 24px', fontSize: 16, borderRadius: 12, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 18, height: 18, border: '2px solid rgba(3,10,26,0.3)', borderTopColor: '#030a1a', borderRadius: '50%' }}
                      />
                    ) : (
                      <>
                        <ShieldCheck size={17} />
                        Comprar para acceder a la plataforma
                      </>
                    )}
                  </button>

                  <p className="text-center text-white/20 text-[11.5px] mt-1">
                    Pago seguro · Acceso inmediato al completar la transacción
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Pricing card ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-gold rounded-2xl overflow-hidden sticky top-24"
          >
            {/* Header */}
            <div
              className="px-7 py-6"
              style={{
                background: 'linear-gradient(135deg,rgba(184,136,15,0.18) 0%,rgba(245,200,66,0.08) 100%)',
                borderBottom: '1px solid rgba(245,200,66,0.12)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={15} color="#f5c842" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c842', letterSpacing: '0.1em' }}>
                  ACCESO COMPLETO · 6 MESES
                </span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span
                  className="font-syne font-bold text-white"
                  style={{ fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em' }}
                >
                  $1,499
                </span>
                <span className="text-white/60 text-[14px] mb-2">MXN</span>
              </div>
              <p className="text-white/60 text-[12.5px]">Pago único · Sin mensualidades</p>
            </div>

            {/* Features */}
            <div className="px-7 py-6">
              <p className="text-white/45 text-[12px] font-semibold tracking-[0.06em] uppercase mb-4">
                Incluye
              </p>
              <ul className="flex flex-col gap-3">
                {PLAN_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle
                      size={15}
                      color="#f5c842"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span className="text-white/65 text-[13.5px] leading-[1.5]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guarantee */}
            <div
              className="mx-5 mb-5 rounded-xl px-5 py-4"
              style={{ background: 'rgba(29,233,182,0.05)', border: '1px solid rgba(29,233,182,0.14)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={13} color="#1de9b6" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1de9b6' }}>
                  Garantía de satisfacción
                </span>
              </div>
              <p className="text-white/38 text-[12px] leading-[1.55]">
                Si en los primeros 7 días no estás satisfecho, te devolvemos tu inversión.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
function LandingFooter({ onLoginClick }) {
  return (
    <footer
      className="py-8 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4"
      style={{
        background: '#030a1a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-white/20 text-[12px]">
        © 2025 Centum Astra · Todos los derechos reservados
      </p>
      <button
        onClick={onLoginClick}
        className="btn-ghost"
        style={{ padding: '8px 18px', fontSize: 13 }}
      >
        Ya tengo cuenta · Iniciar sesión
      </button>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════ */
export default function LandingPage({ onLoginClick }) {
  const registroRef = useRef(null);

  function scrollToRegister() {
    registroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="relative" style={{ background: '#030a1a' }}>
      <PublicNav onLoginClick={onLoginClick} />
      <Hero onRegisterClick={scrollToRegister} />
      <TestimonialCarousel />
      <RegistrationPayment sectionRef={registroRef} />
      <LandingFooter onLoginClick={onLoginClick} />
    </div>
  );
}
