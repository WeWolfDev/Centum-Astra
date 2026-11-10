// @vitest-environment jsdom
// Protege la regla de DESIGN.md › Don't: las pantallas migradas al tema no deben
// volver a escribir blanco, navy de página ni dorado brillante fijos en estilos
// inline o atributos SVG, porque en modo claro quedan ilegibles.
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const usuario = vi.hoisted(() => ({
  current: { name: 'Ana García', role: 'student', avatar: 'AG', email: 'ana@centum.mx' },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: usuario.current, logout: vi.fn() }),
}));
vi.mock('./supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  mockAuthEnabled: true,
}));

const { default: Header } = await import('../components/layout/Header');
const { default: Sidebar } = await import('../components/layout/Sidebar');
const { default: PublicNav } = await import('../components/layout/PublicNav');
const { default: StudentDashboard } = await import('../pages/student/StudentDashboard');
const { default: TeacherDashboard } = await import('../pages/teacher/TeacherDashboard');
const { default: Modulos } = await import('../pages/modules/Modulos');
const { default: Material } = await import('../pages/modules/Material');
const { default: VideoLibrary } = await import('../pages/video/VideoLibrary');
const { default: SimuladoresQuizzes } = await import('../pages/exam/SimuladoresQuizzes');
const { default: MaestroQuizzes } = await import('../pages/exam/MaestroQuizzes');
const { MaterialProvider } = await import('../context/MaterialContext');
const { ThemeProvider } = await import('../context/ThemeContext');

// jsdom normaliza los hex de `style` a rgb(r, g, b), así que se buscan ambas formas.
const COLORES_FIJOS = new RegExp(
  [
    '#fff\\b', '#ffffff', '#030a1a', '#0c1d45', '#f5c842',
    'rgba?\\(\\s*255\\s*,\\s*255\\s*,\\s*255\\b',
    'rgba?\\(\\s*3\\s*,\\s*10\\s*,\\s*26\\b',
    'rgba?\\(\\s*12\\s*,\\s*29\\s*,\\s*69\\b',
    'rgba?\\(\\s*245\\s*,\\s*200\\s*,\\s*66\\b',
  ].join('|'),
  'i',
);

function coloresFijos(contenedor) {
  const hallazgos = [];
  for (const el of contenedor.querySelectorAll('*')) {
    for (const atributo of ['style', 'fill', 'stroke', 'stop-color', 'color']) {
      const valor = el.getAttribute(atributo);
      if (valor && COLORES_FIJOS.test(valor)) hallazgos.push(`<${el.tagName.toLowerCase()} ${atributo}="${valor}">`);
    }
  }
  return hallazgos;
}

function renderizar(ui) {
  return render(
    <ThemeProvider habilitado>
      <MaterialProvider>{ui}</MaterialProvider>
    </ThemeProvider>,
  );
}

const ALUMNO = { name: 'Ana García', role: 'student', avatar: 'AG' };
const PROFESOR = { name: 'Sofía Ramírez', role: 'teacher', avatar: 'SR' };

async function expandirClases() {
  for (const boton of screen.queryAllByRole('button', { expanded: false })) {
    await userEvent.click(boton);
  }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', query => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
  window.scrollTo = () => {};
});
afterEach(cleanup);

