const WEBHOOK = /^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const ID_USUARIO = /^\d{17,20}$/;
const SIN_VISTA_PREVIA = 4;
const ESPERA_MS = 15_000;

// DISCORD_USUARIOS: {"login de GitHub":"ID de Discord"}. Va en un secreto: el repo es público.
export function leerUsuarios(valor) {
  if (!valor) return {};
  const invalido = new Error('DISCORD_USUARIOS no es válido.');
  let usuarios;
  try {
    usuarios = JSON.parse(valor);
  } catch {
    throw invalido; // el error de JSON.parse repetiría el valor en el log
  }
  if (!usuarios || typeof usuarios !== 'object' || Array.isArray(usuarios)) throw invalido;
  if (!Object.values(usuarios).every(id => typeof id === 'string' && ID_USUARIO.test(id))) throw invalido;
  return usuarios;
}

// Los errores nunca incluyen la URL: quien la tenga puede escribir en el canal.
export async function publicar(webhook, partes, notificar = [], enviar = fetch) {
  if (!WEBHOOK.test(webhook ?? '')) throw new Error('DISCORD_WEBHOOK_URL falta o no es un webhook de Discord.');
  for (const content of partes) {
    const respuesta = await enviar(`${webhook}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, flags: SIN_VISTA_PREVIA, allowed_mentions: { parse: [], users: notificar } }),
      signal: AbortSignal.timeout(ESPERA_MS),
    }).catch(error => {
      throw new Error(`No se pudo conectar con Discord (${error.name}).`);
    });
    if (!respuesta.ok) throw new Error(`Discord respondió ${respuesta.status}.`);
  }
}
