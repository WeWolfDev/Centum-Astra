import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GraduationCap, Rocket, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PublicNav from '../../components/layout/PublicNav';
import { cn } from '../../lib/utils';

const roles = [
  {
    key: 'admin',
    label: 'Administrador',
    Icon: Shield,
    hint: 'admin@centum.mx / admin123',
    accentColor: '#f5c842',
    accentBg: 'rgba(245,200,66,0.07)',
    accentBorder: 'rgba(245,200,66,0.2)',
  },
  {
    key: 'teacher',
    label: 'Profesor',
    Icon: GraduationCap,
    hint: 'sofia@centum.mx / prof123',
    accentColor: '#93c5fd',
    accentBg: 'rgba(96,165,250,0.07)',
    accentBorder: 'rgba(96,165,250,0.2)',
  },
  {
    key: 'student',
    label: 'Alumno',
    Icon: Rocket,
    hint: 'ana@centum.mx / alu123',
    accentColor: '#5eead4',
    accentBg: 'rgba(45,212,191,0.07)',
    accentBorder: 'rgba(45,212,191,0.2)',
  },
];

const STATS = [
  { val: '95 %', label: 'tasa de aprobación', hero: true },
  { val: '500+', label: 'alumnos activos' },
  { val: '5 años', label: 'de experiencia' },
];

/* ── Animated focus underline ─────────────────────────── */
function FocusInput({ type = 'text', value, onChange, placeholder, id }) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={isPassword && !showPass ? 'password' : 'text'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ paddingRight: isPassword ? 44 : 16 }}
          required
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
            }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      <motion.div
        animate={{ width: focused ? '100%' : '0%' }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          background: 'linear-gradient(90deg, #b8880f, #f5c842)', borderRadius: '0 0 0 10px',
        }}
      />
    </div>
  );
}

