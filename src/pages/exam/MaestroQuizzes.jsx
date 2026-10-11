// Simuladores y quizzes (maestro/admin).
// Dos pestañas con su propio listado, estado vacío y botón de crear.
//
// Reglas del HANDOFF que aplican:
//  - Simulador = da puntaje Ceneval y alimenta la gráfica del alumno.
//  - Quiz = aciertos sobre total. Nunca puntaje Ceneval.
//  - Visualmente: cards con acento azul claro #93c5fd, pastilla por tipo.
//  - Sin degradado dorado, sin emojis.
import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { mockModules } from '../../data/mockData';
import { useMaterial } from '../../context/MaterialContext';
import IconSubject from '../../components/rediseno/IconSubject';
import Pastilla from '../../components/rediseno/Pastilla';
import Pestanas from '../../components/rediseno/Pestanas';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';

const SUBJECT_BY_ICON = {
  Sigma: 'math',
  Book: 'reading',
  PenTool: 'writing',
  Stethoscope: 'premed',
  HeartPulse: 'health',
};

// Copy por tipo. Agrupa en un solo mapa para que el componente no se ramifique.
const TIPO_COPY = {
  simulador: {
    singular: 'simulador',
    singularMay: 'Simulador',
    nuevoTitulo: 'Nuevo simulador',
    nombrePh: 'Simulador EXANI-II · set 1',
    aparecera: 'Este simulador aparecerá para los alumnos y su puntaje alimenta su gráfica.',
    vacioTitulo: 'Aún no has creado simuladores',
    vacioDescripcion: 'Un simulador largo con puntaje Ceneval le sirve al alumno para medir su progreso.',
    vacioCta: 'Crear mi primer simulador',
    tono: 'tipo-simulador',
  },
  quiz: {
    singular: 'quiz',
    singularMay: 'Quiz',
    nuevoTitulo: 'Nuevo quiz',
    nombrePh: 'Álgebra básica · set 1',
    aparecera: 'Este quiz aparecerá para los alumnos como un cuestionario corto.',
    vacioTitulo: 'Aún no has creado quizzes',
    vacioDescripcion: 'Un quiz corto por tema te sirve para que tus alumnos repasen antes del simulador.',
    vacioCta: 'Crear mi primer quiz',
    tono: 'tipo-quiz',
  },
};

function pregVacia() {
  return { enunciado: '', opciones: ['', '', '', ''], correcta: 0, explicacion: '' };
}

