import { useId, useRef } from 'react';
import Modal from './Modal';
import Boton from './Boton';

// Diálogo de confirmación. Compuesto sobre Modal.
// tono:
//   'neutral' — acción no destructiva (p.ej. "guardar antes de salir")
//   'danger'  — acción destructiva (p.ej. "eliminar recurso")
//
// El foco inicial va a Cancelar porque es la opción menos destructiva: evita
// que un Enter accidental confirme una acción que no se puede deshacer.
export default function DialogoConfirmacion({
  abierto,
  tono = 'neutral',
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}) {
  const cancelarRef = useRef(null);
  const mensajeId = useId();

  const variantConfirmar = tono === 'danger' ? 'danger' : 'primario';

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCancelar}
      titulo={titulo}
      describedBy={mensaje ? mensajeId : undefined}
      ancho="sm"
      initialFocusRef={cancelarRef}
    >
      {mensaje && (
        <p id={mensajeId} className="m-0 text-sm text-white/80 leading-relaxed">
          {mensaje}
        </p>
      )}
      <footer className="flex gap-2.5 flex-wrap justify-end">
        <Boton ref={cancelarRef} variant="secundario" onClick={onCancelar}>
          {textoCancelar}
        </Boton>
        <Boton variant={variantConfirmar} onClick={onConfirmar}>
          {textoConfirmar}
        </Boton>
      </footer>
    </Modal>
  );
}
