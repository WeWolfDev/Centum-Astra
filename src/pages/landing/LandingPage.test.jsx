// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const contacto = vi.hoisted(() => ({ canal: null }));

vi.mock('../../config/contacto', async () => {
  const real = await vi.importActual('../../config/contacto');
  const config = () => (contacto.canal === 'whatsapp'
    ? { whatsapp: '5213312345678', correo: '' }
    : { whatsapp: '', correo: '' });
  return {
    ...real,
    canalDeRegistro: () => real.canalDeRegistro(config()),
    enlaceRegistro: (form) => real.enlaceRegistro(form, config()),
  };
});

const { default: LandingPage } = await import('./LandingPage');
const { ThemeProvider } = await import('../../context/ThemeContext');

beforeAll(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  contacto.canal = null;
});

function renderizar() {
  return render(<ThemeProvider><LandingPage onLoginClick={() => {}} /></ThemeProvider>);
}

async function llenarFormulario() {
  await userEvent.type(screen.getByLabelText('Nombre(s)'), 'María');
  await userEvent.type(screen.getByLabelText('Apellidos'), 'López');
  await userEvent.type(screen.getByLabelText('# Celular'), '5512345678');
  await userEvent.selectOptions(screen.getByLabelText(/Estado/), 'Jalisco');
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'maria@correo.com');
}

describe('LandingPage', () => {
  test('no muestra testimonios ni cifras promocionales sin verificar', () => {
    renderizar();
    expect(screen.queryByText(/testimonios/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tasa de aprobación/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/alumnos admitidos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,200/)).not.toBeInTheDocument();
  });

  test('sin canal de contacto, el registro queda deshabilitado y lo dice', () => {
    renderizar();
    expect(screen.getByRole('button', { name: /enviar mis datos/i })).toBeDisabled();
    expect(screen.getByText('El registro en línea todavía no está disponible.')).toBeInTheDocument();
  });

  test('con WhatsApp, abre el chat con los datos y no dice que ya se recibió', async () => {
    contacto.canal = 'whatsapp';
    const abrir = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderizar();

    await llenarFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mis datos por WhatsApp' }));

    expect(abrir).toHaveBeenCalledTimes(1);
    const [url, destino] = abrir.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\/5213312345678\?text=/);
    expect(decodeURIComponent(url)).toContain('Nombre: María López');
    expect(destino).toBe('_blank');
    expect(screen.getByRole('heading', { name: 'Ya casi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Si no se abrió, toca aquí' })).toHaveAttribute('href', url);
    expect(screen.queryByText(/solicitud recibida/i)).not.toBeInTheDocument();
  });
});
