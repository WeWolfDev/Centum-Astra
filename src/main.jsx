import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Sandbox dev-only: ?sandbox=1 renderiza la página de pruebas de componentes
// en lugar de la app principal. El import es dinámico para que no entre al
// bundle de producción (import.meta.env.DEV queda tree-shaken en build).
const esSandbox =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('sandbox');

if (esSandbox) {
  import('./pages/_sandbox/Componentes.jsx').then(({ default: Componentes }) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <Componentes />
      </StrictMode>,
    );
  });
} else {
  Promise.all([
    import('./App.jsx'),
    import('./components/rediseno/Aviso.jsx'),
  ]).then(([{ default: App }, { AvisoProvider }]) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <AvisoProvider>
          <App />
        </AvisoProvider>
      </StrictMode>,
    );
  });
}
