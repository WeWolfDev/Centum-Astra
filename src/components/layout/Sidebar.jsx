import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home, FolderOpen, Video, GraduationCap,
  Users, CreditCard, LogOut, X, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Admin queda sin rediseñar hasta tener mockup; conservamos su nav previo.
// TODO(rediseno): Pagos (sin mockup — admin pendiente).
const adminNav = [
  { id: 'dashboard', label: 'Cuentas',                 Icon: Users },
  { id: 'courses',   label: 'Cursos',                  Icon: BookOpen },
  { id: 'modules',   label: 'Material',                Icon: FolderOpen },
  { id: 'exam',      label: 'Simuladores y quizzes',   Icon: GraduationCap },
  { id: 'payments',  label: 'Pagos',                   Icon: CreditCard },
];

const teacherNav = [
  { id: 'dashboard', label: 'Mis alumnos',             Icon: Users },
  { id: 'modules',   label: 'Material',                Icon: FolderOpen },
  { id: 'exam',      label: 'Simuladores y quizzes',   Icon: GraduationCap },
];

const studentNav = [
  { id: 'dashboard', label: 'Inicio',                  Icon: Home },
  { id: 'modules',   label: 'Módulos',                 Icon: FolderOpen },
  { id: 'videos',    label: 'Videoteca',               Icon: Video },
  { id: 'exam',      label: 'Simuladores y quizzes',   Icon: GraduationCap },
];

const navByRole = { admin: adminNav, teacher: teacherNav, student: studentNav };

const roleLabel = { admin: 'Administrador', teacher: 'Profesor', student: 'Alumno' };

export default function Sidebar({ activeSection, setActiveSection, isOpen, onClose, isMobile }) {
  const { user, logout } = useAuth();
  const [logoutHover, setLogoutHover] = useState(false);
  const nav = navByRole[user.role] || studentNav;

  return (
    <motion.aside
      animate={{ x: isMobile ? (isOpen ? 0 : -260) : 0 }}
      initial={{ x: -260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        width: 232,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(var(--c-deep))',
        borderRight: '1px solid rgb(var(--c-ink) / calc(0.05 * var(--borde-k)))',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isMobile ? 50 : 20,
        flexShrink: 0,
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgb(var(--c-gold-bright) / 0.18) 50%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Logotype + close button (mobile) */}
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgb(var(--c-ink) / calc(0.05 * var(--borde-k)))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-astra-sm.png`}
            srcSet={`${import.meta.env.BASE_URL}logo-astra-sm.png 1x, ${import.meta.env.BASE_URL}logo-astra-sm@2x.png 2x`}
            width={34}
            height={34}
            alt="Centum Astra"
            style={{
              width: 34, height: 34, borderRadius: 9,
              objectFit: 'cover',
              boxShadow: '0 0 18px rgb(var(--c-gold-bright) / 0.3)',
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: 'rgb(var(--c-ink))', letterSpacing: '0.12em', lineHeight: 1.2 }}>
              CENTUM
            </p>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, fontWeight: 500, color: 'rgb(var(--c-gold-bright))', letterSpacing: '0.14em', lineHeight: 1.2 }}>
              ASTRA
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: 'rgb(var(--c-ink) / 0.06)', border: '1px solid rgb(var(--c-ink) / calc(0.1 * var(--borde-k)))',
              borderRadius: 8, padding: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgb(var(--c-ink) / 0.5)',
            }}
          >
            <X size={16} strokeWidth={1.7} />
          </button>
        )}
      </div>

      {/* User */}
      <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid rgb(var(--c-ink) / calc(0.05 * var(--borde-k)))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgb(var(--c-ink) / 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'rgb(var(--c-ink) / 0.7)',
            flexShrink: 0,
          }}>
            {user.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'rgb(var(--c-ink) / 0.75)', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name.split(' ').slice(0, 2).join(' ')}
            </p>
            <p style={{ color: 'rgb(var(--c-ink) / 0.6)', fontSize: 11, marginTop: 1 }}>
              {roleLabel[user.role]}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }} className="scrollbar-hide">
        {nav.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
              style={{ marginBottom: 2 }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.7} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid rgb(var(--c-ink) / calc(0.05 * var(--borde-k)))' }}>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 14px', borderRadius: 10,
            color: logoutHover ? 'rgb(var(--c-peligro))' : 'rgb(var(--c-ink) / 0.6)',
            fontSize: 13, fontWeight: 500,
            background: logoutHover ? 'rgb(var(--c-peligro) / 0.07)' : 'none',
            border: 'none', cursor: 'pointer',
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
        >
          <LogOut size={15} strokeWidth={1.7} />
          Cerrar sesión
        </button>
      </div>
    </motion.aside>
  );
}
