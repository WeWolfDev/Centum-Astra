import { useState } from 'react';
import Boton from '../../components/rediseno/Boton';
import BotonPrimario from '../../components/rediseno/BotonPrimario';
import BotonSecundario from '../../components/rediseno/BotonSecundario';
import Modal from '../../components/rediseno/Modal';
import DialogoConfirmacion from '../../components/rediseno/DialogoConfirmacion';
import EstadoVacio from '../../components/rediseno/EstadoVacio';
import Pastilla from '../../components/rediseno/Pastilla';
import StatCard from '../../components/rediseno/StatCard';
import { AvisoProvider, useAviso } from '../../components/rediseno/Aviso';
import IconSubject from '../../components/rediseno/IconSubject';
import { Trash2, Eye, Download, Users, CheckCircle, TrendingUp } from 'lucide-react';

// Página sandbox para verificar los componentes del rediseño.
// Solo se monta cuando import.meta.env.DEV y la URL trae ?sandbox=1
// (ver src/main.jsx). No entra al bundle de producción.

function Seccion({ titulo, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 font-display font-bold text-lg text-white tracking-tight">
        {titulo}
      </h2>
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-start gap-3">
        {children}
      </div>
    </section>
  );
}

function BotonTrigger({ onClick, children }) {
  return (
    <Boton variant="ghost" onClick={onClick}>
      {children}
    </Boton>
  );
}

