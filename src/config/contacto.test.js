import { describe, it, expect } from 'vitest';
import { canalDeRegistro, enlaceRegistro, mensajeRegistro } from './contacto';

const form = {
  nombres: ' María ',
  apellidos: 'López',
  celular: '55 1234 5678',
  estado: 'Jalisco',
  email: 'maria@correo.com ',
};

describe('contacto del registro', () => {
  it('arma el mensaje con los datos del aspirante, sin espacios sobrantes', () => {
    expect(mensajeRegistro(form)).toBe(
      'Hola, quiero inscribirme a Centum Astra.\n' +
      'Nombre: María López\n' +
      'Celular: 55 1234 5678\n' +
      'Estado: Jalisco\n' +
      'Correo: maria@correo.com',
    );
  });

  it('prefiere WhatsApp cuando está configurado', () => {
    const contacto = { whatsapp: '5213312345678', correo: 'hola@centum.mx' };
    expect(canalDeRegistro(contacto)).toBe('whatsapp');
    const url = enlaceRegistro(form, contacto);
    expect(url.startsWith('https://wa.me/5213312345678?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe(mensajeRegistro(form));
  });

  it('usa el correo si no hay WhatsApp', () => {
    const contacto = { whatsapp: '', correo: 'hola@centum.mx' };
    expect(canalDeRegistro(contacto)).toBe('correo');
    const url = enlaceRegistro(form, contacto);
    expect(url.startsWith('mailto:hola@centum.mx?subject=')).toBe(true);
    expect(decodeURIComponent(url.split('body=')[1])).toBe(mensajeRegistro(form));
  });

  it('no da enlace si no hay ningún canal configurado', () => {
    const contacto = { whatsapp: '', correo: '' };
    expect(canalDeRegistro(contacto)).toBeNull();
    expect(enlaceRegistro(form, contacto)).toBeNull();
  });
});
