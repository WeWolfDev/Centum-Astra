import { describe, expect, test } from 'vitest';
import { historialSimuladorEjemplo } from './simuladorEjemplo';
import { mockSimuladorPreguntas, mockStudents } from './mockData';
import { puntajeEstimado } from '../config/rediseno';

describe('historialSimuladorEjemplo', () => {
  test('termina en el promedio del alumno sobre el simulador de ejemplo', () => {
    const ana = mockStudents.find(s => s.email === 'ana@centum.mx');
    const historial = historialSimuladorEjemplo('ana@centum.mx');
    const ultimo = historial[historial.length - 1];

    expect(ultimo.total).toBe(mockSimuladorPreguntas);
    expect(ultimo.aciertos).toBe(Math.round((ana.avgScore / 100) * mockSimuladorPreguntas));
    expect(ultimo.puntaje).toBe(puntajeEstimado(ultimo.aciertos, mockSimuladorPreguntas));
  });

  test('da el mismo historial cada vez, para que Inicio y Simuladores coincidan', () => {
    expect(historialSimuladorEjemplo('ana@centum.mx')).toEqual(historialSimuladorEjemplo('ana@centum.mx'));
  });

  test('con un correo que no está en el ejemplo, usa al primer alumno', () => {
    expect(historialSimuladorEjemplo('nadie@centum.mx')).toEqual(historialSimuladorEjemplo(mockStudents[0].email));
  });
});
