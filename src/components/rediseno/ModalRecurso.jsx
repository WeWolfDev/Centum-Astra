import { useEffect, useRef, useState } from 'react';
import { X, FileText, Play } from 'lucide-react';
import BotonPrimario from './BotonPrimario';
import BotonSecundario from './BotonSecundario';

// Modal para subir un recurso (PDF o video) a una clase.
// Mock sin backend: el archivo real no se persiste; se guarda nombre + size.
// Si es video, pregunta si publicar también en Videoteca.
export default function ModalRecurso({
  abierto,
  onCerrar,
  onSubmit,
  tipoInicial = 'pdf',
  nombreClase,
  nombreMateria,
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [titulo, setTitulo] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const [archivoSize, setArchivoSize] = useState('');
  const [duracion, setDuracion] = useState('');
  const [instructor, setInstructor] = useState('');
  const [enVideoteca, setEnVideoteca] = useState(true);
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (abierto) {
      setTipo(tipoInicial);
      setTitulo('');
      setArchivoNombre('');
      setArchivoSize('');
      setDuracion('');
      setInstructor('');
      setEnVideoteca(true);
      setError('');
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [abierto, tipoInicial]);

  useEffect(() => {
    if (!abierto) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoNombre(file.name);
    const kb = file.size / 1024;
    setArchivoSize(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);
    if (!titulo) setTitulo(file.name.replace(/\.[^.]+$/, ''));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Agrega un título.');
      return;
    }
    if (!archivoNombre) {
      setError('Elige un archivo.');
      return;
    }
    if (tipo === 'pdf') {
      onSubmit({ tipo: 'pdf', data: { name: titulo.trim(), size: archivoSize } });
    } else {
      onSubmit({
        tipo: 'video',
        data: {
          title: titulo.trim(),
          duration: duracion.trim(),
          instructor: instructor.trim(),
        },
        enVideoteca,
      });
    }
    onCerrar();
  }

  return (
    <>
      <div
        onClick={onCerrar}
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3,10,26,0.82)',
          zIndex: 199,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-recurso-titulo"
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
            maxWidth: 540,
            maxHeight: '90vh',
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
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <h2
                id="modal-recurso-titulo"
                style={{
                  margin: 0,
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Subir recurso
              </h2>
              {(nombreClase || nombreMateria) && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {nombreMateria && <span>{nombreMateria}</span>}
                  {nombreMateria && nombreClase && <span> · </span>}
                  {nombreClase && <span>{nombreClase}</span>}
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

          {/* Tipo */}
          <div role="group" aria-label="Tipo de recurso" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { v: 'pdf', label: 'PDF', Icon: FileText },
              { v: 'video', label: 'Video', Icon: Play },
            ].map(({ v, label, Icon }) => {
              const active = tipo === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTipo(v)}
                  aria-pressed={active}
                  style={{
                    flex: '1 1 140px',
                    minHeight: 48,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: active ? '1.5px solid #f5c842' : '1.5px solid rgba(255,255,255,0.13)',
                    background: active ? 'rgba(245,200,66,0.1)' : 'transparent',
                    color: active ? '#ffffff' : '#cbd5e1',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Título */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Título</span>
            <input
              ref={firstInputRef}
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder={tipo === 'pdf' ? 'Apuntes de la sesión' : 'Clase grabada: Álgebra'}
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

          {/* Archivo */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Archivo
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <input
                type="file"
                accept={tipo === 'pdf' ? '.pdf,application/pdf' : 'video/*'}
                onChange={handleFile}
                style={{ flex: 1, color: '#cbd5e1', font: 'inherit', fontSize: 13 }}
              />
            </div>
            {archivoNombre && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {archivoNombre}
                {archivoSize ? ` · ${archivoSize}` : ''}
              </span>
            )}
          </label>

          {tipo === 'video' && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                    Duración
                  </span>
                  <input
                    type="text"
                    value={duracion}
                    onChange={e => setDuracion(e.target.value)}
                    placeholder="1:30:00"
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
                <label style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                    Instructor
                  </span>
                  <input
                    type="text"
                    value={instructor}
                    onChange={e => setInstructor(e.target.value)}
                    placeholder="Mtra. Sofía Ramírez"
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
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enVideoteca}
                  onChange={e => setEnVideoteca(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#f5c842' }}
                />
                <span style={{ fontSize: 14, color: '#e2e8f0' }}>
                  Publicar también en la Videoteca general
                </span>
              </label>
            </>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>
              {error}
            </p>
          )}

          <footer style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <BotonSecundario type="button" onClick={onCerrar}>Cancelar</BotonSecundario>
            <BotonPrimario type="submit">Guardar</BotonPrimario>
          </footer>
        </form>
      </div>
    </>
  );
}
