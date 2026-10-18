import { describe, it, expect } from 'vitest';
import {
  aciertosACeneval,
  puedeDescargarPdf,
  SIMULADOR_RANGO_CENEVAL,
  SIMULADOR_TOTAL_PREGUNTAS,
} from './rediseno';

const { min: MIN, max: MAX } = SIMULADOR_RANGO_CENEVAL;

describe('aciertosACeneval', () => {
  describe('límites del rango Ceneval', () => {
    it('devuelve MIN con 0 aciertos sobre el total por defecto', () => {
      expect(aciertosACeneval(0)).toBe(MIN);
    });

    it('devuelve MAX con todos los aciertos sobre el total por defecto', () => {
      expect(aciertosACeneval(SIMULADOR_TOTAL_PREGUNTAS)).toBe(MAX);
    });

    it('devuelve MIN con 0 aciertos cuando total se pasa explícito', () => {
      expect(aciertosACeneval(0, 138)).toBe(MIN);
    });

    it('devuelve MAX con todos los aciertos cuando total se pasa explícito', () => {
      expect(aciertosACeneval(10, 10)).toBe(MAX);
    });
  });

  describe('valores intermedios', () => {
    it('mapea la mitad de aciertos al punto medio del rango', () => {
      // 700 + 0.5 * 600 = 1000
      expect(aciertosACeneval(5, 10)).toBe(1000);
    });

    it('interpola linealmente a un tercio', () => {
      // 700 + (1/3) * 600 = 900 exacto
      expect(aciertosACeneval(1, 3)).toBe(900);
    });

    it('interpola linealmente a dos tercios', () => {
      // 700 + (2/3) * 600 = 1100 exacto
      expect(aciertosACeneval(2, 3)).toBe(1100);
    });
  });

  describe('redondeo', () => {
    it('redondea al entero más cercano cuando la fracción no es exacta', () => {
      // 700 + (1/7) * 600 = 785.714... -> 786
      expect(aciertosACeneval(1, 7)).toBe(786);
    });

    it('devuelve siempre un entero', () => {
      const r = aciertosACeneval(3, 7);
      expect(Number.isInteger(r)).toBe(true);
    });
  });

  describe('clamping fuera de rango', () => {
    it('clampa a MAX cuando aciertos > total', () => {
      expect(aciertosACeneval(200, 138)).toBe(MAX);
    });

    it('clampa a MIN cuando aciertos es negativo', () => {
      expect(aciertosACeneval(-5, 138)).toBe(MIN);
    });
  });

  describe('casos edge', () => {
    it('devuelve MIN cuando total es 0', () => {
      expect(aciertosACeneval(0, 0)).toBe(MIN);
    });

    it('devuelve MIN cuando total es negativo', () => {
      expect(aciertosACeneval(5, -1)).toBe(MIN);
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
