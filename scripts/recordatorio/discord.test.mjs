import { describe, expect, it, vi } from 'vitest';
import { leerUsuarios, publicar } from './discord.mjs';

const webhook = 'https://discord.com/api/webhooks/123/secreto';

describe('publicar', () => {
  it('envía cada parte en orden, sin menciones ni vistas previas', async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true });
    await publicar(webhook, ['uno', 'dos'], [], enviar);

    const cuerpos = enviar.mock.calls.map(([, opciones]) => JSON.parse(opciones.body));
    expect(cuerpos).toEqual([
      { content: 'uno', flags: 4, allowed_mentions: { parse: [], users: [] } },
      { content: 'dos', flags: 4, allowed_mentions: { parse: [], users: [] } },
    ]);
    expect(enviar.mock.calls[0][0]).toBe(`${webhook}?wait=true`);
  });

  it('solo permite notificar a los usuarios indicados', async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true });
    await publicar(webhook, ['@everyone <@11111111111111111>'], ['11111111111111111'], enviar);
    expect(JSON.parse(enviar.mock.calls[0][1].body).allowed_mentions).toEqual({ parse: [], users: ['11111111111111111'] });
  });

  it.each([undefined, '', 'https://malo.test/api/webhooks/1/x'])('rechaza el webhook %s', async url => {
    const enviar = vi.fn();
    await expect(publicar(url, ['uno'], [], enviar)).rejects.toThrow('DISCORD_WEBHOOK_URL');
    expect(enviar).not.toHaveBeenCalled();
  });

  it('se detiene si Discord responde con error', async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    await expect(publicar(webhook, ['uno', 'dos'], [], enviar)).rejects.toThrow('429');
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('no revela el webhook si falla la red', async () => {
    const enviar = vi.fn().mockRejectedValue(new TypeError(`fallo en ${webhook}`));
    const error = await publicar(webhook, ['uno'], [], enviar).catch(e => e);
    expect(error.message).toContain('TypeError');
    expect(error.message).not.toContain('secreto');
  });
});

describe('leerUsuarios', () => {
  it('lee el ID de Discord de cada login', () => {
    expect(leerUsuarios('{"KERMITH79":"11111111111111111"}')).toEqual({ KERMITH79: '11111111111111111' });
  });

  it.each([undefined, ''])('sin configurar (%s) no etiqueta a nadie', valor => {
    expect(leerUsuarios(valor)).toEqual({});
  });

  it.each(['no-json-privado', 'null', '[]', '{"a":"everyone"}', '{"a":11111111111111111}'])('rechaza %s sin repetirlo', valor => {
    expect(() => leerUsuarios(valor)).toThrow(/^DISCORD_USUARIOS no es válido\.$/);
  });
});
