const WEBHOOK = /^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const SIN_VISTA_PREVIA = 4;
const ESPERA_MS = 15_000;

// Los errores nunca incluyen la URL: quien la tenga puede escribir en el canal.
export async function publicar(webhook, partes, enviar = fetch) {
  if (!WEBHOOK.test(webhook ?? '')) throw new Error('DISCORD_WEBHOOK_URL falta o no es un webhook de Discord.');
  for (const content of partes) {
    const respuesta = await enviar(`${webhook}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, flags: SIN_VISTA_PREVIA, allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(ESPERA_MS),
    }).catch(error => {
      throw new Error(`No se pudo conectar con Discord (${error.name}).`);
    });
    if (!respuesta.ok) throw new Error(`Discord respondió ${respuesta.status}.`);
  }
}
