import { test } from 'node:test';
import assert from 'node:assert/strict';
import { belongsToCategory, categoryBranch, categoryPath, visibleCategoryRows } from '../src/lib/categories.ts';
const categories = [
  { id:'s', label:'Insumos', parent_id:null, slugs:[], icon:'', sort_order:0 },
  { id:'d', label:'Discos', parent_id:'s', slugs:[], icon:'', sort_order:0 },
  { id:'c', label:'Corte', parent_id:'d', slugs:['corte'], icon:'', sort_order:0 },
  { id:'w', label:'Soldadura', parent_id:null, slugs:[], icon:'', sort_order:0 },
];
test('subcategoría incluye ancestros y sección relacionada sin cambiar principal', () => {
  const product = { category:'Corte', product_category_links:[{category_id:'c',is_primary:true},{category_id:'w',is_primary:false}] };
  assert.equal(categoryPath('c',categories),'Insumos → Discos → Corte');
  assert.deepEqual([...categoryBranch('s',categories)], ['s','d','c']);
  for (const id of ['s','d','c','w']) assert.equal(belongsToCategory(product,id,categories),true);
  assert.equal(belongsToCategory(product,'w',categories,true),false);
  assert.equal(belongsToCategory({category:'corte',product_category_links:[]},'s',categories),true);
});

test('árbol de administración pliega cada nivel y busca manteniendo los ancestros', () => {
  const ids = (expanded: string[], query='') => visibleCategoryRows(categories, new Set(expanded), query).map(row => row.category.id);
  assert.deepEqual(ids([]), ['s','w']);
  assert.deepEqual(ids(['s']), ['s','d','w']);
  assert.deepEqual(ids(['s','d']), ['s','d','c','w']);
  assert.deepEqual(ids(['d']), ['s','w']);
  assert.deepEqual(ids([], 'córte'), ['s','d','c']);
  assert.deepEqual(ids([], 'inexistente'), []);
  assert.deepEqual(visibleCategoryRows(categories,new Set(['s','d'])).map(row => row.depth),[0,1,2,0]);
});
