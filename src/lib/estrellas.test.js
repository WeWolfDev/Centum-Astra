import { describe, expect, test } from 'vitest';
import { fechaLocal, racha, registrarEstrella, semana } from './estrellas';

const hoy = new Date(2026, 10, 27); // viernes 27 de noviembre

describe('registrarEstrella', () => {
  test('terminar un quiz da una estrella', () => {
    const { registros, gano } = registrarEstrella([], 'quiz-1', hoy);
    expect(gano).toBe(true);
    expect(registros).toEqual([{ evaluacionId: 'quiz-1', fecha: '2026-11-27' }]);
  });

  test('repetir el mismo quiz el mismo día no da otra', () => {
    const primera = registrarEstrella([], 'quiz-1', hoy);
    const segunda = registrarEstrella(primera.registros, 'quiz-1', hoy);
    expect(segunda.gano).toBe(false);
    expect(segunda.registros).toHaveLength(1);
  });

  test('otro quiz el mismo día, o el mismo quiz otro día, sí da estrella', () => {
    const base = [{ evaluacionId: 'quiz-1', fecha: '2026-11-27' }];
    expect(registrarEstrella(base, 'quiz-2', hoy).gano).toBe(true);
    expect(registrarEstrella(base, 'quiz-1', new Date(2026, 10, 28)).gano).toBe(true);
  });

  test('no cambia los registros que recibe', () => {
    const base = [];
    registrarEstrella(base, 'quiz-1', hoy);
    expect(base).toEqual([]);
  });
});

describe('semana', () => {
  test('va de lunes a domingo con las estrellas de cada día', () => {
    const registros = [
      { evaluacionId: 'a', fecha: '2026-11-23' },
      { evaluacionId: 'b', fecha: '2026-11-27' },
      { evaluacionId: 'c', fecha: '2026-11-27' },
      { evaluacionId: 'd', fecha: '2026-11-16' },
    ];
    const dias = semana(registros, hoy);
    expect(dias.map(d => d.dia)).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
    expect(dias.map(d => d.estrellas)).toEqual([1, 0, 0, 0, 2, 0, 0]);
    expect(dias[4].esHoy).toBe(true);
  });
});

describe('racha', () => {
  test('cuenta los días seguidos con estrella hasta hoy', () => {
    const registros = ['2026-11-25', '2026-11-26', '2026-11-27'].map(fecha => ({ evaluacionId: 'q', fecha }));
    expect(racha(registros, hoy)).toBe(3);
  });

  test('si hoy todavía no hay estrella, la racha de ayer sigue viva', () => {
    const registros = ['2026-11-25', '2026-11-26'].map(fecha => ({ evaluacionId: 'q', fecha }));
    expect(racha(registros, hoy)).toBe(2);
  });

  test('un día sin estrella la corta', () => {
    const registros = ['2026-11-24', '2026-11-26', '2026-11-27'].map(fecha => ({ evaluacionId: 'q', fecha }));
    expect(racha(registros, hoy)).toBe(2);
    expect(racha([{ evaluacionId: 'q', fecha: '2026-11-25' }], hoy)).toBe(0);
  });
});

test('fechaLocal usa el día del calendario local', () => {
  expect(fechaLocal(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
});
