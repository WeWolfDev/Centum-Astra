// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listMyEvaluations: vi.fn(),
  startAttempt: vi.fn(),
  loadQuestions: vi.fn(),
  loadAnswers: vi.fn(),
  saveAnswer: vi.fn(),
  submitAttempt: vi.fn(),
  reviewAttempt: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alumno', role: 'student' } }) }));
vi.mock('../../lib/evaluacionesService', async () => {
  const real = await vi.importActual('../../lib/evaluacionesService');
  return { ...real, ...fake };
});

const { default: SimuladoresAlumno } = await import('./SimuladoresAlumno');

const enUnaHora = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

const intento = (extra = {}) => ({
  id: 'a1', evaluationId: 'e1', status: 'in_progress', expiresAt: enUnaHora(),
  totalQuestions: null, correctCount: null, percent: null, score: null, durationSeconds: null, isBest: false,
  ...extra,
});

const terminado = (extra = {}) => intento({
  status: 'submitted', totalQuestions: 2, correctCount: 1, percent: 50, score: 1000, durationSeconds: 125, isBest: true, ...extra,
});

const SIMULADOR = {
  id: 'e1', kind: 'simulador', title: 'Simulador EXANI 1', description: '', questionCount: 2,
  timeLimitMinutes: 90, moduleId: null, enCurso: null, terminados: [],
};
const QUIZ = {
  id: 'e2', kind: 'quiz', title: 'Quiz de fracciones', description: 'Repaso', questionCount: 1,
  timeLimitMinutes: null, moduleId: 'm1', enCurso: null, terminados: [],
};

const PREGUNTAS = [
  { id: 'q1', position: 0, prompt: '¿Cuánto es 2 + 2?', mediaKind: null, mediaUrl: null, options: [{ id: 'o1', body: '4' }, { id: 'o2', body: '5' }] },
  { id: 'q2', position: 1, prompt: 'Capital de México', mediaKind: 'video_link', mediaUrl: 'https://drive.google.com/v', options: [{ id: 'o3', body: 'CDMX' }, { id: 'o4', body: 'Mérida' }] },
];

const REVISION = [
  { questionId: 'q1', selected: ['o1'], correct: ['o1'], isCorrect: true, explanation: 'Suma básica.' },
  { questionId: 'q2', selected: ['o4'], correct: ['o3'], isCorrect: false, explanation: '' },
];

