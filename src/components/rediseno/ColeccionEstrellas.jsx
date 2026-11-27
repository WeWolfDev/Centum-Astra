import { racha, semana } from '../../lib/estrellas';
import Estrella from './Estrella';

// Colección del alumno: cuántas estrellas lleva, su racha y la semana de lunes a
// domingo. Cada día muestra una estrella llena si ganó al menos una.
export default function ColeccionEstrellas({ registros, hoy = new Date() }) {
  const dias = semana(registros, hoy);
  const diasRacha = racha(registros, hoy);

  return (
    <section
      aria-labelledby="coleccion-estrellas"
      className="bloque"
      style={{ background: 'rgb(var(--c-navy))', borderRadius: 16, padding: '20px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 32px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Estrella size={44} />
        <div>
          <h2 id="coleccion-estrellas" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgb(var(--c-ink) / 0.8)' }}>
            Tus estrellas
          </h2>
          <p className="tabular-nums" style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1, color: 'rgb(var(--c-ink))' }}>
            {registros.length}
          </p>
        </div>
      </div>

      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'rgb(var(--c-ink) / 0.85)' }}>
          {diasRacha > 0
            ? <>Racha de <strong className="tabular-nums">{diasRacha}</strong> {diasRacha === 1 ? 'día' : 'días'}. Termina un quiz hoy para seguirla.</>
            : 'Termina un quiz hoy para empezar tu racha.'}
        </p>
        <ol aria-label="Esta semana" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
          {dias.map(d => (
            <li
              key={d.fecha}
              aria-label={`${d.fecha}: ${d.estrellas} ${d.estrellas === 1 ? 'estrella' : 'estrellas'}${d.esHoy ? ', hoy' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <Estrella size={24} llena={d.estrellas > 0} />
              <span style={{ fontSize: 13, fontWeight: d.esHoy ? 700 : 500, color: d.esHoy ? 'rgb(var(--c-ink))' : 'rgb(var(--c-ink) / 0.65)' }}>
                {d.dia}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
