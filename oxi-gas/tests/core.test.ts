import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCart } from '../src/lib/cart-storage.ts';
import { readAllPages } from '../src/lib/pagination.ts';
import { stableCustomFields, productSchema, isMissingTable } from '../src/lib/models.ts';
import { normalizeQuantity } from '../src/lib/format.ts';
import { restoredPath } from '../src/lib/redirect.ts';

test('carrito: JSON inválido y valores no string no rompen el render', () => {
  assert.deepEqual(parseCart('{'), []);
  assert.deepEqual(parseCart('{"code":"A"}'), []);
  assert.deepEqual(parseCart('[{"code":"A","fields":{"cantidad":2}}]'), []);
  assert.deepEqual(parseCart('[{"code":"A","fields":{"cantidad":"2"}},{"code":"A"},{"code":""}]'), [{ code: 'A', fields: { cantidad: '2' } }]);
});
test('campos personalizados: renombrar conserva la clave y rechaza duplicados', () => {
  assert.equal(stableCustomFields([{ key: 'diametro', label: 'Medida nueva' }])[0].key, 'diametro');
  assert.throws(() => stableCustomFields([{ key: 'a', label: 'Uno' }, { key: 'a', label: 'Dos' }]));
  assert.throws(() => stableCustomFields([{ key: '', label: 'Uno' }]));
});
test('datos de base: normaliza nulos y rechaza estructuras inválidas', () => {
  const p = productSchema.parse({ id: 'a', code: 'A', name: 'Producto', images: null, custom_fields: null, price: null });
  assert.deepEqual(p.images, []);
  assert.equal(p.price, undefined);
  assert.equal(productSchema.parse({ id: 'b', code: 'B', name: 'Histórico', visible: null }).visible, false);
  assert.throws(() => productSchema.parse({ id: 'a', code: 'A', name: 'Producto', custom_fields: 12 }));
});
test('paginación: respeta límites de servidor menores al solicitado sin perder filas', async () => {
  const source = [1, 2, 3, 4, 5];
  const all = await readAllPages(async (from, to) => ({ data: source.slice(from, Math.min(to + 1, from + 2)), error: null }));
  assert.deepEqual(all, source);
});
test('paginación: error intermedio no se transforma en catálogo vacío', async () => {
  await assert.rejects(readAllPages(async from => ({ data: from ? null : [1], error: from ? new Error('red') : null })), /red/);
});
test('tabla ausente no se confunde con falta de permisos ni errores de red', () => {
  assert.equal(isMissingTable({ code: 'PGRST205' }), true);
  assert.equal(isMissingTable({ code: '42P01' }), true);
  assert.equal(isMissingTable({ code: '42501' }), false);
  assert.equal(isMissingTable(new Error('relation error')), false);
});
test('cantidades vacías, infinitas o negativas no llegan al mensaje', () => {
  for (const value of ['', -5, 'abc', Infinity]) assert.equal(normalizeQuantity(value), '1');
  assert.equal(normalizeQuantity('3'), '3');
  assert.equal(normalizeQuantity('3.5'), '3');
});
test('rutas profundas conservan filtros y rechazan escapes fuera del sitio', () => {
  assert.equal(restoredPath('/OxigasWeb/', '/productos?q=Bosch#detalle'), '/OxigasWeb/productos?q=Bosch#detalle');
  assert.equal(restoredPath('/', '/productos'), '/productos');
  for (const value of ['//otro.example', '/\\otro.example', '/../admin', '/\n/otro.example']) assert.equal(restoredPath('/OxigasWeb/', value), null);
});
