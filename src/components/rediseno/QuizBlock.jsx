import { ChevronRight } from 'lucide-react';

// Bloque de contorno con acento azul claro (#93c5fd) para quizzes por tema.
// Quiz = aciertos / total. Nunca puntaje Ceneval.
export default function QuizBlock({ tema, aciertos, total, onEntrar, children }) {
  const hasScore = typeof aciertos === 'number' && typeof total === 'number';

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.3,
              color: '#ffffff',
            }}
          >
            {tema}
          </h3>
          {hasScore && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
              {aciertos} / {total}
            </p>
          )}
        </div>
        {onEntrar && <ChevronRight size={16} color="#93c5fd" aria-hidden="true" />}
      </div>
      {children}
    </>
  );

  const styleCard = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: '1px solid rgba(147,197,253,0.3)',
    borderRadius: 14,
    padding: '16px 18px',
    color: '#e2e8f0',
    cursor: onEntrar ? 'pointer' : 'default',
    transition: 'border-color 0.15s ease, background 0.15s ease',
  };

  if (onEntrar) {
    return (
      <button type="button" onClick={onEntrar} style={styleCard}>
        {content}
      </button>
    );
  }
  return <div style={styleCard}>{content}</div>;
}
