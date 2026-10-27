import type { CategoryGroup } from '../hooks/useCategoryGroups';
import type { Product } from './models';

type CategoryProduct = Pick<Product, 'category' | 'product_category_links'>;
export const categoryKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export function categoryPath(id: string, categories: readonly CategoryGroup[]): string {
  const labels: string[] = [];
  const seen = new Set<string>();
  let node = categories.find(c => c.id === id);
  while (node?.id && !seen.has(node.id)) {
    seen.add(node.id); labels.unshift(node.label);
    node = categories.find(c => c.id === node!.parent_id);
  }
  return labels.join(' → ');
}

export function categoryBranch(id: string, categories: readonly CategoryGroup[]): Set<string> {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.id && category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
        ids.add(category.id); changed = true;
      }
    }
  }
  return ids;
}

export function belongsToCategory(product: CategoryProduct, id: string, categories: readonly CategoryGroup[], primaryOnly = false): boolean {
  const branch = categoryBranch(id, categories);
  if (product.product_category_links.length) return product.product_category_links.some(link => branch.has(link.category_id) && (!primaryOnly || link.is_primary));
  // Compatibilidad con datos anteriores mientras se completa la migración.
  return categories.some(cat => cat.id && branch.has(cat.id) && [cat.label, ...cat.slugs].some(label => categoryKey(label) === categoryKey(product.category ?? '')));
}

export function primaryCategoryPath(product: CategoryProduct, categories: readonly CategoryGroup[]): string {
  const link = product.product_category_links.find(item => item.is_primary);
  return link ? categoryPath(link.category_id, categories) : product.category ?? 'Sin clasificar';
}

export function orderedCategories(categories: readonly CategoryGroup[]): CategoryGroup[] {
  return [...categories].sort((a, b) => categoryPath(a.id ?? '', categories).localeCompare(categoryPath(b.id ?? '', categories), 'es'));
}
