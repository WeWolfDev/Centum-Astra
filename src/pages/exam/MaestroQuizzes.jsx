// Simuladores y quizzes (maestro/admin).
// Dos pestañas con su propio listado, estado vacío y botón de crear.
//
// Reglas del HANDOFF que aplican:
//  - Simulador = da puntaje Ceneval y alimenta la gráfica del alumno.
//  - Quiz = aciertos sobre total. Nunca puntaje Ceneval.
//  - Visualmente: cards con acento azul claro #93c5fd, pastilla por tipo.
//  - Sin degradado dorado, sin emojis.
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { mockModules } from '../../data/mockData';
import { useMaterial } from '../../context/MaterialContext';
import IconSubject from '../../components/rediseno/IconSubject';
import Pastilla from '../../components/rediseno/Pastilla';
import Pestanas from '../../components/rediseno/Pestanas';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import ModalNuevaEvaluacion from './ModalNuevaEvaluacion';
import { TIPO_COPY } from './tipoCopy';

const SUBJECT_BY_ICON = {
  Sigma: 'math',
  Book: 'reading',
  PenTool: 'writing',
  Stethoscope: 'premed',
  HeartPulse: 'health',
};

function EvaluacionCreadaCard({ evaluacion, onEliminar }) {
  const materia = mockModules.find(m => m.id === evaluacion.moduleId);
  const key = SUBJECT_BY_ICON[materia?.icon];
  const copy = TIPO_COPY[evaluacion.tipo];
  return (
    <article
      style={{
        padding: 18,
        borderRadius: 14,
        background: 'transparent',
        border: '1px solid rgba(147,197,253,0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '14px 16px',
      }}
    >
      <span
        style={{
          flex: '0 0 44px', height: 44, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(147,197,253,0.14)', color: '#93c5fd',
        }}
      >
        {key ? <IconSubject name={key} size={22} /> : null}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
          {evaluacion.tema}
        </h3>
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          <Pastilla tono={copy.tono}>{copy.singularMay}</Pastilla>
          <Pastilla tono="neutral">{materia?.title ?? 'Materia'}</Pastilla>
          <span>{evaluacion.preguntas.length} pregunta{evaluacion.preguntas.length === 1 ? '' : 's'}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onEliminar(evaluacion.id)}
        aria-label={`Eliminar ${copy.singular} ${evaluacion.tema}`}
        style={{
          flex: '0 0 44px', width: 44, height: 44, borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: '#cbd5e1',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Trash2 size={18} />
      </button>
    </article>
  );
}

function ListadoPorMateria({ items, onEliminar }) {
  const porMateria = useMemo(() => {
    const map = new Map();
    items.forEach(e => {
      const key = e.moduleId;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return map;
  }, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {[...porMateria.entries()].map(([moduleId, entries]) => {
        const materia = mockModules.find(m => m.id === moduleId);
        return (
          <section key={moduleId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              {materia?.title ?? 'Materia'}
            </h2>
            {entries.map(e => (
              <EvaluacionCreadaCard key={e.id} evaluacion={e} onEliminar={onEliminar} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function EstadoVacioPanel({ tipo, onCrear }) {
  const copy = TIPO_COPY[tipo];
  return (
    <section
      style={{
        padding: '48px 24px',
        borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.13)',
        background: 'rgba(255,255,255,0.03)',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: 22,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}
      >
        {copy.vacioTitulo}
      </h2>
      <p style={{ margin: '8px 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
        {copy.vacioDescripcion}
      </p>
      <BotonPrimario onClick={onCrear} aria-label={copy.vacioCta}>
        <Plus size={18} strokeWidth={2.2} /> {copy.vacioCta}
      </BotonPrimario>
    </section>
  );
}

export default function MaestroQuizzes() {
  const { simuladores, quizzes, agregarEvaluacion, eliminarEvaluacion } = useMaterial();
  const [tabActiva, setTabActiva] = useState('simuladores');
  const [modalTipo, setModalTipo] = useState(null); // 'simulador' | 'quiz' | null

  const itemsActivos = tabActiva === 'simuladores' ? simuladores : quizzes;
  const tipoActivo = tabActiva === 'simuladores' ? 'simulador' : 'quiz';
  const copyActivo = TIPO_COPY[tipoActivo];
  const hayItems = itemsActivos.length > 0;

  function abrirModal() {
    setModalTipo(tipoActivo);
  }

  function handleGuardar(data) {
    agregarEvaluacion(modalTipo, data);
  }

  return (
    <div
      className="scrollbar-hide bg-fondo-app"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        color: '#cbd5e1',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px 24px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(28px, 5vw, 36px)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            Simuladores y quizzes
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            Arma simuladores con puntaje Ceneval y quizzes cortos por tema. Los verán tus alumnos.
          </p>
        </div>
        {hayItems && (
          <BotonPrimario onClick={abrirModal} aria-label={copyActivo.nuevoTitulo}>
            <Plus size={18} strokeWidth={2.2} /> {copyActivo.nuevoTitulo}
          </BotonPrimario>
        )}
      </header>

      <Pestanas
        valor={tabActiva}
        onCambio={setTabActiva}
        aria-label="Simuladores y quizzes"
      >
        <Pestanas.Lista>
          <Pestanas.Tab valor="simuladores">
            Simuladores
            {simuladores.length > 0 && (
              <span
                aria-hidden="true"
                style={{
                  marginLeft: 8,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(245,200,66,0.14)',
                  color: '#f5c842',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {simuladores.length}
              </span>
            )}
          </Pestanas.Tab>
          <Pestanas.Tab valor="quizzes">
            Quizzes
            {quizzes.length > 0 && (
              <span
                aria-hidden="true"
                style={{
                  marginLeft: 8,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(147,197,253,0.14)',
                  color: '#93c5fd',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {quizzes.length}
              </span>
            )}
          </Pestanas.Tab>
        </Pestanas.Lista>

        <Pestanas.Panel valor="simuladores">
          <div style={{ marginTop: 20 }}>
            {simuladores.length === 0 ? (
              <EstadoVacioPanel tipo="simulador" onCrear={() => setModalTipo('simulador')} />
            ) : (
              <ListadoPorMateria items={simuladores} onEliminar={eliminarEvaluacion} />
            )}
          </div>
        </Pestanas.Panel>

        <Pestanas.Panel valor="quizzes">
          <div style={{ marginTop: 20 }}>
            {quizzes.length === 0 ? (
              <EstadoVacioPanel tipo="quiz" onCrear={() => setModalTipo('quiz')} />
            ) : (
              <ListadoPorMateria items={quizzes} onEliminar={eliminarEvaluacion} />
            )}
          </div>
        </Pestanas.Panel>
      </Pestanas>

      <ModalNuevaEvaluacion
        tipo={modalTipo ?? 'quiz'}
        abierto={modalTipo !== null}
        onCerrar={() => setModalTipo(null)}
        onGuardar={handleGuardar}
      />
    </div>
  );
}
