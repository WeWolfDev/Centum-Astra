// Arma el recordatorio de pendientes para Discord. El repo es público: títulos
// y cuerpos los escribe cualquiera, así que se tratan como texto no confiable.
const EQUIPO = [
  { login: 'KERMITH79', nombre: 'Omar' },
  { login: 'Killercrod', nombre: 'Cesar' },
  { login: 'David-Alcocer', nombre: 'David' },
];
const ZONA = 'America/Merida';
const LIMITE_DISCORD = 2000;
const LARGO_TITULO = 80;
const SIN_PRIORIDAD = 9;
const SIN_FECHA = '9999-12-31';
const REVISION = { APPROVED: 'aprobado, falta mergear', CHANGES_REQUESTED: 'con cambios pedidos' };

export function dependencias(cuerpo) {
  const lineas = (cuerpo ?? '').match(/depende de:.*/gi) ?? [];
  return lineas.flatMap(linea => [...linea.matchAll(/#(\d+)/g)].map(([, numero]) => Number(numero)));
}

// También se lee el cuerpo: GitHub no enlaza el issue si el PR apunta a otra rama.
function issuesQueCierra(pr) {
  const enCuerpo = (pr.body ?? '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?[ \t]+#(\d+)/gi);
  return [...pr.closingIssuesReferences.map(({ number }) => number), ...Array.from(enCuerpo, ([, numero]) => Number(numero))];
}

// Sin saltos, formato ni enlaces: un título no puede hacerse pasar por el bot.
export function textoSeguro(texto) {
  const caracteres = Array.from(texto.replace(/\s+/g, ' ').trim());
  const corto = caracteres.length > LARGO_TITULO ? `${caracteres.slice(0, LARGO_TITULO - 1).join('')}…` : caracteres.join('');
  return corto.replace(/[\\*_~`|[\]()<>]/g, '\\$&').replaceAll('://', ': //');
}

export function dividir(texto, limite = LIMITE_DISCORD) {
  const lineas = texto.split('\n').flatMap(linea => {
    const trozos = Math.max(1, Math.ceil(linea.length / limite));
    return Array.from({ length: trozos }, (_, i) => linea.slice(i * limite, (i + 1) * limite));
  });
  return lineas.reduce((partes, linea) => {
    if (partes.length === 0) return [linea];
    const unida = `${partes.at(-1)}\n${linea}`;
    return unida.length <= limite ? [...partes.slice(0, -1), unida] : [...partes, linea];
  }, []);
}

function prioridad(issue) {
  const etiqueta = issue.labels.find(({ name }) => /^priority:p\d$/.test(name));
  return etiqueta ? Number(etiqueta.name.at(-1)) : SIN_PRIORIDAD;
}

const vence = issue => issue.milestone?.dueOn?.slice(0, 10) ?? SIN_FECHA;

const porUrgencia = (a, b) => prioridad(a) - prioridad(b) || vence(a).localeCompare(vence(b)) || a.number - b.number;

function lineaIssue(issue, hoy) {
  const nivel = prioridad(issue) === SIN_PRIORIDAD ? '' : `P${prioridad(issue)} `;
  const vencido = vence(issue) < hoy ? ` · ${textoSeguro(issue.milestone.title)} vencido` : '';
  return `• ${nivel}#${issue.number} ${textoSeguro(issue.title)}${vencido} <${issue.url}>`;
}

function lineaPr(pr) {
  const nombre = EQUIPO.find(({ login }) => login === pr.author.login).nombre;
  const estado = pr.isDraft ? 'borrador' : (REVISION[pr.reviewDecision] ?? 'espera review');
  return `• #${pr.number} ${textoSeguro(pr.title)} (${nombre}, ${estado}) <${pr.url}>`;
}

function clasificar(issues, prs, prsEquipo) {
  const abiertos = new Set([...issues, ...prs].map(({ number }) => number));
  const enPr = new Set(prsEquipo.flatMap(issuesQueCierra));
  return issues.map(issue => {
    if (enPr.has(issue.number)) return { issue, estado: 'pr' };
    const bloqueado =
      issue.labels.some(({ name }) => name === 'status:blocked') ||
      dependencias(issue.body).some(numero => abiertos.has(numero));
    return { issue, estado: bloqueado ? 'bloqueado' : 'libre' };
  });
}

function seccion(titulo, items, hoy) {
  if (items.length === 0) return [];
  const de = estado => items.filter(item => item.estado === estado).map(item => item.issue);
  const libres = de('libre').sort(porUrgencia);
  const enPr = de('pr').length;
  const bloqueados = de('bloqueado').length;
  const resumen = [
    `${libres.length} para avanzar`,
    enPr && `${enPr} en PR`,
    bloqueados && `${bloqueados} bloqueado${bloqueados === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return ['', `**${titulo}**: ${resumen.join(', ')}`, ...libres.map(issue => lineaIssue(issue, hoy))];
}

export function construirMensaje({ issues, prs, ahora }) {
  const hoy = ahora.toLocaleDateString('en-CA', { timeZone: ZONA });
  const fecha = ahora.toLocaleDateString('es-MX', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'short' });
  const prsEquipo = prs.filter(pr => EQUIPO.some(({ login }) => login === pr.author?.login));
  const items = clasificar(issues, prs, prsEquipo);

  const secciones = [
    ...(prsEquipo.length ? ['', '**PRs abiertos**', ...prsEquipo.map(lineaPr)] : []),
    ...EQUIPO.flatMap(({ login, nombre }) =>
      seccion(nombre, items.filter(({ issue }) => issue.assignees.some(asignado => asignado.login === login)), hoy),
    ),
    // Solo lo priorizado: cualquiera puede abrir un issue, no cualquiera etiquetarlo.
    ...seccion(
      'Sin responsable',
      items.filter(({ issue }) => issue.assignees.length === 0 && prioridad(issue) !== SIN_PRIORIDAD),
      hoy,
    ),
  ];
  const contenido = secciones.length ? secciones : ['', 'No hay pendientes.'];
  return [`**Pendientes de Centum-Astra · ${fecha}**`, ...contenido].join('\n');
}
