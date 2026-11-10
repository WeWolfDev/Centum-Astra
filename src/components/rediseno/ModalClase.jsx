import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import BotonPrimario from './BotonPrimario';
import BotonSecundario from './BotonSecundario';

// Modal pequeño para agregar una nueva clase a un módulo.
export default function ModalClase({ abierto, onCerrar, onSubmit, nombreMateria }) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (abierto) {
      setLabel('');
      setError('');
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) {
      setError('Agrega un nombre a la clase.');
      return;
    }
    onSubmit(label.trim());
    onCerrar();
  }

  return (
    <>
      <div
        onClick={onCerrar}
        role="presentation"
        style={{ position: 'fixed', inset: 0, background: 'rgb(var(--c-void) / 0.82)', zIndex: 199 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-clase-titulo"
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
          onSubmit={handleSubmit}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 440,
            background: 'rgb(var(--c-deep))',
            border: '1px solid rgb(var(--c-ink) / calc(0.08 * var(--borde-k)))',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            color: 'rgb(var(--c-ink) / 0.9)',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h2
                id="modal-clase-titulo"
                style={{
                  margin: 0,
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'rgb(var(--c-ink))',
                  letterSpacing: '-0.02em',
                }}
              >
                Nueva clase
              </h2>
              {nombreMateria && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgb(var(--c-ink) / 0.7)' }}>
                  {nombreMateria}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              style={{
                flex: '0 0 36px',
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgb(var(--c-ink) / calc(0.1 * var(--borde-k)))',
                background: 'rgb(var(--c-ink) / 0.04)',
                color: 'rgb(var(--c-ink) / 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </header>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgb(var(--c-ink) / 0.7)' }}>
              Nombre de la clase
            </span>
            <input
              ref={firstInputRef}
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ecuaciones de primer grado"
              style={{
                minHeight: 44,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgb(var(--c-ink) / calc(0.13 * var(--borde-k)))',
                background: 'rgb(var(--c-navy) / 0.5)',
                color: 'rgb(var(--c-ink) / 0.9)',
                font: 'inherit',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--c-peligro))' }}>{error}</p>
          )}

          <footer style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <BotonSecundario type="button" onClick={onCerrar}>Cancelar</BotonSecundario>
            <BotonPrimario type="submit">Crear</BotonPrimario>
          </footer>
        </form>
      </div>
    </>
  );
}