beforeEach(() => {
  Object.values(fake).forEach(f => f.mockReset());
  fake.listMyEvaluations.mockResolvedValue([SIMULADOR, QUIZ]);
  fake.startAttempt.mockResolvedValue(intento());
  fake.loadQuestions.mockResolvedValue(PREGUNTAS);
  fake.loadAnswers.mockResolvedValue({});
  fake.saveAnswer.mockResolvedValue(intento());
  fake.submitAttempt.mockResolvedValue(terminado());
  fake.reviewAttempt.mockResolvedValue(REVISION);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('lista de evaluaciones', () => {
  test('separa simuladores de quizzes y muestra tiempo y preguntas', async () => {
    render(<SimuladoresAlumno />);

    const simuladores = await screen.findByRole('region', { name: 'Simuladores' });
    expect(within(simuladores).getByText('Simulador EXANI 1')).toBeInTheDocument();
    expect(within(simuladores).getByText('90 min')).toBeInTheDocument();
    const quizzes = screen.getByRole('region', { name: 'Cuestionarios y quizzes' });
    expect(within(quizzes).getByText('Repaso')).toBeInTheDocument();
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument();
    expect(fake.listMyEvaluations).toHaveBeenCalledWith('alumno');
  });

  test('sin evaluaciones publicadas lo explica', async () => {
    fake.listMyEvaluations.mockResolvedValue([]);
    render(<SimuladoresAlumno />);
    expect(await screen.findByText('Sin evaluaciones por ahora')).toBeInTheDocument();
  });

  test('si falla la carga permite reintentar', async () => {
    const user = userEvent.setup();
    fake.listMyEvaluations.mockRejectedValueOnce(new Error('No pudimos cargar tus evaluaciones.'));
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Simulador EXANI 1')).toBeInTheDocument();
  });

  test('muestra el último y el mejor resultado guardados', async () => {
    fake.listMyEvaluations.mockResolvedValue([{
      ...SIMULADOR,
      terminados: [
        terminado({ id: 'a3', isBest: false, correctCount: 1, score: 1000 }),
        terminado({ id: 'a2', correctCount: 2, percent: 100, score: 1300 }),
      ],
    }]);
    render(<SimuladoresAlumno />);

    expect(await screen.findByText('1 de 2 aciertos · 50 % · 1,000 puntos')).toBeInTheDocument();
    expect(screen.getByText('2 de 2 aciertos · 100 % · 1,300 puntos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver a intentar: Simulador EXANI 1' })).toBeInTheDocument();
  });

  test('un quiz muestra aciertos y porcentaje, sin puntos', async () => {
    fake.listMyEvaluations.mockResolvedValue([{ ...QUIZ, terminados: [terminado({ correctCount: 3, totalQuestions: 4, percent: 75, score: null })] }]);
    render(<SimuladoresAlumno />);

    expect(await screen.findByText('3 de 4 aciertos · 75 %')).toBeInTheDocument();
    expect(screen.queryByText(/puntos/)).not.toBeInTheDocument();
  });
});

describe('iniciar y retomar', () => {
  test('un simulador avisa que el reloj no se detiene antes de iniciar', async () => {
    const user = userEvent.setup();
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Iniciar: Simulador EXANI 1' }));
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText(/El reloj no se detiene/)).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Iniciar ahora' }));

    expect(fake.startAttempt).toHaveBeenCalledWith('e1');
    expect(await screen.findByText('¿Cuánto es 2 + 2?')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(/^\s*(1:00:00|59:5\d)$/);
  });

  test('un quiz inicia sin confirmar y sin reloj', async () => {
    const user = userEvent.setup();
    fake.startAttempt.mockResolvedValue(intento({ evaluationId: 'e2', expiresAt: null }));
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Iniciar: Quiz de fracciones' }));

    expect(await screen.findByText('Puede haber más de una respuesta correcta.')).toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  test('retomar conserva las respuestas que guardó el servidor', async () => {
    const user = userEvent.setup();
    fake.listMyEvaluations.mockResolvedValue([{ ...SIMULADOR, enCurso: intento() }]);
    fake.loadAnswers.mockResolvedValue({ q1: ['o2'] });
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Continuar: Simulador EXANI 1' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: '5' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Pregunta 1, contestada' })).toBeInTheDocument();
  });

  test('el navegador marca la pregunta actual y las contestadas sin depender del color', async () => {
    const user = userEvent.setup();
    fake.listMyEvaluations.mockResolvedValue([{ ...SIMULADOR, enCurso: intento() }]);
    fake.loadAnswers.mockResolvedValue({ q1: ['o2'] });
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Continuar: Simulador EXANI 1' }));

    const contestada = await screen.findByRole('button', { name: 'Pregunta 1, contestada' });
    expect(contestada).toHaveAttribute('aria-current', 'step');
    expect(contestada).toHaveClass('border-2');
    expect(contestada.querySelector('[data-marca="contestada"]')).not.toBeNull();
  });

  test('si el servidor rechaza el inicio lo dice', async () => {
    const user = userEvent.setup();
    fake.startAttempt.mockRejectedValue(new Error('Esta evaluación ya no está disponible para ti.'));
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Iniciar: Quiz de fracciones' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya no está disponible');
  });
});

async function abrirSimulador(user) {
  fake.listMyEvaluations.mockResolvedValue([{ ...SIMULADOR, enCurso: intento() }]);
  render(<SimuladoresAlumno />);
  await user.click(await screen.findByRole('button', { name: 'Continuar: Simulador EXANI 1' }));
  await screen.findByText('¿Cuánto es 2 + 2?');
}

