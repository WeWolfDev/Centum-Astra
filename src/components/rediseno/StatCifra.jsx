// Cifra grande en Bricolage 800 + etiqueta pequeña.
// tono: 'blanco' (default) | 'dorado' | 'suave'.
const COLORES = {
  blanco: '#ffffff',
  dorado: '#f5c842',
  suave:  '#cbd5e1',
};

export default function StatCifra({ cifra, etiqueta, tono = 'blanco', size = 'md' }) {
  const color = COLORES[tono] || COLORES.blanco;
  const fontSize = size === 'lg' ? 48 : size === 'sm' ? 24 : 34;
  return (
    <div>
      <p
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color,
          margin: 0,
        }}
      >
        {cifra}
      </p>
      {etiqueta && (
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          {etiqueta}
        </p>
      )}
    </div>
  );
}
