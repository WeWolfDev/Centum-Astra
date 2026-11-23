// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al1', role: 'student' } }) }));
vi.mock('../../context/MaterialContext', () => ({ useMaterial: () => ({ videosDeVideoteca: [] }) }));

const { default: VideoLibrary } = await import('./VideoLibrary');

afterEach(cleanup);

// Drive no da vistas ni duración (#29): la demostración tampoco las promete.
test('sin Supabase muestra los videos de ejemplo sin duración', () => {
  render(<VideoLibrary />);
  expect(screen.getByText('Álgebra Lineal: Matrices y Determinantes')).toBeInTheDocument();
  expect(screen.queryByText('1:45:30')).not.toBeInTheDocument();
});
