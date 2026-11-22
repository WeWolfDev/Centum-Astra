import { describe, expect, it } from 'vitest';
import { construirMensaje, dependencias, dividir, textoSeguro } from './mensaje.mjs';

const ahora = new Date('2026-11-23T15:07:00Z');
const issue = (number, extra = {}) => ({
  number,
  title: `Tarea ${number}`,
  url: `https://github.test/issues/${number}`,
  body: '',
  assignees: [{ login: 'KERMITH79' }],
  labels: [{ name: 'priority:p1' }],
  milestone: null,
  ...extra,
});
const pr = (number, extra = {}) => ({
  number,
  title: `Cambio ${number}`,
  url: `https://github.test/pull/${number}`,
  author: { login: 'Killercrod' },
  isDraft: false,
  reviewDecision: 'REVIEW_REQUIRED',
  closingIssuesReferences: [],
  ...extra,
});
const mensaje = (issues, prs = []) => construirMensaje({ issues, prs, ahora });

describe('dependencias', () => {
  it('lee solo los números con # de la línea Depende de', () => {
    const cuerpo = '**Prioridad:** P0 · **Depende de:** Issues 8–16 → #32, #33 · Seguridad: #67\r\nVer #99';
    expect(dependencias(cuerpo)).toEqual([32, 33, 67]);
  });

  it('no inventa dependencias si la línea no existe o no trae números', () => {
    expect(dependencias(null)).toEqual([]);
    expect(dependencias('**Depende de:**\nVer #4')).toEqual([]);
  });
});

describe('construirMensaje', () => {
  it('oculta un issue mientras su dependencia siga abierta', () => {
    const texto = mensaje([issue(1), issue(2, { body: 'Depende de: #1' })]);
    expect(texto).toContain('1 para avanzar, 1 bloqueado');
    expect(texto).not.toContain('Tarea 2');
  });

  it('libera un issue cuando su dependencia ya cerró', () => {
    expect(mensaje([issue(2, { body: 'Depende de: #1' })])).toContain('Tarea 2');
  });

  it('considera bloqueante un PR abierto', () => {
    expect(mensaje([issue(2, { body: 'Depende de: #9' })], [pr(9)])).not.toContain('Tarea 2');
  });

  it('respeta la etiqueta status:blocked', () => {
    expect(mensaje([issue(1, { labels: [{ name: 'status:blocked' }] })])).toContain('1 bloqueado');
  });

  it('cuenta como en PR el issue que cierra un PR del equipo', () => {
    const texto = mensaje([issue(1)], [pr(9, { closingIssuesReferences: [{ number: 1 }] })]);
    expect(texto).toContain('1 en PR');
    expect(texto).not.toContain('Tarea 1');
  });

  it('ignora los PRs ajenos al equipo, también para ocultar issues', () => {
    const ajeno = pr(9, { author: { login: 'intruso' }, closingIssuesReferences: [{ number: 1 }] });
    const texto = mensaje([issue(1)], [ajeno]);
    expect(texto).toContain('Tarea 1');
    expect(texto).not.toContain('Cambio 9');
  });

  it('muestra el estado de cada PR', () => {
    const texto = mensaje([], [
      pr(1),
      pr(2, { reviewDecision: 'APPROVED' }),
      pr(3, { reviewDecision: 'CHANGES_REQUESTED' }),
      pr(4, { isDraft: true }),
    ]);
    expect(texto).toContain('espera review');
    expect(texto).toContain('aprobado, falta mergear');
    expect(texto).toContain('con cambios pedidos');
    expect(texto).toContain('borrador');
  });

  it('ordena por prioridad, luego por sprint y deja al final lo que no tiene prioridad', () => {
    const texto = mensaje([
      issue(1, { labels: [] }),
      issue(2),
      issue(3, { milestone: { title: 'Sprint 3', dueOn: '2026-11-27T00:00:00Z' } }),
      issue(4, { labels: [{ name: 'priority:p0' }] }),
    ]);
    expect(texto.match(/Tarea \d/g)).toEqual(['Tarea 4', 'Tarea 3', 'Tarea 2', 'Tarea 1']);
  });

  it('marca el sprint vencido, pero no el que vence hoy', () => {
    const sprint = dueOn => ({ milestone: { title: 'Sprint', dueOn } });
    expect(mensaje([issue(1, sprint('2026-11-22T00:00:00Z'))])).toContain('vencido');
    expect(mensaje([issue(1, sprint('2026-11-23T00:00:00Z'))])).not.toContain('vencido');
  });

  it('muestra un issue compartido a cada responsable', () => {
    const texto = mensaje([issue(1, { assignees: [{ login: 'KERMITH79' }, { login: 'Killercrod' }] })]);
    expect(texto.match(/Tarea 1/g)).toHaveLength(2);
  });

  it('solo muestra sin responsable los issues que el equipo priorizó', () => {
    const texto = mensaje([issue(1, { assignees: [] }), issue(2, { assignees: [], labels: [] })]);
    expect(texto).toContain('Sin responsable');
    expect(texto).toContain('Tarea 1');
    expect(texto).not.toContain('Tarea 2');
  });

  it('avisa cuando no hay pendientes', () => {
    expect(mensaje([])).toContain('No hay pendientes');
  });

  it('usa la fecha de Mérida y no la de UTC', () => {
    const texto = construirMensaje({ issues: [], prs: [], ahora: new Date('2026-11-24T03:00:00Z') });
    expect(texto).toMatch(/23 (de )?nov/);
  });
});

describe('textoSeguro', () => {
  it('neutraliza enlaces, formato y saltos de línea', () => {
    expect(textoSeguro('[x](https://malo.test)\n**y**')).toBe('\\[x\\]\\(https: //malo.test\\) \\*\\*y\\*\\*');
  });

  it('recorta los títulos largos sin partir un emoji', () => {
    expect(textoSeguro('😀'.repeat(100))).toBe(`${'😀'.repeat(79)}…`);
  });
});

describe('dividir', () => {
  it('parte por líneas sin pasar del límite ni perder contenido', () => {
    const texto = Array.from({ length: 10 }, (_, i) => `linea ${i}`).join('\n');
    const partes = dividir(texto, 25);
    expect(partes.every(parte => parte.length <= 25)).toBe(true);
    expect(partes.join('\n')).toBe(texto);
  });

  it('corta una línea que por sí sola excede el límite', () => {
    expect(dividir('abcdefgh', 3)).toEqual(['abc', 'def', 'gh']);
  });
});
