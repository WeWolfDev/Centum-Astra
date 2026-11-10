import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Cambia entre modo claro y oscuro. No se muestra con el flag apagado.
export default function BotonTema({ className = '' }) {
  const { tema, alternar, habilitado } = useTheme();
  if (!habilitado) return null;

  const esClaro = tema === 'light';
  const Icono = esClaro ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={esClaro ? 'Activar modo oscuro' : 'Activar modo claro'}
      title={esClaro ? 'Modo oscuro' : 'Modo claro'}
      className={
        'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 cursor-pointer ' +
        'border border-white/10 bg-white/5 text-white/70 transition-colors ' +
        'hover:text-white hover:bg-white/10 ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright ' +
        className
      }
    >
      <Icono size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
