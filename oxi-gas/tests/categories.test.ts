import { test } from 'node:test';
import assert from 'node:assert/strict';
import { belongsToCategory, categoryBranch, categoryPath } from '../src/lib/categories.ts';
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
