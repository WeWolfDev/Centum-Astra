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
        style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,26,0.82)', zIndex: 199 }}
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
            background: '#060c20',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            color: '#e2e8f0',
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
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Nueva clase
              </h2>
              {nombreMateria && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
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

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
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
                border: '1px solid rgba(255,255,255,0.13)',
                background: 'rgba(12,29,69,0.5)',
                color: '#e2e8f0',
                font: 'inherit',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>{error}</p>
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
