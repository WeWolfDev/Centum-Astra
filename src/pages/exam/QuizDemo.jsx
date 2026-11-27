import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import EstrellaGanada from '../../components/rediseno/EstrellaGanada';
import { puntajeEstimado } from '../../config/rediseno';

// Quiz o simulador que se puede contestar en el modo demo, sin Supabase. A la
// derecha, el panel de preguntas: lleva a cualquiera y marca cuáles van
// contestadas; al terminar, cuáles salieron bien y cuáles mal. El resultado
// sigue la decisión 1.10. `onTerminar(id)` registra la estrella y devuelve
// `{ gano, total }`.
const NOTA_ESTIMACION = 'Estimación. No es resultado oficial del EXANI-II.';

function resumen(aciertos, total, tipo) {
  const partes = [`${aciertos} de ${total} aciertos`, `${Math.round((aciertos / total) * 100)} %`];
  if (tipo === 'simulador') partes.push(`${puntajeEstimado(aciertos, total).toLocaleString('es-MX')} puntos`);
  return partes.join(' · ');
}

function estadoDe(pregunta, respuestas, terminado) {
  if (!terminado) return respuestas[pregunta.id] ? 'contestada' : 'sin contestar';
  return respuestas[pregunta.id] === pregunta.correcta ? 'correcta' : 'incorrecta';
}

const ESTILO_ESTADO = {
  'sin contestar': { borde: 'rgb(var(--c-ink) / calc(0.25 * var(--borde-k)))', fondo: 'transparent', texto: 'rgb(var(--c-ink) / 0.85)' },
  contestada: { borde: 'rgb(var(--c-gold-bright))', fondo: 'rgb(var(--c-gold-bright) / 0.14)', texto: 'rgb(var(--c-ink))' },
  correcta: { borde: 'rgb(var(--c-exito))', fondo: 'rgb(var(--c-exito) / 0.14)', texto: 'rgb(var(--c-ink))' },
  incorrecta: { borde: 'rgb(var(--c-peligro))', fondo: 'rgb(var(--c-peligro) / 0.14)', texto: 'rgb(var(--c-ink))' },
};

function PanelPreguntas({ preguntas, actual, respuestas, terminado, onIr, children }) {
  return (
    <nav aria-label="Preguntas" className="quiz-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'rgb(var(--c-ink))' }}>
        {terminado ? 'Tus respuestas' : 'Preguntas'}
      </h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 44px)', gap: 10 }}>
        {preguntas.map((p, i) => {
          const estado = estadoDe(p, respuestas, terminado);
          const estilo = ESTILO_ESTADO[estado];
          const esActual = i === actual;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onIr(i)}
                aria-label={`Pregunta ${i + 1}, ${estado}`}
                aria-current={esActual ? 'step' : undefined}
                className="tabular-nums"
                style={{
                  position: 'relative', width: 44, height: 44, borderRadius: 999, cursor: 'pointer',
                  border: `${esActual ? 3 : 1.5}px solid ${estilo.borde}`,
                  background: estilo.fondo, color: estilo.texto, fontSize: 15, fontWeight: 700,
                }}
              >
                {i + 1}
                {estado === 'correcta' && <Check size={12} aria-hidden="true" style={{ position: 'absolute', right: -2, bottom: -2, color: 'rgb(var(--c-exito))' }} />}
                {estado === 'incorrecta' && <X size={12} aria-hidden="true" style={{ position: 'absolute', right: -2, bottom: -2, color: 'rgb(var(--c-peligro))' }} />}
              </button>
            </li>
          );
        })}
      </ol>
      {children}
    </nav>
  );
}

function Opciones({ pregunta, respuestas, terminado, onElegir }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pregunta.opciones.map(o => {
        const marcada = respuestas[pregunta.id] === o.id;
        const correcta = terminado && o.id === pregunta.correcta;
        const fallada = terminado && marcada && !correcta;
        const borde = correcta ? 'rgb(var(--c-exito))' : fallada ? 'rgb(var(--c-peligro))' : marcada ? 'rgb(var(--c-gold-bright))' : 'rgb(var(--c-ink) / calc(0.16 * var(--borde-k)))';
        return (
          <label
            key={o.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '12px 18px', borderRadius: 12,
              cursor: terminado ? 'default' : 'pointer', border: `${marcada || correcta ? 2 : 1}px solid ${borde}`,
              background: marcada ? 'rgb(var(--c-gold-bright) / 0.08)' : 'transparent', color: 'rgb(var(--c-ink))', fontSize: 17,
            }}
          >
            <input
              type="radio"
              name={pregunta.id}
              checked={marcada}
              disabled={terminado}
              onChange={() => onElegir(o.id)}
              style={{ width: 18, height: 18, accentColor: 'rgb(var(--c-gold-bright))' }}
            />
            <span style={{ flex: 1 }}>{o.texto}</span>
            {correcta && <Check size={20} aria-label="Respuesta correcta" style={{ color: 'rgb(var(--c-exito))' }} />}
            {fallada && <X size={20} aria-label="Tu respuesta, incorrecta" style={{ color: 'rgb(var(--c-peligro))' }} />}
          </label>
        );
      })}
    </div>
  );
}

