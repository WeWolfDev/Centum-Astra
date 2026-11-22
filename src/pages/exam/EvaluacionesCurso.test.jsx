// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const sesion = vi.hoisted(() => ({ user: { id: 'admin', role: 'admin' } }));
const fake = vi.hoisted(() => ({
  listMaterialCourses: vi.fn(),
  listCourseEvaluations: vi.fn(),
  loadEvaluation: vi.fn(),
  createEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
  publishEvaluation: vi.fn(),
  archiveEvaluation: vi.fn(),
  deleteEvaluation: vi.fn(),
  addQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: sesion.user }) }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: {}, isSupabaseConfigured: true }));
vi.mock('../../lib/materialService', () => ({ listMaterialCourses: fake.listMaterialCourses }));
vi.mock('../../lib/evaluacionesGestionService', async () => {
  const real = await vi.importActual('../../lib/evaluacionesGestionService');
  const { listMaterialCourses, ...servicio } = fake;
  void listMaterialCourses;
  return { ...real, ...servicio };
});

const { default: MaestroQuizzes } = await import('./MaestroQuizzes');

const CURSOS = [
  { id: 'c1', name: 'EXANI-II', modules: [{ id: 'm1', title: 'Pensamiento matemático' }, { id: 'm2', title: 'Comprensión lectora' }] },
  { id: 'c2', name: 'Pre-medicina', modules: [] },
];

const evaluacion = (extra = {}) => ({
  id: 'e1', courseId: 'c1', moduleId: null, kind: 'simulador', title: 'Simulador 1', description: '',
  timeLimitMinutes: 90, status: 'draft', createdBy: 'admin', publishedAt: null, questionCount: 1, attemptCount: 0,
  ...extra,
});

const PREGUNTA = {
  id: 'q1', position: 0, prompt: '¿Cuánto es 2 + 2?', explanation: 'Suma básica.',
  correctOptionIds: ['o1'], options: [{ id: 'o1', body: '4' }, { id: 'o2', body: '5' }],
};

const detalle = (extra = {}) => ({ ...evaluacion(extra), nextPosition: 1, questions: [PREGUNTA], ...extra });

beforeEach(() => {
  Object.values(fake).forEach(f => f.mockReset());
  sesion.user = { id: 'admin', role: 'admin' };
  fake.listMaterialCourses.mockResolvedValue(CURSOS);
  fake.listCourseEvaluations.mockResolvedValue([
    evaluacion(),
    evaluacion({ id: 'e2', kind: 'quiz', title: 'Quiz de fracciones', moduleId: 'm1', timeLimitMinutes: null, status: 'published', createdBy: 'profe' }),
  ]);
  fake.loadEvaluation.mockResolvedValue(detalle());
  for (const accion of ['createEvaluation', 'updateEvaluation', 'publishEvaluation', 'archiveEvaluation', 'deleteEvaluation', 'addQuestion', 'updateQuestion', 'deleteQuestion']) {
    fake[accion].mockResolvedValue(undefined);
  }
});
afterEach(cleanup);

async function abrirEditor(nombre = 'Abrir Simulador 1') {
  render(<MaestroQuizzes conSimuladores />);
  await userEvent.click(await screen.findByRole('button', { name: nombre }));
  return screen.findByRole('heading', { level: 2, name: /Simulador 1|Quiz/ });
}

