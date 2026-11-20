// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../lib/supabaseClient', () => ({ supabase: {}, isSupabaseConfigured: true }));
vi.mock('./MaterialCurso', () => ({ default: () => <p>Material del curso</p> }));

const { default: Material } = await import('./Material');

afterEach(cleanup);

describe('Material', () => {
  test('con Supabase usa el material real del curso, sin datos de ejemplo', () => {
    render(<Material />);
    expect(screen.getByText('Material del curso')).toBeInTheDocument();
    expect(screen.queryByText(/Datos de ejemplo/)).not.toBeInTheDocument();
  });
});
