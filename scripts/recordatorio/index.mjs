// Recordatorio de issues y PRs pendientes en Discord (.github/workflows/recordatorio.yml).
//
//   node scripts/recordatorio/index.mjs              solo lo imprime
//   node scripts/recordatorio/index.mjs --publicar   lo manda a Discord
//
// Requiere gh con sesión o GH_TOKEN. Para publicar: DISCORD_WEBHOOK_URL (secreto).
import { execFileSync } from 'node:child_process';
import { publicar } from './discord.mjs';
import { construirMensaje, dividir } from './mensaje.mjs';

const MAXIMO = '1000';
const BUFFER_BYTES = 20 * 1024 * 1024;

function listar(tipo, campos) {
  const salida = execFileSync('gh', [tipo, 'list', '--state', 'open', '--limit', MAXIMO, '--json', campos], {
    encoding: 'utf8',
    maxBuffer: BUFFER_BYTES,
  });
  return JSON.parse(salida);
}

try {
  const mensaje = construirMensaje({
    issues: listar('issue', 'number,title,url,body,assignees,labels,milestone'),
    prs: listar('pr', 'number,title,url,body,author,isDraft,reviewDecision,closingIssuesReferences'),
    ahora: new Date(),
  });
  if (process.argv.includes('--publicar')) {
    await publicar(process.env.DISCORD_WEBHOOK_URL, dividir(mensaje));
    console.log('Recordatorio publicado en Discord.');
  } else {
    console.log(mensaje);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