describe('lista de evaluaciones', () => {
  test('el administrador ve simuladores y quizzes por pestaña, con estado y área', async () => {
    render(<MaestroQuizzes conSimuladores />);
    expect(await screen.findByRole('tab', { name: 'Simuladores (1)' })).toHaveAttribute('aria-selected', 'true');
    const simulador = screen.getByRole('listitem');
    expect(within(simulador).getByText('Borrador')).toBeInTheDocument();
    expect(within(simulador).getByText('Todas las áreas')).toBeInTheDocument();
    expect(within(simulador).getByText(/90 min/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Cuestionarios y quizzes (1)' }));
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Pensamiento matemático')).toBeInTheDocument();
    expect(fake.listCourseEvaluations).toHaveBeenCalledWith('c1', { includeArchived: false });
  });

  test('cambia de curso y puede mostrar las archivadas', async () => {
    render(<MaestroQuizzes conSimuladores />);
    await userEvent.selectOptions(await screen.findByLabelText('Curso'), 'c2');
    await waitFor(() => expect(fake.listCourseEvaluations).toHaveBeenCalledWith('c2', { includeArchived: false }));
    await userEvent.click(await screen.findByLabelText('Mostrar archivadas'));
    await waitFor(() => expect(fake.listCourseEvaluations).toHaveBeenCalledWith('c2', { includeArchived: true }));
  });

  test('el profesor no tiene pestañas ni puede crear simuladores', async () => {
    sesion.user = { id: 'profe', role: 'teacher' };
    fake.listMaterialCourses.mockResolvedValue([CURSOS[0]]);
    fake.listCourseEvaluations.mockResolvedValue([]);
    render(<MaestroQuizzes />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Quizzes y cuestionarios' })).toBeInTheDocument();
    expect(await screen.findByText('Sin quizzes ni cuestionarios')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Curso')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Nueva evaluación/ }));
    const tipos = within(screen.getByLabelText('Tipo')).getAllByRole('option').map(o => o.textContent);
    expect(tipos).toEqual(['Cuestionario', 'Quiz']);
  });

  test('muestra el error de carga con Reintentar', async () => {
    fake.listCourseEvaluations.mockRejectedValueOnce(new Error('No pudimos cargar las evaluaciones. Intenta de nuevo.'));
    render(<MaestroQuizzes conSimuladores />);
    expect(await screen.findByText('No pudimos cargar las evaluaciones. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('tab', { name: 'Simuladores (1)' })).toBeInTheDocument();
  });

  test('sin cursos lo explica', async () => {
    fake.listMaterialCourses.mockResolvedValue([]);
    render(<MaestroQuizzes conSimuladores />);
    expect(await screen.findByText('Sin cursos')).toBeInTheDocument();
  });
});

describe('nueva evaluación', () => {
  test('crea un simulador para todas las áreas y abre su editor', async () => {
    fake.createEvaluation.mockResolvedValue('nueva');
    fake.loadEvaluation.mockResolvedValue(detalle({ id: 'nueva', questions: [], questionCount: 0 }));
    render(<MaestroQuizzes conSimuladores />);
    await userEvent.click(await screen.findByRole('button', { name: /Nueva evaluación/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Nueva evaluación' });
    expect(within(dialogo).getByLabelText('Tipo')).toHaveValue('simulador');
    await userEvent.type(within(dialogo).getByLabelText('Título'), 'Simulador 1');
    await userEvent.clear(within(dialogo).getByLabelText('Duración (minutos)'));
    await userEvent.type(within(dialogo).getByLabelText('Duración (minutos)'), '120');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear borrador' }));

    expect(fake.createEvaluation).toHaveBeenCalledWith(
      { courseId: 'c1', kind: 'simulador', title: 'Simulador 1', description: '', moduleId: '', timeLimitMinutes: '120' },
      'admin',
    );
    expect(await screen.findByText('Sin preguntas')).toBeInTheDocument();
    expect(fake.loadEvaluation).toHaveBeenCalledWith('nueva');
  });

  test('un quiz pide área y ya no muestra minutos; el error queda en el diálogo', async () => {
    fake.createEvaluation.mockRejectedValue(new Error('No tienes permiso para hacer este cambio.'));
    render(<MaestroQuizzes conSimuladores />);
    await userEvent.click(await screen.findByRole('button', { name: /Nueva evaluación/ }));
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'quiz');
    expect(screen.queryByLabelText('Duración (minutos)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Área')).toHaveValue('m1');
    await userEvent.type(screen.getByLabelText('Título'), 'Quiz');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
  });
});

describe('editor', () => {
  test('muestra preguntas con la respuesta correcta y regresa a la lista', async () => {
    const titulo = await abrirEditor();
    await waitFor(() => expect(titulo).toHaveFocus());
    const pregunta = screen.getByRole('heading', { level: 3, name: /2 \+ 2/ });
    const tarjeta = pregunta.closest('li');
    expect(within(tarjeta).getByText('Correcta').closest('li')).toHaveTextContent('4');
    expect(within(tarjeta).getByText('Suma básica.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Volver a la lista/ }));
    expect(await screen.findByRole('tab', { name: 'Simuladores (1)' })).toBeInTheDocument();
  });

  test('agrega una pregunta con una sola correcta en simulador', async () => {
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: /Agregar pregunta/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Pregunta 2' });
    await userEvent.type(within(dialogo).getByLabelText('Enunciado'), 'Capital de México');
    await userEvent.type(within(dialogo).getByLabelText('Opción A'), 'CDMX');
    await userEvent.type(within(dialogo).getByLabelText('Opción B'), 'Mérida');
    await userEvent.click(within(dialogo).getByLabelText('Opción A es correcta'));
    await userEvent.click(within(dialogo).getByLabelText('Opción B es correcta'));
    expect(within(dialogo).getByLabelText('Opción A es correcta')).not.toBeChecked();
    await userEvent.click(within(dialogo).getByLabelText('Opción A es correcta'));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Quitar opción D' }));
    await userEvent.click(within(dialogo).getByRole('button', { name: /Agregar opción/ }));
    await userEvent.type(within(dialogo).getByLabelText('Explicación (opcional)'), 'Es la capital.');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar pregunta' }));

    expect(fake.addQuestion).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1', kind: 'simulador' }), {
      prompt: 'Capital de México',
      explanation: 'Es la capital.',
      options: ['CDMX', 'Mérida', '', ''],
      correctas: [0],
    });
    expect(await screen.findByText('Pregunta agregada.')).toBeInTheDocument();
    expect(fake.loadEvaluation).toHaveBeenCalledTimes(2);
  });

  test('edita una pregunta de quiz con varias correctas y muestra el error de la base', async () => {
    fake.loadEvaluation.mockResolvedValue(detalle({ kind: 'quiz', title: 'Quiz', moduleId: 'm1', timeLimitMinutes: null }));
    fake.updateQuestion.mockRejectedValue(new Error('Esta evaluación ya tiene intentos; sus preguntas no se pueden cambiar.'));
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Editar pregunta 1' }));
    const dialogo = screen.getByRole('dialog', { name: 'Editar pregunta 1' });
    expect(within(dialogo).getByLabelText('Enunciado')).toHaveValue('¿Cuánto es 2 + 2?');
    expect(within(dialogo).getByLabelText('Opción A es correcta')).toBeChecked();
    await userEvent.click(within(dialogo).getByLabelText('Opción B es correcta'));
    expect(within(dialogo).getByLabelText('Opción A es correcta')).toBeChecked();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    expect(fake.updateQuestion).toHaveBeenCalledWith(expect.objectContaining({ kind: 'quiz' }), 'q1', expect.objectContaining({ correctas: [0, 1] }));
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('ya tiene intentos');
  });

  test('borra una pregunta tras confirmar', async () => {
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar pregunta 1' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar' }));
    expect(fake.deleteQuestion).toHaveBeenCalledWith('q1');
    expect(await screen.findByText('Pregunta borrada.')).toBeInTheDocument();
  });

  test('publica con confirmación y avisa si la base lo rechaza', async () => {
    fake.publishEvaluation.mockRejectedValueOnce(new Error('Para publicar, la evaluación necesita al menos una pregunta.'));
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(screen.getByRole('dialog', { name: 'Publicar evaluación' })).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('al menos una pregunta');

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText('Evaluación publicada.')).toBeInTheDocument();
    expect(fake.publishEvaluation).toHaveBeenCalledWith('e1');
  });

  test('edita los datos; el tipo no cambia ya publicada', async () => {
    fake.loadEvaluation.mockResolvedValue(detalle({ status: 'published' }));
    await abrirEditor();
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Editar datos/ }));
    expect(screen.getByLabelText('Tipo')).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Título'), ' B');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(fake.updateEvaluation).toHaveBeenCalledWith('e1', expect.objectContaining({ title: 'Simulador 1 B', kind: 'simulador' }));
    expect(await screen.findByText('Datos guardados.')).toBeInTheDocument();
  });

  test('el administrador archiva', async () => {
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Archivar' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }));
    expect(fake.archiveEvaluation).toHaveBeenCalledWith('e1');
    expect(await screen.findByText('Evaluación archivada.')).toBeInTheDocument();
  });

  test('eliminar un borrador regresa a la lista', async () => {
    await abrirEditor();
    await userEvent.click(screen.getByRole('button', { name: /Eliminar borrador/ }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    expect(fake.deleteEvaluation).toHaveBeenCalledWith('e1');
    expect(await screen.findByRole('tab', { name: /Simuladores/ })).toBeInTheDocument();
  });

  test('con intentos ya no deja cambiar preguntas', async () => {
    fake.loadEvaluation.mockResolvedValue(detalle({ status: 'published', attemptCount: 3 }));
    await abrirEditor();
    expect(screen.getByText(/Ya tiene intentos/)).toBeInTheDocument();
    expect(screen.getByText('3 intentos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agregar pregunta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar pregunta 1' })).not.toBeInTheDocument();
  });

  test('el profesor solo lee el quiz de otro profesor', async () => {
    sesion.user = { id: 'profe', role: 'teacher' };
    fake.listCourseEvaluations.mockResolvedValue([evaluacion({ kind: 'quiz', title: 'Quiz ajeno', moduleId: 'm1', createdBy: 'otro' })]);
    fake.loadEvaluation.mockResolvedValue(detalle({ kind: 'quiz', title: 'Quiz ajeno', moduleId: 'm1', createdBy: 'otro', timeLimitMinutes: null }));
    render(<MaestroQuizzes />);
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Quiz ajeno' }));
    expect(await screen.findByText(/Solo quien la creó/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agregar pregunta/ })).not.toBeInTheDocument();
  });

  test('si no carga la evaluación, se puede reintentar o volver', async () => {
    fake.loadEvaluation.mockRejectedValueOnce(new Error('No pudimos cargar las evaluaciones. Intenta de nuevo.'));
    render(<MaestroQuizzes conSimuladores />);
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Simulador 1' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Simulador 1' })).toBeInTheDocument();
  });
});
