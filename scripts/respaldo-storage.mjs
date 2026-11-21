#!/usr/bin/env node
// Respaldo y recuperación de Supabase Storage (#28), independiente de las
// copias de PostgreSQL: esas guardan las filas de storage.objects, no los archivos.
//
//   node scripts/respaldo-storage.mjs respaldar <carpeta-destino>
//   node scripts/respaldo-storage.mjs restaurar <carpeta-de-un-respaldo>
//
// Variables: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (clave secreta; nunca en
// VITE_* ni en Git). Opcional: RESPALDO_RETENER (por omisión 14 respaldos).
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const BUCKETS = ['materiales', 'reactivos', 'terminos'];
const PAGINA = 1000;

function cliente() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(url, clave, { auth: { persistSession: false } });
}

const sha256 = datos => createHash('sha256').update(datos).digest('hex');

// list() devuelve un nivel: las carpetas llegan con id null y se recorren.
async function listarObjetos(storage, bucket, prefijo = '') {
  const objetos = [];
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await storage.from(bucket).list(prefijo, { limit: PAGINA, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`No se pudo listar ${bucket}/${prefijo}: ${error.message}`);
    for (const entrada of data) {
      const ruta = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
      if (entrada.id === null) objetos.push(...(await listarObjetos(storage, bucket, ruta)));
      else objetos.push({ ruta, mimetype: entrada.metadata?.mimetype ?? null });
    }
    if (data.length < PAGINA) return objetos;
  }
}

async function respaldar(destinoBase) {
  const { storage } = cliente();
  const sello = new Date().toISOString().replace(/[:.]/g, '-');
  const destino = join(destinoBase, `storage-${sello}`);
  const manifiesto = { creado: new Date().toISOString(), origen: process.env.SUPABASE_URL, objetos: [] };

  for (const bucket of BUCKETS) {
    for (const { ruta, mimetype } of await listarObjetos(storage, bucket)) {
      const { data, error } = await storage.from(bucket).download(ruta);
      if (error) throw new Error(`No se pudo descargar ${bucket}/${ruta}: ${error.message}`);
      const datos = Buffer.from(await data.arrayBuffer());
      const archivo = join(destino, bucket, ruta);
      await mkdir(dirname(archivo), { recursive: true });
      await writeFile(archivo, datos);
      manifiesto.objetos.push({ bucket, ruta, mimetype, bytes: datos.length, sha256: sha256(datos) });
    }
  }

  await mkdir(destino, { recursive: true });
  await writeFile(join(destino, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2));
  console.log(`Respaldo completo: ${manifiesto.objetos.length} archivos en ${destino}`);
  await podar(destinoBase, Number(process.env.RESPALDO_RETENER ?? 14));
}

// Conserva los respaldos más recientes; el nombre lleva la fecha y ordena solo.
async function podar(destinoBase, retener) {
  const respaldos = (await readdir(destinoBase)).filter(n => n.startsWith('storage-')).sort();
  for (const viejo of respaldos.slice(0, Math.max(0, respaldos.length - retener))) {
    await rm(join(destinoBase, viejo), { recursive: true, force: true });
    console.log(`Respaldo antiguo eliminado: ${viejo}`);
  }
}

async function restaurar(origen) {
  const { storage } = cliente();
  const manifiesto = JSON.parse(await readFile(join(origen, 'manifiesto.json'), 'utf8'));
  let fallidos = 0;
  for (const { bucket, ruta, mimetype, sha256: esperado } of manifiesto.objetos) {
    const datos = await readFile(join(origen, bucket, ruta));
    if (sha256(datos) !== esperado) {
      console.error(`Archivo dañado en el respaldo, se omite: ${bucket}/${ruta}`);
      fallidos += 1;
      continue;
    }
    const { error } = await storage.from(bucket).upload(ruta, datos, { upsert: true, contentType: mimetype ?? undefined });
    if (error) {
      console.error(`No se pudo restaurar ${bucket}/${ruta}: ${error.message}`);
      fallidos += 1;
    }
  }
  console.log(`Restaurados ${manifiesto.objetos.length - fallidos} de ${manifiesto.objetos.length} archivos.`);
  if (fallidos) process.exitCode = 1;
}

const [accion, carpeta] = process.argv.slice(2);
const acciones = { respaldar, restaurar };
if (!acciones[accion] || !carpeta) {
  console.error('Uso: node scripts/respaldo-storage.mjs <respaldar|restaurar> <carpeta>');
  process.exit(2);
}
try {
  await acciones[accion](carpeta);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
