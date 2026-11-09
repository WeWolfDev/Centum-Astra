// Falla si el bundle del navegador contiene una clave privada de Supabase (#38).
// Uso: node scripts/verificar-bundle.mjs [dist]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const JWT = /eyJ[\w-]+\.(eyJ[\w-]+)\.[\w-]+/g;
const CLAVE_SECRETA = /sb_secret_[\w-]+/;

function archivos(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

function esJwtServiceRole(payload) {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).role === 'service_role';
  } catch {
    return false;
  }
}

function contieneClavePrivada(contenido) {
  if (CLAVE_SECRETA.test(contenido)) return true;
  return [...contenido.matchAll(JWT)].some(coincidencia => esJwtServiceRole(coincidencia[1]));
}

const directorio = 'dist';
if (process.argv[2] && process.argv[2] !== directorio) {
  console.error(`Directorio no permitido. Solo se revisa ${directorio}.`);
  process.exit(1);
}
const lista = archivos(directorio);
const expuestos = lista.filter(ruta => contieneClavePrivada(readFileSync(ruta, 'utf8')));

if (expuestos.length > 0) {
  console.error('Clave privada de Supabase detectada en:');
  expuestos.forEach(ruta => console.error(`  ${ruta}`));
  process.exit(1);
}
console.log(`Sin claves privadas en ${lista.length} archivos de ${directorio}.`);