describe('pantallas migradas al tema no usan colores fijos', () => {
  test('Header y Sidebar', () => {
    const { container } = renderizar(
      <>
        <Header activeSection="dashboard" onMenuToggle={() => {}} isMobile />
        <Sidebar activeSection="dashboard" setActiveSection={() => {}} isOpen onClose={() => {}} isMobile={false} />
      </>,
    );
    expect(screen.getByRole('button', { name: /activar modo/i })).toBeInTheDocument();
    expect(coloresFijos(container)).toEqual([]);
  });

  test.each(['Pensamiento Matemático', 'Pre-medicina'])(
    'PublicNav: selector de cursos y simulador de prueba de %s',
    async curso => {
      const { baseElement } = renderizar(<PublicNav onLoginClick={() => {}} />);
      await userEvent.click(screen.getByRole('button', { name: /cursos/i }));
      await userEvent.click(screen.getByRole('button', { name: new RegExp(curso) }));
      // AnimatePresence termina la salida del selector antes de montar el simulador.
      await screen.findByRole('button', { name: /anterior/i }, { timeout: 3000 });

      // Responde cada pregunta con la primera opción hasta ver el resultado.
      for (let i = 0; i < 20; i += 1) {
        const opcion = screen.queryAllByRole('button').find(b => /^A/.test(b.textContent.trim()) && !b.disabled);
        if (opcion) await userEvent.click(opcion);
        const final = screen.queryByRole('button', { name: /ver resultado/i });
        if (final) { await userEvent.click(final); break; }
        const siguiente = screen.queryByRole('button', { name: /siguiente/i });
        if (!siguiente) break;
        await userEvent.click(siguiente);
      }
      expect(coloresFijos(baseElement)).toEqual([]);
    },
  );

  test('inicio del alumno', () => {
    usuario.current = { name: 'Ana García', role: 'student', avatar: 'AG' };
    const { container } = renderizar(<StudentDashboard setActiveSection={() => {}} />);
    expect(screen.getByText(/Hola, Ana/)).toBeInTheDocument();
    expect(coloresFijos(container)).toEqual([]);
  });

  test('inicio del profesor', () => {
    usuario.current = { name: 'Sofía Ramírez', role: 'teacher', avatar: 'SR' };
    const { container } = renderizar(<TeacherDashboard />);
    expect(screen.getAllByText('Mis alumnos').length).toBeGreaterThan(0);
    expect(coloresFijos(container)).toEqual([]);
  });

  test('Módulos del alumno con las clases abiertas', async () => {
    usuario.current = ALUMNO;
    const { baseElement } = renderizar(<Modulos />);
    await expandirClases();
    expect(screen.getByRole('heading', { name: 'Módulos' })).toBeInTheDocument();
    expect(coloresFijos(baseElement)).toEqual([]);
  });

  test('Videoteca', () => {
    usuario.current = ALUMNO;
    const { baseElement } = renderizar(<VideoLibrary />);
    expect(screen.getByRole('heading', { name: 'Videoteca' })).toBeInTheDocument();
    expect(coloresFijos(baseElement)).toEqual([]);
  });

  test('Videoteca del personal con el modal para subir una sesión', async () => {
    usuario.current = PROFESOR;
    const { baseElement } = renderizar(<VideoLibrary />);
    await userEvent.click(screen.getByRole('button', { name: /subir sesión/i }));
    expect(screen.getByText('Duración')).toBeInTheDocument();
    expect(coloresFijos(baseElement)).toEqual([]);
  });

  test('Simuladores y quizzes del alumno', () => {
    usuario.current = ALUMNO;
    const { baseElement } = renderizar(<SimuladoresQuizzes customQuizzes={[]} onAddQuiz={() => {}} onDeleteQuiz={() => {}} />);
    expect(coloresFijos(baseElement)).toEqual([]);
  });

  test('Material del profesor con sus modales de clase y recurso', async () => {
    usuario.current = PROFESOR;
    const { baseElement } = renderizar(<Material />);
    await expandirClases();
    expect(coloresFijos(baseElement)).toEqual([]);

    await userEvent.click(screen.getAllByRole('button', { name: /subir recurso/i })[0]);
    expect(coloresFijos(baseElement)).toEqual([]);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Agregar nueva clase' }));
    expect(coloresFijos(baseElement)).toEqual([]);
  });

  test('Simuladores y quizzes del profesor con el modal de nueva evaluación', async () => {
    usuario.current = PROFESOR;
    const { baseElement } = renderizar(<MaestroQuizzes />);
    await userEvent.click(screen.getAllByRole('button', { name: /crear|nuevo/i })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(coloresFijos(baseElement)).toEqual([]);
  });
});
