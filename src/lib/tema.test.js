// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TEMA_STORAGE_KEY, aplicarTema, guardarTema, temaInicial } from './tema';

function sistemaPrefiere(tema) {
  vi.stubGlobal('matchMedia', query => ({ matches: query.includes(tema) }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('temaInicial', () => {
  test('con el flag apagado siempre es oscuro', () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'light');
    expect(temaInicial(false)).toBe('dark');
  });

  test('respeta la elección guardada', () => {
    sistemaPrefiere('dark');
    localStorage.setItem(TEMA_STORAGE_KEY, 'light');
    expect(temaInicial(true)).toBe('light');
  });

  test('sin elección guardada sigue al sistema', () => {
    sistemaPrefiere('light');
    expect(temaInicial(true)).toBe('light');
  });

  test('ignora valores guardados inválidos', () => {
    sistemaPrefiere('dark');
    localStorage.setItem(TEMA_STORAGE_KEY, 'sepia');
    expect(temaInicial(true)).toBe('dark');
  });

  test('si el almacenamiento falla, usa el sistema', () => {
    sistemaPrefiere('light');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(temaInicial(true)).toBe('light');
    vi.restoreAllMocks();
  });
});

describe('aplicarTema y guardarTema', () => {
  test('marca el tema en <html> y lo guarda', () => {
    aplicarTema('light');
    guardarTema('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('light');
  });

  test('guardar sin almacenamiento no lanza error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('lleno'); });
    expect(() => guardarTema('dark')).not.toThrow();
    vi.restoreAllMocks();
  });
});
