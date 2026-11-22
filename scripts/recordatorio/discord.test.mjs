import { describe, expect, it, vi } from 'vitest';
import { publicar } from './discord.mjs';

const webhook = 'https://discord.com/api/webhooks/123/secreto';

describe('publicar', () => {
  it('envía cada parte en orden, sin menciones ni vistas previas', async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true });
    await publicar(webhook, ['uno', 'dos'], enviar);

    const cuerpos = enviar.mock.calls.map(([, opciones]) => JSON.parse(opciones.body));
    expect(cuerpos).toEqual([
      { content: 'uno', flags: 4, allowed_mentions: { parse: [] } },
      { content: 'dos', flags: 4, allowed_mentions: { parse: [] } },
    ]);
    expect(enviar.mock.calls[0][0]).toBe(`${webhook}?wait=true`);
  });

  it.each([undefined, '', 'https://malo.test/api/webhooks/1/x'])('rechaza el webhook %s', async url => {
    const enviar = vi.fn();
    await expect(publicar(url, ['uno'], enviar)).rejects.toThrow('DISCORD_WEBHOOK_URL');
    expect(enviar).not.toHaveBeenCalled();
  });

  it('se detiene si Discord responde con error', async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    await expect(publicar(webhook, ['uno', 'dos'], enviar)).rejects.toThrow('429');
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('no revela el webhook si falla la red', async () => {
    const enviar = vi.fn().mockRejectedValue(new TypeError(`fallo en ${webhook}`));
    const error = await publicar(webhook, ['uno'], enviar).catch(e => e);
    expect(error.message).toContain('TypeError');
    expect(error.message).not.toContain('secreto');
  });
});
