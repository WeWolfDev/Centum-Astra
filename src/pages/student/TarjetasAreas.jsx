import TarjetaArea from '../../components/rediseno/TarjetaArea';
import { areaDeModulo } from '../../config/areas';

// Tarjetas de "Tu material" en Inicio; cada una abre su módulo.
export default function TarjetasAreas({ modulos, onAbrirModulo }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {modulos.map((mod) => {
        const area = areaDeModulo(mod);
        return (
          <TarjetaArea
            key={mod.id}
            titulo={mod.title}
            icono={area?.icono ?? 'math'}
            imagen={area?.imagen}
            intensidadTinte={area?.intensidadTinte ?? 'media'}
            onClick={() => onAbrirModulo(mod.id)}
            ariaLabel={`Abrir módulo ${mod.title}`}
          />
        );
      })}
    </div>
  );
}
