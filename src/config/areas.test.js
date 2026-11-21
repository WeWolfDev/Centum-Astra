import { describe, expect, test } from 'vitest';
import { AREA_POR_ID, areaDeModulo } from './areas';

describe('areaDeModulo', () => {
  test('usa el id de los módulos de ejemplo', () => {
    expect(areaDeModulo({ id: 4, title: 'Cualquier nombre' })).toBe(AREA_POR_ID[4]);
  });

  test('reconoce el área por el título de un módulo de Supabase', () => {
    expect(areaDeModulo({ id: 'uuid-1', title: 'Pensamiento Matemático' }).icono).toBe('math');
    expect(areaDeModulo({ id: 'uuid-2', title: 'COMPRENSIÓN LECTORA' }).icono).toBe('reading');
    expect(areaDeModulo({ id: 'uuid-3', title: 'Redacción indirecta' }).icono).toBe('writing');
    expect(areaDeModulo({ id: 'uuid-4', title: 'Pre-medicina' }).icono).toBe('premed');
    expect(areaDeModulo({ id: 'uuid-5', title: 'Ciencias de la Salud' }).icono).toBe('health');
  });

  test('devuelve null si no reconoce el módulo', () => {
    expect(areaDeModulo({ id: 'uuid-6', title: 'Inglés' })).toBeNull();
    expect(areaDeModulo(undefined)).toBeNull();
  });
});
