// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({ loadStudentAreas: vi.fn() }));

vi.mock('../../lib/areasExtraService', () => fake);

const { default: ModalAreasAlumno } = await import('./ModalAreasAlumno');

const GRUPOS = [{ id: 'g1', name: 'Grupo A', course: 'Curso', courseId: 'c1' }];
const ALUMNO = { id: 'a1', name: 'Ana', role: 'student', groups: [{ id: 'g1', name: 'Grupo A' }] };
const PROPS = { guardando: false, error: '', onCerrar: () => {} };

function montar(props = {}) {
  const onGuardar = vi.fn();
  render(<ModalAreasAlumno usuario={ALUMNO} grupos={GRUPOS} onGuardar={onGuardar} {...PROPS} {...props} />);
  return { onGuardar };
}

beforeEach(() => {
  fake.loadStudentAreas.mockReset();
  fake.loadStudentAreas.mockResolvedValue({
    modules: [{ id: 'm1', title: 'Matemático' }, { id: 'm2', title: 'Premedicina' }, { id: 'm3', title: 'Salud' }],
    fromGroup: ['m1'],
    extra: ['m2'],
  });
});

afterEach(cleanup);

describe('ModalAreasAlumno', () => {
  test('carga las áreas del curso del grupo del alumno', async () => {
    montar();
    expect(await screen.findByLabelText(/Premedicina/)).toBeChecked();
    expect(fake.loadStudentAreas).toHaveBeenCalledWith('a1', GRUPOS[0]);
  });

  test('las áreas del grupo aparecen incluidas y no se pueden quitar', async () => {
    montar();
    const matematico = await screen.findByLabelText(/Matemático/);
    expect(matematico).toBeChecked();
    expect(matematico).toBeDisabled();
    expect(screen.getByText(/incluida en su grupo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Salud/)).not.toBeChecked();
  });

  test('guarda las áreas extra elegidas', async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();
    await usuario.click(await screen.findByLabelText(/Salud/));
    await usuario.click(screen.getByLabelText(/Premedicina/));
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onGuardar).toHaveBeenCalledWith(['m2'], ['m3']);
  });

  test('pide asignar un grupo antes de elegir áreas', () => {
    montar({ usuario: { ...ALUMNO, groups: [] } });
    expect(screen.getByText(/Asigna primero un grupo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
    expect(fake.loadStudentAreas).not.toHaveBeenCalled();
  });

  test('espera a que carguen los grupos', () => {
    montar({ grupos: [], cargandoGrupos: true });
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(fake.loadStudentAreas).not.toHaveBeenCalled();
  });

  test('avisa si el grupo del alumno ya no está activo', () => {
    montar({ grupos: [] });
    expect(screen.getByText(/ya no está activo/)).toBeInTheDocument();
  });

  test('avisa si el grupo ya incluye todas las áreas', async () => {
    fake.loadStudentAreas.mockResolvedValue({ modules: [{ id: 'm1', title: 'Matemático' }], fromGroup: ['m1'], extra: [] });
    montar();
    expect(await screen.findByText(/ya incluye todas las áreas/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });

  test('avisa si el curso no tiene módulos', async () => {
    fake.loadStudentAreas.mockResolvedValue({ modules: [], fromGroup: [], extra: [] });
    montar();
    expect(await screen.findByText('Este curso aún no tiene módulos.')).toBeInTheDocument();
  });

  test('muestra el error de carga', async () => {
    fake.loadStudentAreas.mockRejectedValue(new Error('No pudimos cargar las áreas.'));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las áreas');
  });

  test('muestra el error al guardar', () => {
    montar({ error: 'No se pudieron guardar las áreas.' });
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron guardar');
  });
});
