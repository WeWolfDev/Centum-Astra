import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GraduationCap, Rocket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PublicNav from '../../components/layout/PublicNav';
import Boton from '../../components/rediseno/Boton';
import Input from '../../components/rediseno/Input';
import { cn } from '../../lib/utils';

const roles = [
  {
    key: 'admin',
    label: 'Administrador',
    Icon: Shield,
    hint: 'admin@centum.mx / admin123',
    iconColor: 'text-gold-bright',
  },
  {
    key: 'teacher',
    label: 'Profesor',
    Icon: GraduationCap,
    hint: 'sofia@centum.mx / prof123',
    iconColor: 'text-info',
  },
  {
    key: 'student',
    label: 'Alumno',
    Icon: Rocket,
    hint: 'ana@centum.mx / alu123',
    iconColor: 'text-clinical-teal',
  },
];

const STATS = [
  { val: '95 %', label: 'tasa de aprobación', hero: true },
  { val: '500+', label: 'alumnos activos' },
  { val: '5 años', label: 'de experiencia' },
];

export default function Login() {
  const { login, error, setError } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(email, password);
    setLoading(false);
  }

  async function handleDevQuickLogin(role) {
    const [quickEmail, quickPassword] = role.hint.split(' / ');
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(quickEmail, quickPassword);
    setLoading(false);
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative flex flex-col overflow-hidden min-h-screen bg-fondo-app">
      <PublicNav />

      {/* pt-[60px] se mantiene arbitrario: depende de la altura real
          (60px) de PublicNav fija en la parte superior. */}
      <div className="relative z-10 flex flex-1 flex-col md:flex-row pt-[60px]">

        {/* ── LEFT PANEL — Hero (oculto en móvil) ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="hidden md:flex md:w-7/12 md:flex-col md:justify-center relative px-16 py-14"
        >
          {/* Aceternity dot-grid overlay — fades at edges */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-dot-grid bg-dot-32"
            style={{
              maskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.55) 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.55) 75%, transparent 100%)',
            }}
          />

          {/* Glow beam dorado — ya existe como token hero-glow en tailwind.config.js */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-hero-glow"
          />

          {/* Hero headline */}
          <motion.div variants={item} className="mb-8 relative">
            <h1 className="relative z-10 font-display font-bold tracking-tight leading-tight text-4xl md:text-5xl lg:text-6xl mb-6">
              <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Domina el EXANI-II.
              </span>
              <br />
              <span className="bg-gold-beam bg-clip-text text-transparent">
                Vive tu vocación.
              </span>
            </h1>
            <p className="relative z-10 text-white/70 text-base leading-relaxed max-w-sm">
              La plataforma que prepara a los mejores aspirantes a carreras de salud — metodología probada, simuladores reales.
            </p>
          </motion.div>

          {/* Stats — editorial, with vertical dividers */}
          <motion.div variants={item} className="flex items-stretch">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-stretch">
                {i > 0 && <div className="w-px bg-white/10 self-stretch mx-8" />}
                <div className="relative">
                  {s.hero && (
                    <div className="absolute -inset-4 pointer-events-none bg-stat-glow" />
                  )}
                  <p className={cn(
                    'font-display text-2xl font-bold leading-none mb-1.5 tracking-tight relative',
                    s.hero
                      ? 'bg-gold-beam bg-clip-text text-transparent'
                      : 'text-white',
                  )}>
                    {s.val}
                  </p>
                  <p className="text-xs text-white/70 font-normal tracking-wide relative">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL — Form ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full md:w-5/12 flex-col items-center justify-center gap-5 px-5 md:px-12 py-8 md:py-12"
        >
          <div className="w-full max-w-sm rounded-2xl p-8 bg-space-void/60 backdrop-blur-xl border border-white/10">
            {/* Form header */}
            <div className="mb-7">
              <h2 className="font-display text-xl font-bold text-white mb-1.5 tracking-tight">
                Bienvenido de nuevo
              </h2>
              <p className="text-white/70 text-sm leading-snug">
                Ingresa con tu correo y contraseña
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="usuario@centum.mx"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
              />

              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
              />

              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-peligro text-xs text-center rounded-lg px-3 py-2 bg-peligro/5 border border-peligro/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Boton
                variant="primario"
                type="submit"
                isLoading={loading}
                className="w-full mt-1"
              >
                Ingresar
              </Boton>
            </form>

            <p className="text-center text-white/60 text-xs mt-6">
              © {currentYear} Centum Astra · Todos los derechos reservados
            </p>
          </div>

          {/* ── DEV quick-login — removed by Vite tree-shake in prod ── */}
          {import.meta.env.DEV && (
            <div className="w-full max-w-sm">
              <p className="text-white/70 text-xs tracking-widest uppercase mb-2 text-center">
                Acceso rápido · DEV
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => (
                  <motion.button
                    key={role.key}
                    type="button"
                    onClick={() => handleDevQuickLogin(role)}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-white/[0.02] border border-white/10 transition-colors hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <role.Icon
                      size={18}
                      strokeWidth={1.6}
                      className={role.iconColor}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-white/70">
                      {role.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
