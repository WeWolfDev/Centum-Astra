import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import EstrellaGanada from '../../components/rediseno/EstrellaGanada';
import { puntajeEstimado } from '../../config/rediseno';

// Quiz o simulador que se puede contestar en el modo demo, sin Supabase. Al
// terminar muestra el resultado como la versión real (decisión 1.10) y la
// estrella ganada (#57). `onTerminar(id)` registra la estrella y devuelve
// `{ gano, total }`.
const NOTA_ESTIMACION = 'Estimación. No es resultado oficial del EXANI-II.';

function resumen(aciertos, total, tipo) {
  const partes = [`${aciertos} de ${total} aciertos`, `${Math.round((aciertos / total) * 100)} %`];
  if (tipo === 'simulador') partes.push(`${puntajeEstimado(aciertos, total).toLocaleString('es-MX')} puntos`);
  return partes.join(' · ');
}

function Resultado({ evaluacion, aciertos, estrella, onSalir }) {
  const total = evaluacion.preguntas.length;
  return (
    <div className="bloque" style={{ background: 'rgb(var(--c-navy))', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <EstrellaGanada gano={estrella.gano} total={estrella.total} tipo={evaluacion.tipo} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'rgb(var(--c-ink) / 0.75)' }}>{evaluacion.titulo}</p>
        <p className="tabular-nums" style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: 'rgb(var(--c-ink))' }}>
          {resumen(aciertos, total, evaluacion.tipo)}
        </p>
        {evaluacion.tipo === 'simulador' && (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgb(var(--c-ink) / 0.65)' }}>{NOTA_ESTIMACION}</p>
        )}
      </div>
      <BotonPrimario onClick={onSalir}>Volver a Simuladores y quizzes</BotonPrimario>
    </div>
  );
}

export default function QuizDemo({ evaluacion, onTerminar, onSalir }) {
  const [actual, setActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [final, setFinal] = useState(null);

  const { preguntas } = evaluacion;
  const pregunta = preguntas[actual];
  const esUltima = actual === preguntas.length - 1;

  function avanzar() {
    if (!esUltima) {
      setActual(a => a + 1);
      return;
    }
    const aciertos = preguntas.filter(p => respuestas[p.id] === p.correcta).length;
    setFinal({ aciertos, estrella: onTerminar(evaluacion.id) });
  }

  return (
    <div className="rediseno-page" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <BotonSecundario onClick={onSalir}>
          <ArrowLeft size={16} aria-hidden="true" /> Salir
        </BotonSecundario>
      </div>
      <h1 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', color: 'rgb(var(--c-ink))' }}>
        {evaluacion.titulo}
      </h1>

      {final ? (
        <Resultado evaluacion={evaluacion} aciertos={final.aciertos} estrella={final.estrella} onSalir={onSalir} />
      ) : (
        <fieldset key={pregunta.id} style={{ border: '1px solid rgb(var(--c-ink) / calc(0.12 * var(--borde-k)))', borderRadius: 16, padding: '20px 22px', margin: 0 }}>
          <legend className="tabular-nums" style={{ padding: '0 6px', fontSize: 13, color: 'rgb(var(--c-ink) / 0.7)' }}>
            Pregunta {actual + 1} de {preguntas.length}
          </legend>
          <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: 'rgb(var(--c-ink))' }}>{pregunta.texto}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pregunta.opciones.map(o => {
              const marcada = respuestas[pregunta.id] === o.id;
              return (
                <label
                  key={o.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: marcada ? '2px solid rgb(var(--c-gold-bright))' : '1px solid rgb(var(--c-ink) / calc(0.14 * var(--borde-k)))',
                    background: marcada ? 'rgb(var(--c-gold-bright) / 0.08)' : 'transparent',
                    color: 'rgb(var(--c-ink))', fontSize: 15,
                  }}
                >
                  <input
                    type="radio"
                    name={pregunta.id}
                    checked={marcada}
                    onChange={() => setRespuestas(r => ({ ...r, [pregunta.id]: o.id }))}
                  />
                  {o.texto}
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <BotonPrimario onClick={avanzar} disabled={!respuestas[pregunta.id]}>
              {esUltima ? 'Terminar' : 'Siguiente'}
            </BotonPrimario>
          </div>
        </fieldset>
      )}
    </div>
  );
}
