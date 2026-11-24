import { describe, it, expect } from 'vitest';
import * as config from './rediseno';
import { puntajeEstimado, puedeDescargarPdf, ESCALA_PUNTAJE } from './rediseno';

const { min: MIN, max: MAX } = ESCALA_PUNTAJE;

describe('puntajeEstimado', () => {
  // Decisión 1.10: 700 + (aciertos / total de preguntas) × 600, con el total de cada evaluación.
  it('con 60 aciertos de 100 da 1060 (#52)', () => {
    expect(puntajeEstimado(60, 100)).toBe(1060);
  });

  it('no supone un total de preguntas: sin total no hay puntaje', () => {
    expect(config).not.toHaveProperty('SIMULADOR_TOTAL_PREGUNTAS');
    expect(puntajeEstimado(60)).toBeNull();
  });

  describe('límites de la escala', () => {
    it('devuelve MIN con 0 aciertos', () => {
      expect(puntajeEstimado(0, 40)).toBe(MIN);
    });

    it('devuelve MAX con todos los aciertos', () => {
      expect(puntajeEstimado(10, 10)).toBe(MAX);
    });
  });

  describe('valores intermedios', () => {
    it('mapea la mitad de aciertos al punto medio del rango', () => {
      // 700 + 0.5 * 600 = 1000
      expect(puntajeEstimado(5, 10)).toBe(1000);
    });

    it('interpola linealmente a un tercio', () => {
      // 700 + (1/3) * 600 = 900 exacto
      expect(puntajeEstimado(1, 3)).toBe(900);
    });

    it('interpola linealmente a dos tercios', () => {
      // 700 + (2/3) * 600 = 1100 exacto
      expect(puntajeEstimado(2, 3)).toBe(1100);
    });
  });

  describe('redondeo', () => {
    it('redondea al entero más cercano cuando la fracción no es exacta', () => {
      // 700 + (1/7) * 600 = 785.714... -> 786
      expect(puntajeEstimado(1, 7)).toBe(786);
    });

    it('devuelve siempre un entero', () => {
      const r = puntajeEstimado(3, 7);
      expect(Number.isInteger(r)).toBe(true);
    });
  });

  describe('clamping fuera de rango', () => {
    it('clampa a MAX cuando aciertos > total', () => {
      expect(puntajeEstimado(200, 40)).toBe(MAX);
    });

    it('clampa a MIN cuando aciertos es negativo', () => {
      expect(puntajeEstimado(-5, 40)).toBe(MIN);
    });
  });

  describe('casos edge', () => {
    it('no da puntaje cuando total es 0', () => {
      expect(puntajeEstimado(0, 0)).toBeNull();
    });

    it('no da puntaje cuando total es negativo', () => {
      expect(puntajeEstimado(5, -1)).toBeNull();
    });
  });
});

describe('puedeDescargarPdf', () => {
  it('permite descargar al rol teacher', () => {
    expect(puedeDescargarPdf('teacher')).toBe(true);
  });

  it('permite descargar al rol admin', () => {
    expect(puedeDescargarPdf('admin')).toBe(true);
  });

  it('niega la descarga al rol student', () => {
    expect(puedeDescargarPdf('student')).toBe(false);
  });

  it('niega la descarga a rol desconocido', () => {
    expect(puedeDescargarPdf('guest')).toBe(false);
  });

  it('niega la descarga sin rol', () => {
    expect(puedeDescargarPdf(undefined)).toBe(false);
  });
});