export default function Login() {
  const { login, error, setError } = useAuth();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [videoReady,   setVideoReady]   = useState(false);
  const videoRef = useRef(null);

  // Load video only after all critical resources (LCP) are done.
  // Static space photo renders instantly as the fallback/poster.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const startVideo = () => {
      if (cancelled) return;
      video.src = `${import.meta.env.BASE_URL}space.mp4`;
      video.load();
    };

    if (document.readyState === 'complete') {
      startVideo();
    } else {
      window.addEventListener('load', startVideo, { once: true });
    }
    return () => { cancelled = true; };
  }, []);

  function handleRoleSelect(role) {
    setSelectedRole(role.key);
    setEmail(role.hint.split(' / ')[0]);
    setPassword(role.hint.split(' / ')[1]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(email, password);
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

  return (
    <div className="relative flex flex-col overflow-hidden min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d1533_0%,_#030a1a_45%,_#060f28_100%)]">
      <PublicNav />

      {/* ── Layer 1: Static space photo — renders instantly, acts as poster ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${import.meta.env.BASE_URL}timrael-space-4984262_1920.jpg)`,
        backgroundSize: 'cover', backgroundPosition: 'center 20%',
      }} />

      {/* ── Layer 2: Video — src injected after window.load, fades in on canplay ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        onCanPlay={() => setVideoReady(true)}
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 30%',
          opacity: videoReady ? 0.55 : 0,
          transition: 'opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 3: Dark veil — ensures text legibility regardless of video ── */}
      <div className="absolute inset-0 bg-[rgba(3,10,26,0.52)]" style={{ zIndex: 3 }} />

      {/* ── Depth nebula — passive ── */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] pointer-events-none"
        style={{ zIndex: 4, background: 'radial-gradient(ellipse at center,rgba(245,200,66,0.05) 0%,transparent 65%)' }} />

      {/* ── PANELS ── */}
      <div className="flex flex-1 pt-[60px]" style={{ position: 'relative', zIndex: 5 }}>

        {/* ── LEFT PANEL — Hero ── */}
        <motion.div
          className="login-left-panel"
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            flex: '0 0 58%', padding: '52px 64px 48px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', zIndex: 2,
          }}
        >
          {/* Aceternity dot-grid overlay — fades at edges */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none bg-dot-grid bg-dot-32 opacity-100"
            style={{
              maskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.55) 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.55) 75%, transparent 100%)',
            }}
          />

          {/* Glow beam — left edge pointing at headline */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: '28%', left: '-10%',
              width: '55%', height: '45%',
              background: 'radial-gradient(ellipse at 30% 50%, rgba(245,200,66,0.09) 0%, transparent 68%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Hero headline */}
          <motion.div variants={item} className="mb-8 relative">
            <h1
              className="resp-hero-h1 relative z-10"
              style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 900,
                fontSize: 76, lineHeight: 0.95, letterSpacing: '-0.04em',
                marginBottom: 24,
              }}
            >
              {/* First line — white fading to white/55, giving depth */}
              <span className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
                Domina el EXANI-II.
              </span>
              <br />
              {/* Second line — gold gradient, hero accent */}
              <span style={{
                background: 'linear-gradient(90deg, #b8880f 0%, #f5c842 45%, #fde68a 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', fontWeight: 800,
              }}>
                Vive tu vocación.
              </span>
            </h1>
            <p className="relative z-10 text-white/45 text-[15.5px] leading-[1.75] max-w-[400px] font-normal tracking-[0.005em]">
              La plataforma que prepara a los mejores aspirantes a carreras de salud — metodología probada, simuladores reales.
            </p>
          </motion.div>

          {/* Stats — editorial, with vertical dividers */}
          <motion.div variants={item} className="flex items-stretch">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-stretch">
                {i > 0 && (
                  <div className="w-px bg-white/[0.07] self-stretch mx-8" />
                )}
                <div className="relative">
                  {/* Micro glow only on hero stat */}
                  {s.hero && (
                    <div className="absolute -inset-4 pointer-events-none
                      bg-[radial-gradient(ellipse_at_center,rgba(245,200,66,0.12)_0%,transparent_65%)]" />
                  )}
                  <p className={cn(
                    'font-syne text-[23px] font-bold leading-none mb-[6px] tracking-tight relative',
                    s.hero
                      ? 'bg-gradient-to-br from-yellow-200 via-gold-bright to-amber-500/80 bg-clip-text text-transparent'
                      : 'text-white',
                  )}>
                    {s.val}
                  </p>
                  <p className="text-[11px] text-white/30 font-normal tracking-[0.045em] relative">
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
          className="login-right-panel"
          style={{
            flex: '0 0 42%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '48px 48px', position: 'relative', zIndex: 2,
          }}
        >
          <div className="w-full max-w-[372px] rounded-[18px] p-[36px_32px]
            bg-[rgba(3,10,26,0.55)] backdrop-blur-[18px] border border-white/[0.08]"
            style={{ WebkitBackdropFilter: 'blur(18px)' }}
          >
            {/* Form header */}
            <div className="mb-7">
              <h2 className="font-syne text-[22px] font-bold text-white mb-[5px] tracking-[-0.02em]">
                Bienvenido
              </h2>
              <p className="text-white/38 text-[13.5px] leading-[1.5]">
                Selecciona tu perfil para continuar
              </p>
            </div>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-[7px] mb-[26px]">
              {roles.map(role => {
                const active = selectedRole === role.key;
                return (
                  <motion.button
                    key={role.key}
                    onClick={() => handleRoleSelect(role)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '13px 8px', borderRadius: 10, cursor: 'pointer',
                      background: active ? role.accentBg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? role.accentBorder : 'rgba(255,255,255,0.06)'}`,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <role.Icon
                      size={18}
                      strokeWidth={1.6}
                      style={{ color: active ? role.accentColor : 'rgba(255,255,255,0.3)', transition: 'color 0.15s ease' }}
                    />
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: active ? role.accentColor : 'rgba(255,255,255,0.38)',
                      transition: 'color 0.15s ease',
                    }}>
                      {role.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
              <div>
                <label className="field-label" htmlFor="email">Correo electrónico</label>
                <FocusInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="usuario@centum.mx"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">Contraseña</label>
                <FocusInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[#f87171] text-[12.5px] text-center rounded-[8px] px-[12px] py-[8px]
                      bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.15)]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-fill mt-1 w-full"
                style={{ padding: '13px 22px', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, border: '2px solid rgba(245,200,66,0.25)', borderTopColor: '#f5c842', borderRadius: '50%' }}
                  />
                ) : 'Ingresar'}
              </button>
            </form>

            <p className="text-center text-white/[0.18] text-[11.5px] mt-6">
              © 2025 Centum Astra · Todos los derechos reservados
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
