// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const usuario = vi.hoisted(() => ({ current: null }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: usuario.current, logout: vi.fn() }),
}));

const { default: Sidebar } = await import('./Sidebar');

afterEach(cleanup);

function menuDe(role, props = {}) {
  usuario.current = { name: 'Persona de Prueba', role, avatar: 'PP' };
  render(<Sidebar activeSection="dashboard" setActiveSection={() => {}} {...props} />);
  const nav = screen.getByRole('navigation', { name: 'Secciones' });
  return within(nav).getAllByRole('button').map((b) => b.textContent);
}

// Matriz de permisos aprobada: docs/RESPUESTAS_Y_PREGUNTAS_PENDIENTES_CLIENTE.md
describe('Sidebar: menú por rol', () => {
  test('el administrador ve cuentas, cursos, material, evaluaciones y pagos', () => {
    expect(menuDe('admin')).toEqual(['Cuentas', 'Cursos', 'Material', 'Simuladores y quizzes', 'Pagos']);
  });

  test('el profesor ve sus alumnos, material y solo quizzes (no crea simuladores)', () => {
    expect(menuDe('teacher')).toEqual(['Mis alumnos', 'Material', 'Quizzes']);
  });

  test('el alumno ve inicio, módulos, videoteca y evaluaciones', () => {
    expect(menuDe('student')).toEqual(['Inicio', 'Módulos', 'Videoteca', 'Simuladores y quizzes']);
  });

  test('la sección activa se anuncia con aria-current, no solo con color', () => {
    menuDe('student', { activeSection: 'videos' });
    expect(screen.getByRole('button', { name: 'Videoteca' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  test('se navega con el teclado', async () => {
    const setActiveSection = vi.fn();
    menuDe('teacher', { setActiveSection });
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Material' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(setActiveSection).toHaveBeenCalledWith('modules');
  });

  test('en móvil el botón de cerrar tiene nombre accesible', async () => {
    const onClose = vi.fn();
    menuDe('student', { isMobile: true, isOpen: true, onClose });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(onClose).toHaveBeenCalled();
  });
});