function AvisoTriggers() {
  const { mostrar } = useAviso();
  return (
    <>
      <BotonTrigger onClick={() => mostrar({ tipo: 'info', titulo: 'Info', mensaje: 'Un aviso informativo.' })}>
        Aviso info
      </BotonTrigger>
      <BotonTrigger onClick={() => mostrar({ tipo: 'exito', titulo: 'Éxito', mensaje: 'Operación completada.' })}>
        Aviso éxito
      </BotonTrigger>
      <BotonTrigger onClick={() => mostrar({ tipo: 'advertencia', titulo: 'Advertencia', mensaje: 'Cuidado con esta acción.' })}>
        Aviso advertencia
      </BotonTrigger>
      <BotonTrigger onClick={() => mostrar({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo guardar.' })}>
        Aviso error
      </BotonTrigger>
    </>
  );
}

function Contenido() {
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [confirmarDangerAbierto, setConfirmarDangerAbierto] = useState(false);
  const [ultimaAccion, setUltimaAccion] = useState('');

  return (
    <main className="min-h-screen bg-space-void p-6 md:p-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 font-display font-bold text-3xl text-white tracking-tight">
          Sandbox de componentes
        </h1>
        <p className="m-0 text-sm text-white/60">
          Solo DEV · ruta <code className="text-info">?sandbox=1</code>
        </p>
      </header>

      <Seccion titulo="Boton · variantes">
        <Boton variant="primario">Primario</Boton>
        <Boton variant="secundario">Secundario</Boton>
        <Boton variant="ghost">Ghost</Boton>
        <Boton variant="danger">Danger</Boton>
      </Seccion>

      <Seccion titulo="Boton · size=sm (32px, para celdas de tabla)">
        <Boton size="sm" variant="primario">Primario sm</Boton>
        <Boton size="sm" variant="secundario">Secundario sm</Boton>
        <Boton size="sm" variant="ghost">Ghost sm</Boton>
        <Boton size="sm" variant="danger">Danger sm</Boton>
        <Boton size="sm" variant="primario" isLoading>Cargando</Boton>
      </Seccion>

      <Seccion titulo="Boton · estados">
        <Boton variant="primario" disabled>Primario disabled</Boton>
        <Boton variant="secundario" disabled>Secundario disabled</Boton>
        <Boton
          variant="primario"
          isLoading={cargando}
          onClick={() => {
            setCargando(true);
            setTimeout(() => setCargando(false), 1500);
          }}
        >
          {cargando ? 'Guardando…' : 'Click: isLoading 1.5s'}
        </Boton>
        <Boton variant="danger" isLoading>Danger loading</Boton>
      </Seccion>

      <Seccion titulo="Paridad: BotonPrimario (wrapper) vs. <button class='btn-gold-flat'> directo">
        <div className="flex items-center gap-3">
          <BotonPrimario onClick={() => setUltimaAccion('BotonPrimario wrapper')}>
            BotonPrimario
          </BotonPrimario>
          <span className="text-white/40">vs</span>
          <button type="button" className="btn-gold-flat">
            btn-gold-flat
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Paridad: BotonSecundario (wrapper) vs. <button class='btn-flat-secundario'> directo">
        <div className="flex items-center gap-3">
          <BotonSecundario onClick={() => setUltimaAccion('BotonSecundario wrapper')}>
            BotonSecundario
          </BotonSecundario>
          <span className="text-white/40">vs</span>
          <button type="button" className="btn-flat-secundario">
            btn-flat-secundario
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Paridad: usos reales con iconos (como en PdfCard)">
        <BotonSecundario aria-label="Ver archivo demo">
          <Eye size={15} strokeWidth={1.7} aria-hidden="true" />
          Ver
        </BotonSecundario>
        <BotonSecundario aria-label="Descargar archivo demo">
          <Download size={15} strokeWidth={1.7} aria-hidden="true" />
          Descargar
        </BotonSecundario>
        <BotonSecundario aria-label="Eliminar archivo demo">
          <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
          Eliminar
        </BotonSecundario>
      </Seccion>

      <Seccion titulo="Modal base">
        <Boton onClick={() => setModalAbierto(true)}>Abrir modal</Boton>
        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo="Modal de ejemplo"
        >
          <p className="m-0 text-white/80 text-sm">
            Un modal base con focus trap, Escape y retorno de foco.
          </p>
          <footer className="flex gap-2 justify-end">
            <Boton variant="secundario" onClick={() => setModalAbierto(false)}>
              Cerrar
            </Boton>
          </footer>
        </Modal>
      </Seccion>

      <Seccion titulo="Diálogo de confirmación">
        <Boton onClick={() => setConfirmarAbierto(true)}>Confirmar (neutral)</Boton>
        <Boton variant="danger" onClick={() => setConfirmarDangerAbierto(true)}>
          Confirmar (danger)
        </Boton>
        <DialogoConfirmacion
          abierto={confirmarAbierto}
          titulo="Guardar cambios"
          mensaje="¿Guardar antes de salir?"
          textoConfirmar="Guardar"
          onConfirmar={() => {
            setUltimaAccion('confirmado (neutral)');
            setConfirmarAbierto(false);
          }}
          onCancelar={() => setConfirmarAbierto(false)}
        />
        <DialogoConfirmacion
          abierto={confirmarDangerAbierto}
          tono="danger"
          titulo="Eliminar recurso"
          mensaje="Esta acción no se puede deshacer. ¿Continuar?"
          textoConfirmar="Eliminar"
          onConfirmar={() => {
            setUltimaAccion('confirmado (danger)');
            setConfirmarDangerAbierto(false);
          }}
          onCancelar={() => setConfirmarDangerAbierto(false)}
        />
      </Seccion>

      <Seccion titulo="Avisos (toast)">
        <AvisoTriggers />
      </Seccion>

      <Seccion titulo="Estado vacío">
        <EstadoVacio
          icono={<IconSubject name="reading" size={28} />}
          titulo="Aún no hay clases"
          descripcion="Crea tu primera clase para empezar a organizar tu curso."
          accion={<Boton variant="primario">Nueva clase</Boton>}
        />
      </Seccion>

      <Seccion titulo="Pastilla · tonos semánticos">
        <Pastilla tono="positivo">Aprobado</Pastilla>
        <Pastilla tono="advertencia">Pendiente</Pastilla>
        <Pastilla tono="peligro">Rechazado</Pastilla>
        <Pastilla tono="negativo">Dado de baja</Pastilla>
        <Pastilla tono="neutral">Neutral</Pastilla>
      </Seccion>

      <Seccion titulo="StatCard · tonos">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <StatCard
            icono={Users}
            cifra="248"
            etiqueta="Total alumnos"
            tono="dorado"
            cambio="+8%"
            degradado
          />
          <StatCard
            icono={CheckCircle}
            cifra="192"
            etiqueta="Alumnos activos"
            tono="exito"
            cambio="+4%"
          />
          <StatCard
            icono={TrendingUp}
            cifra="72%"
            etiqueta="Progreso promedio"
            tono="info"
            cambio="-2%"
            cambioUp={false}
          />
          <StatCard
            icono={TrendingUp}
            cifra="312"
            etiqueta="Alumnos evaluados"
            tono="violeta"
          />
        </div>
      </Seccion>

      {ultimaAccion && (
        <p className="text-white/50 text-xs">Última acción: {ultimaAccion}</p>
      )}
    </main>
  );
}

export default function Componentes() {
  return (
    <AvisoProvider>
      <Contenido />
    </AvisoProvider>
  );
}
