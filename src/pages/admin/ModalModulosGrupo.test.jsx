// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({ loadGroupModules: vi.fn() }));

vi.mock('../../lib/groupModulesService', () => fake);

const { default: ModalModulosGrupo } = await import('./ModalModulosGrupo');

const GRUPOS = [
  { id: 'g1', name: 'Grupo A', course: 'Curso', courseId: 'c1' },
  { id: 'g2', name: 'Grupo B', course: 'Curso', courseId: 'c1' },
];

function montar(props = {}) {
  const onGuardar = vi.fn();
  render(<ModalModulosGrupo grupos={GRUPOS} claseSelect="" guardando={false} error="" onGuardar={onGuardar} onCerrar={() => {}} {...props} />);
  return { onGuardar };
}

beforeEach(() => {
  fake.loadGroupModules.mockReset();
  fake.loadGroupModules.mockResolvedValue({
    modules: [{ id: 'm1', title: 'Álgebra' }, { id: 'm2', title: 'Lectura' }],
    enabled: ['m1'],
  });
});

afterEach(cleanup);

describe('ModalModulosGrupo', () => {
  test('marca los módulos habilitados del grupo', async () => {
    montar();
    expect(await screen.findByLabelText('Álgebra')).toBeChecked();
    expect(screen.getByLabelText('Lectura')).not.toBeChecked();
  });

  test('si los grupos llegan con el diálogo abierto, carga los módulos del primero', async () => {
    const props = { claseSelect: '', guardando: false, error: '', onGuardar: () => {}, onCerrar: () => {} };
    const { rerender } = render(<ModalModulosGrupo grupos={[]} cargandoGrupos {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    rerender(<ModalModulosGrupo grupos={GRUPOS} {...props} />);
    expect(await screen.findByLabelText('Álgebra')).toBeChecked();
    expect(fake.loadGroupModules).toHaveBeenCalledWith(GRUPOS[0]);
    expect(screen.getByLabelText('Grupo')).toHaveValue('g1');
  });

  test('guarda la selección nueva', async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();
    await usuario.click(await screen.findByLabelText('Lectura'));
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onGuardar).toHaveBeenCalledWith(GRUPOS[0], ['m1'], ['m1', 'm2']);
  });

  test('carga los módulos al cambiar de grupo', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByLabelText('Álgebra');
    await usuario.selectOptions(screen.getByLabelText('Grupo'), 'g2');
    await screen.findByLabelText('Álgebra');
    expect(fake.loadGroupModules).toHaveBeenLastCalledWith(GRUPOS[1]);
  });

  test('avisa si el curso no tiene módulos y no permite guardar', async () => {
    fake.loadGroupModules.mockResolvedValue({ modules: [], enabled: [] });
    montar();
    expect(await screen.findByText('Este curso aún no tiene módulos.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });

  test('muestra el error de carga', async () => {
    fake.loadGroupModules.mockRejectedValue(new Error('No pudimos cargar los módulos.'));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar');
  });
});
