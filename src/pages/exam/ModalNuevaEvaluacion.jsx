// Modal para crear una nueva evaluación (simulador o quiz).
// Form parametrizado por `tipo`; cambia solo título y copy. La lógica, los
// estilos y los textos son los mismos para ambos tipos — ver TIPO_COPY.
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { mockModules } from '../../data/mockData';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import { TIPO_COPY } from './tipoCopy';

function pregVacia() {
  return { enunciado: '', opciones: ['', '', '', ''], correcta: 0, explicacion: '' };
}

export default function ModalNuevaEvaluacion({ tipo, abierto, onCerrar, onGuardar }) {
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