describe('contestar y entregar', () => {
  test('cada respuesta se guarda al elegirla', async () => {
    const user = userEvent.setup();
    await abrirSimulador(user);

    await user.click(screen.getByRole('radio', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(screen.getByRole('link', { name: /Ver video de la pregunta/ })).toHaveAttribute('rel', 'noopener noreferrer');
    await user.click(screen.getByRole('radio', { name: 'CDMX' }));

    expect(fake.saveAnswer).toHaveBeenNthCalledWith(1, 'a1', 'q1', ['o1']);
    expect(fake.saveAnswer).toHaveBeenNthCalledWith(2, 'a1', 'q2', ['o3']);
  });

  test('sin conexión avisa y reintenta las respuestas pendientes', async () => {
    const user = userEvent.setup();
    await abrirSimulador(user);
    fake.saveAnswer.mockRejectedValueOnce(new Error('offline'));

    await user.click(screen.getByRole('radio', { name: '4' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Una respuesta no se ha guardado.');
    expect(screen.getByRole('button', { name: 'Pregunta 1, sin guardar' })).toBeInTheDocument();

    act(() => window.dispatchEvent(new Event('online')));

    await waitFor(() => expect(screen.queryByText(/no se ha guardado/)).not.toBeInTheDocument());
    expect(fake.saveAnswer).toHaveBeenCalledTimes(2);
    expect(fake.saveAnswer).toHaveBeenLastCalledWith('a1', 'q1', ['o1']);
  });

  test('entregar confirma, muestra el resultado del servidor y la revisión', async () => {
    const user = userEvent.setup();
    await abrirSimulador(user);

    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveTextContent('Te faltan 2 preguntas por contestar.');
    await user.click(within(dialogo).getByRole('button', { name: 'Entregar' }));

    expect(fake.submitAttempt).toHaveBeenCalledWith('a1');
    expect(await screen.findByRole('heading', { name: 'Resultado: Simulador EXANI 1' })).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('50 %')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText(/No es resultado oficial del Ceneval/)).toBeInTheDocument();
    expect(await screen.findByText('Suma básica.')).toBeInTheDocument();
    expect(screen.getByText('Tu respuesta, correcta')).toBeInTheDocument();
    expect(screen.getByText('Respuesta correcta')).toBeInTheDocument();
    expect(screen.getByText('Incorrecta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver a simuladores y quizzes' }));
    expect(await screen.findByRole('heading', { name: 'Simuladores y quizzes' })).toBeInTheDocument();
  });

  test('si la entrega falla, deja reintentar', async () => {
    const user = userEvent.setup();
    await abrirSimulador(user);
    fake.submitAttempt.mockRejectedValueOnce(new Error('No se pudo guardar. Revisa tu conexión e intenta de nuevo.'));

    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Entregar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Resultado: Simulador EXANI 1' })).toBeInTheDocument();
  });

  test('si el servidor ya cerró el intento al guardar, muestra el resultado', async () => {
    const user = userEvent.setup();
    await abrirSimulador(user);
    fake.saveAnswer.mockResolvedValue(terminado({ status: 'expired' }));

    await user.click(screen.getByRole('radio', { name: '4' }));

    expect(await screen.findByText(/Se terminó el tiempo/)).toBeInTheDocument();
  });
});

describe('tiempo', () => {
  test('al llegar a cero entrega sola y muestra que se terminó el tiempo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const porVencer = intento({ expiresAt: new Date(Date.now() + 3000).toISOString() });
    fake.listMyEvaluations.mockResolvedValue([{ ...SIMULADOR, enCurso: porVencer }]);
    fake.startAttempt.mockResolvedValue(porVencer);
    fake.submitAttempt.mockResolvedValue(terminado({ status: 'expired' }));
    render(<SimuladoresAlumno />);
    await user.click(await screen.findByRole('button', { name: 'Continuar: Simulador EXANI 1' }));
    await screen.findByText('¿Cuánto es 2 + 2?');

    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });

    expect(fake.submitAttempt).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Se terminó el tiempo/)).toBeInTheDocument();
  });

  test('ver un resultado anterior vencido explica que se cerró por tiempo', async () => {
    const user = userEvent.setup();
    fake.listMyEvaluations.mockResolvedValue([{ ...QUIZ, terminados: [terminado({ status: 'expired', score: null })] }]);
    render(<SimuladoresAlumno />);

    await user.click(await screen.findByRole('button', { name: 'Ver respuestas de Quiz de fracciones' }));

    expect(await screen.findByText(/Se terminó el tiempo/)).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.queryByText(/Ceneval/)).not.toBeInTheDocument();
  });
});
