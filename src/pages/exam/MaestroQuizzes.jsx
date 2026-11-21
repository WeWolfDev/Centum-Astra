// Simuladores y quizzes (admin) o solo quizzes (maestro).
// Cada pestaña tiene su propio listado, estado vacío y botón de crear.
//
// Reglas del HANDOFF que aplican:
//  - Simulador = da puntaje Ceneval y alimenta la gráfica del alumno.
//  - Quiz = aciertos sobre total. Nunca puntaje Ceneval.
//  - Visualmente: cards con acento azul claro rgb(var(--c-info)), pastilla por tipo.
//  - Sin degradado dorado, sin emojis.
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { mockModules } from '../../data/mockData';
import { useMaterial } from '../../context/MaterialContext';
import IconSubject from '../../components/rediseno/IconSubject';
import Pastilla from '../../components/rediseno/Pastilla';
import Pestanas from '../../components/rediseno/Pestanas';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import AvisoDatosEjemplo from '../../components/rediseno/AvisoDatosEjemplo';
import ModalNuevaEvaluacion from './ModalNuevaEvaluacion';
import { TIPO_COPY } from './tipoCopy';
import { AREA_POR_ID } from '../../config/areas';

function EvaluacionCreadaCard({ evaluacion, onEliminar }) {
  const materia = mockModules.find(m => m.id === evaluacion.moduleId);
  const key = AREA_POR_ID[evaluacion.moduleId]?.icono;
  const copy = TIPO_COPY[evaluacion.tipo];
  return (
    <article
      style={{
        padding: 18,
        borderRadius: 14,
        background: 'transparent',
        border: '1px solid rgb(var(--c-info) / 0.3)',
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
          background: 'rgb(var(--c-info) / 0.14)', color: 'rgb(var(--c-info))',
        }}
      >
        {key ? <IconSubject name={key} size={22} /> : null}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'rgb(var(--c-ink))' }}>
          {evaluacion.tema}
        </h3>
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', fontSize: 13, color: 'rgb(var(--c-ink) / 0.65)' }}>
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
          border: '1px solid rgb(var(--c-ink) / calc(0.1 * var(--borde-k)))',
          background: 'transparent', color: 'rgb(var(--c-ink) / 0.8)',
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
                color: 'rgb(var(--c-ink))',
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
        border: '1px dashed rgb(var(--c-ink) / 0.13)',
        background: 'rgb(var(--c-ink) / 0.03)',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: 22,
          color: 'rgb(var(--c-ink))',
          letterSpacing: '-0.02em',
        }}
      >
        {copy.vacioTitulo}
      </h2>
      <p style={{ margin: '8px 0 20px', fontSize: 14, color: 'rgb(var(--c-ink) / 0.65)' }}>
        {copy.vacioDescripcion}
      </p>
      <BotonPrimario onClick={onCrear} aria-label={copy.vacioCta}>
        <Plus size={18} strokeWidth={2.2} /> {copy.vacioCta}
      </BotonPrimario>
    </section>
  );
}

function ContadorTab({ total, color }) {
  if (total === 0) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        marginLeft: 8,
        padding: '2px 8px',
        borderRadius: 999,
        background: `rgb(var(${color}) / 0.14)`,
        color: `rgb(var(${color}))`,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {total}
    </span>
  );
}

function PanelEvaluaciones({ tipo, items, onCrear, onEliminar }) {
  return (
    <div style={{ marginTop: 20 }}>
      {items.length === 0 ? (
        <EstadoVacioPanel tipo={tipo} onCrear={onCrear} />
      ) : (
        <ListadoPorMateria items={items} onEliminar={onEliminar} />
      )}
    </div>
  );
}

// El maestro solo arma quizzes: según la matriz de permisos, los simuladores
// los crea el administrador (#37). `conSimuladores` agrega su pestaña.
export default function MaestroQuizzes({ conSimuladores = false }) {
  const { simuladores, quizzes, agregarEvaluacion, eliminarEvaluacion } = useMaterial();
  const [tabActiva, setTabActiva] = useState(conSimuladores ? 'simuladores' : 'quizzes');
  const [modalTipo, setModalTipo] = useState(null); // 'simulador' | 'quiz' | null

  const itemsActivos = tabActiva === 'simuladores' ? simuladores : quizzes;
  const tipoActivo = tabActiva === 'simuladores' ? 'simulador' : 'quiz';
  const copyActivo = TIPO_COPY[tipoActivo];
  const hayItems = itemsActivos.length > 0;
  const titulo = conSimuladores ? 'Simuladores y quizzes' : 'Quizzes';
  const descripcion = conSimuladores
    ? 'Arma simuladores con puntaje Ceneval y quizzes cortos por tema. Los verán tus alumnos.'
    : 'Arma quizzes cortos por tema para que tus alumnos repasen. Los verán tus alumnos.';

  function abrirModal() {
    setModalTipo(tipoActivo);
  }

  function handleGuardar(data) {
    agregarEvaluacion(modalTipo, data);
  }

  const panelQuizzes = (
    <PanelEvaluaciones
      tipo="quiz"
      items={quizzes}
      onCrear={() => setModalTipo('quiz')}
      onEliminar={eliminarEvaluacion}
    />
  );

  return (
    <div
      className="scrollbar-hide bg-fondo-app"
      style={{
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        color: 'rgb(var(--c-ink) / 0.8)',
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
              color: 'rgb(var(--c-ink))',
            }}
          >
            {titulo}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgb(var(--c-ink) / 0.7)' }}>
            {descripcion}
          </p>
        </div>
        {hayItems && (
          <BotonPrimario onClick={abrirModal} aria-label={copyActivo.nuevoTitulo}>
            <Plus size={18} strokeWidth={2.2} /> {copyActivo.nuevoTitulo}
          </BotonPrimario>
        )}
      </header>

      <AvisoDatosEjemplo>
        Lo que crees aquí se guarda solo en esta sesión hasta que las evaluaciones se conecten.
      </AvisoDatosEjemplo>

      {conSimuladores ? (
        <Pestanas valor={tabActiva} onCambio={setTabActiva} aria-label={titulo}>
          <Pestanas.Lista>
            <Pestanas.Tab valor="simuladores">
              Simuladores
              <ContadorTab total={simuladores.length} color="--c-gold-bright" />
            </Pestanas.Tab>
            <Pestanas.Tab valor="quizzes">
              Quizzes
              <ContadorTab total={quizzes.length} color="--c-info" />
            </Pestanas.Tab>
          </Pestanas.Lista>

          <Pestanas.Panel valor="simuladores">
            <PanelEvaluaciones
              tipo="simulador"
              items={simuladores}
              onCrear={() => setModalTipo('simulador')}
              onEliminar={eliminarEvaluacion}
            />
          </Pestanas.Panel>

          <Pestanas.Panel valor="quizzes">{panelQuizzes}</Pestanas.Panel>
        </Pestanas>
      ) : (
        panelQuizzes
      )}

      <ModalNuevaEvaluacion
        tipo={modalTipo ?? 'quiz'}
        abierto={modalTipo !== null}
        onCerrar={() => setModalTipo(null)}
        onGuardar={handleGuardar}
      />
    </div>
  );
}
