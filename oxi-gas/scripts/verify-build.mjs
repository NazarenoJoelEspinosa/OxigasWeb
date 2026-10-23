import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
const base = process.argv[2] || '/';
const index = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.ok(index.includes('src="' + base + 'assets/'), 'El HTML debe usar la base configurada');
const fallback = await readFile(new URL('../dist/404.html', import.meta.url), 'utf8');
const script = fallback.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Debe existir fallback de rutas profundas');
let destination;
runInNewContext(script, { location: {
  pathname: base + 'productos', search: '?q=Bosch', hash: '#detalle',
  replace(value) { destination = value; },
} });
const url = new URL(destination, 'https://local.invalid');
assert.equal(url.pathname, base);
assert.equal(url.searchParams.get('__route'), '/productos?q=Bosch#detalle');
console.log('Build y fallback verificados para ' + base);