function ModalNuevaEvaluacion({ tipo, abierto, onCerrar, onGuardar }) {
  const copy = TIPO_COPY[tipo];
  const [tema, setTema] = useState('');
  const [moduleId, setModuleId] = useState(mockModules[0]?.id ?? null);
  const [preguntas, setPreguntas] = useState([pregVacia()]);
  const [error, setError] = useState('');

  function reset() {
    setTema('');
    setModuleId(mockModules[0]?.id ?? null);
    setPreguntas([pregVacia()]);
    setError('');
  }

  function handleCerrar() {
    reset();
    onCerrar();
  }

  function actualizarPregunta(i, patch) {
    setPreguntas(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function actualizarOpcion(i, j, valor) {
    setPreguntas(prev =>
      prev.map((p, idx) => {
        if (idx !== i) return p;
        const opciones = p.opciones.slice();
        opciones[j] = valor;
        return { ...p, opciones };
      }),
    );
  }

  function agregarPregunta() {
    setPreguntas(prev => [...prev, pregVacia()]);
  }

  function quitarPregunta(i) {
    setPreguntas(prev => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function handleGuardar(e) {
    e.preventDefault();
    if (!tema.trim()) return setError(`Dale un nombre al ${copy.singular}.`);
    if (!moduleId) return setError('Selecciona una materia.');
    const invalid = preguntas.findIndex(p => !p.enunciado.trim() || p.opciones.some(o => !o.trim()));
    if (invalid !== -1) return setError(`Completa el enunciado y las 4 opciones de la pregunta ${invalid + 1}.`);
    onGuardar({ tema: tema.trim(), moduleId, preguntas });
    reset();
    onCerrar();
  }

  if (!abierto) return null;

  const materia = mockModules.find(m => m.id === moduleId);

  return (
    <>
      <div
        onClick={handleCerrar}
        role="presentation"
        style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,26,0.82)', zIndex: 199 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-eval-titulo"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          pointerEvents: 'none',
        }}
      >
        <form
          onSubmit={handleGuardar}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 720,
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#060c20',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            color: '#e2e8f0',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <h2
              id="modal-eval-titulo"
              style={{
                margin: 0,
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 22,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              {copy.nuevoTitulo}
            </h2>
            <button
              type="button"
              onClick={handleCerrar}
              aria-label="Cerrar"
              style={{
                flex: '0 0 36px',
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </header>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ flex: '2 1 240px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Nombre del {copy.singular}</span>
              <input
                type="text"
                value={tema}
                onChange={e => setTema(e.target.value)}
                placeholder={copy.nombrePh}
                style={{
                  minHeight: 44, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.13)',
                  background: 'rgba(12,29,69,0.5)', color: '#e2e8f0',
                  font: 'inherit', fontSize: 15, outline: 'none',
                }}
              />
            </label>
            <label style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Materia</span>
              <select
                value={moduleId ?? ''}
                onChange={e => setModuleId(Number(e.target.value))}
                style={{
                  minHeight: 44, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.13)',
                  background: 'rgba(12,29,69,0.5)', color: '#e2e8f0',
                  font: 'inherit', fontSize: 15, outline: 'none',
                }}
              >
                {mockModules.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#0c1d45' }}>{m.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {preguntas.map((p, i) => (
              <section
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(147,197,253,0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>Pregunta {i + 1}</span>
                  {preguntas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarPregunta(i)}
                      aria-label={`Quitar pregunta ${i + 1}`}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: '#cbd5e1',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </header>
                <textarea
                  value={p.enunciado}
                  onChange={e => actualizarPregunta(i, { enunciado: e.target.value })}
                  placeholder="Enunciado…"
                  rows={2}
                  style={{
                    minHeight: 60, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.13)',
                    background: 'rgba(12,29,69,0.5)', color: '#e2e8f0',
                    font: 'inherit', fontSize: 15, outline: 'none', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.opciones.map((op, j) => (
                    <label
                      key={j}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 10,
                        background: p.correcta === j ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                        border: p.correcta === j
                          ? '1px solid rgba(52,211,153,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <input
                        type="radio"
                        name={`correcta-${i}`}
                        checked={p.correcta === j}
                        onChange={() => actualizarPregunta(i, { correcta: j })}
                        aria-label={`Marcar opción ${String.fromCharCode(65 + j)} como correcta`}
                        style={{ accentColor: '#34d399' }}
                      />
                      <span
                        style={{
                          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.05)',
                          color: p.correcta === j ? '#34d399' : '#cbd5e1',
                          fontWeight: 700, fontSize: 12,
                        }}
                      >
                        {String.fromCharCode(65 + j)}
                      </span>
                      <input
                        type="text"
                        value={op}
                        onChange={e => actualizarOpcion(i, j, e.target.value)}
                        placeholder={`Opción ${String.fromCharCode(65 + j)}`}
                        style={{
                          flex: 1, minWidth: 0, minHeight: 36, padding: '6px 10px',
                          borderRadius: 8, border: 0,
                          background: 'transparent', color: '#e2e8f0',
                          font: 'inherit', fontSize: 14, outline: 'none',
                        }}
                      />
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={p.explicacion}
                  onChange={e => actualizarPregunta(i, { explicacion: e.target.value })}
                  placeholder="Explicación (opcional)"
                  style={{
                    minHeight: 40, padding: '8px 14px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)', color: '#cbd5e1',
                    font: 'inherit', fontSize: 13, outline: 'none',
                  }}
                />
              </section>
            ))}
            <BotonSecundario type="button" onClick={agregarPregunta} aria-label="Agregar pregunta">
              <Plus size={16} strokeWidth={2} /> Agregar pregunta
            </BotonSecundario>
          </div>

          {materia && (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              {copy.aparecera} ({materia.title})
            </p>
          )}

          {error && <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>{error}</p>}

          <footer style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <BotonSecundario type="button" onClick={handleCerrar}>Cancelar</BotonSecundario>
            <BotonPrimario type="submit">Publicar {copy.singular}</BotonPrimario>
          </footer>
        </form>
      </div>
    </>
  );
}

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
