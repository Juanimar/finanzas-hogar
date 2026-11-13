// Bundles apps-script/main.js + core into a single Code.gs with top-level functions Apps Script can call.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';

const ENTRY_POINTS = ['procesarDiario', 'procesarAhora', 'consolidarReglas', 'reconstruir', 'continuarReconstruccion', 'configurar', 'onOpen', 'importarPlanillaVieja', 'sincronizarInversiones', 'conciliarEstadosAhora'];

const out = await build({
  entryPoints: ['apps-script/main.js'], bundle: true, format: 'iife', globalName: 'FH',
  target: 'es2019', charset: 'utf8', write: false, legalComments: 'none',
});
const wrappers = ENTRY_POINTS.map(f => `function ${f}() { return FH.${f}.apply(null, arguments); }`).join('\n');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/Code.gs', `// Generado por scripts/build-gas.mjs — no editar a mano.\n${out.outputFiles[0].text}\n${wrappers}\n`);
copyFileSync('apps-script/appsscript.json', 'dist/appsscript.json');
console.log('dist/Code.gs', out.outputFiles[0].text.length, 'bytes');
