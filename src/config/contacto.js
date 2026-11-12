// Canales de contacto del registro de la landing (#37). El formulario no tiene
// backend: arma un mensaje con los datos del aspirante y lo abre en WhatsApp
// o en el correo. Si no hay ninguno configurado, el registro queda deshabilitado
// en lugar de fingir que se envió.
export const contactoConfigurado = {
  whatsapp: (import.meta.env.VITE_CONTACTO_WHATSAPP ?? '').replace(/\D/g, ''),
  correo: (import.meta.env.VITE_CONTACTO_CORREO ?? '').trim(),
};

export function canalDeRegistro(contacto = contactoConfigurado) {
  if (contacto.whatsapp) return 'whatsapp';
  if (contacto.correo) return 'correo';
  return null;
}

export function mensajeRegistro({ nombres, apellidos, celular, estado, email }) {
  return [
    'Hola, quiero inscribirme a Centum Astra.',
    `Nombre: ${nombres.trim()} ${apellidos.trim()}`,
    `Celular: ${celular.trim()}`,
    `Estado: ${estado}`,
    `Correo: ${email.trim()}`,
  ].join('\n');
}

export function enlaceRegistro(form, contacto = contactoConfigurado) {
  const texto = mensajeRegistro(form);
  const canal = canalDeRegistro(contacto);
  if (canal === 'whatsapp') {
    return `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(texto)}`;
  }
  if (canal === 'correo') {
    const asunto = encodeURIComponent('Inscripción a Centum Astra');
    return `mailto:${contacto.correo}?subject=${asunto}&body=${encodeURIComponent(texto)}`;
  }
  return null;
}