export default function QuizDemo({ evaluacion, onTerminar, onSalir }) {
  const [actual, setActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [confirmar, setConfirmar] = useState(false);
  const [final, setFinal] = useState(null);

  const { preguntas } = evaluacion;
  const pregunta = preguntas[actual];
  const terminado = final !== null;
  const faltan = preguntas.filter(p => !respuestas[p.id]).length;

  function terminar(forzar = false) {
    if (faltan > 0 && !forzar) {
      setConfirmar(true);
      return;
    }
    const aciertos = preguntas.filter(p => respuestas[p.id] === p.correcta).length;
    setFinal({ aciertos, estrella: onTerminar(evaluacion.id) });
    setConfirmar(false);
    setActual(0);
  }

  const respuestaElegida = pregunta.opciones.find(o => o.id === respuestas[pregunta.id]);
  const correcta = pregunta.opciones.find(o => o.id === pregunta.correcta);

  return (
    <div className="rediseno-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 3vw, 36px)', letterSpacing: '-0.02em', color: 'rgb(var(--c-ink))' }}>
          {evaluacion.titulo}
        </h1>
        <BotonSecundario onClick={onSalir}>
          <ArrowLeft size={16} aria-hidden="true" /> {terminado ? 'Volver a Simuladores y quizzes' : 'Salir'}
        </BotonSecundario>
      </div>

      {terminado && (
        <section aria-label="Resultado" className="bloque" style={{ background: 'rgb(var(--c-navy))', borderRadius: 16, padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px 48px' }}>
          <EstrellaGanada gano={final.estrella.gano} total={final.estrella.total} tipo={evaluacion.tipo} />
          <div style={{ textAlign: 'center' }}>
            <p className="tabular-nums" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgb(var(--c-ink))' }}>
              {resumen(final.aciertos, preguntas.length, evaluacion.tipo)}
            </p>
            {evaluacion.tipo === 'simulador' && (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgb(var(--c-ink) / 0.7)' }}>{NOTA_ESTIMACION}</p>
            )}
            <p style={{ margin: '10px 0 0', fontSize: 15, color: 'rgb(var(--c-ink) / 0.8)' }}>Revisa cada pregunta en el panel.</p>
          </div>
        </section>
      )}

      <div className="quiz-layout">
        <section aria-label={`Pregunta ${actual + 1} de ${preguntas.length}`} style={{ border: '1px solid rgb(var(--c-ink) / calc(0.12 * var(--borde-k)))', borderRadius: 18, padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <p className="tabular-nums" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgb(var(--c-ink) / 0.75)' }}>
            Pregunta {actual + 1} de {preguntas.length}
          </p>
          <p style={{ margin: 0, fontSize: 'clamp(19px, 2vw, 23px)', fontWeight: 600, lineHeight: 1.4, color: 'rgb(var(--c-ink))' }}>{pregunta.texto}</p>
          <Opciones
            pregunta={pregunta}
            respuestas={respuestas}
            terminado={terminado}
            onElegir={id => setRespuestas(r => ({ ...r, [pregunta.id]: id }))}
          />
          {terminado && respuestas[pregunta.id] !== pregunta.correcta && (
            <p style={{ margin: 0, fontSize: 15, color: 'rgb(var(--c-ink) / 0.85)' }}>
              {respuestaElegida ? `Tu respuesta: ${respuestaElegida.texto}. ` : 'No la contestaste. '}
              <strong>Correcta: {correcta.texto}</strong>
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BotonSecundario onClick={() => setActual(a => a - 1)} disabled={actual === 0}>
              <ArrowLeft size={16} aria-hidden="true" /> Anterior
            </BotonSecundario>
            {actual < preguntas.length - 1 && (
              <BotonPrimario onClick={() => setActual(a => a + 1)}>
                Siguiente <ArrowRight size={16} aria-hidden="true" />
              </BotonPrimario>
            )}
          </div>
        </section>

        <PanelPreguntas preguntas={preguntas} actual={actual} respuestas={respuestas} terminado={terminado} onIr={setActual}>
          {!terminado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="tabular-nums" style={{ margin: 0, fontSize: 14, color: 'rgb(var(--c-ink) / 0.75)' }}>
                {preguntas.length - faltan} de {preguntas.length} contestadas
              </p>
              {confirmar ? (
                <>
                  <p role="alert" style={{ margin: 0, fontSize: 15, color: 'rgb(var(--c-ink))' }}>
                    Te faltan {faltan} {faltan === 1 ? 'pregunta' : 'preguntas'} sin contestar.
                  </p>
                  <BotonPrimario onClick={() => terminar(true)}>Terminar de todos modos</BotonPrimario>
                  <BotonSecundario onClick={() => setConfirmar(false)}>Seguir contestando</BotonSecundario>
                </>
              ) : (
                <BotonPrimario onClick={() => terminar()}>Terminar</BotonPrimario>
              )}
            </div>
          )}
        </PanelPreguntas>
      </div>
    </div>
  );
}
