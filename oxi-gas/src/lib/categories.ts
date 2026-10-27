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

export function visibleCategoryRows(categories: readonly CategoryGroup[], expanded: ReadonlySet<string>, search = '') {
  const query = categoryKey(search);
  const included = new Set<string>();
  const byId = new Map(categories.filter(cat => cat.id).map(cat => [cat.id!, cat]));
  if (query) for (const category of byId.values()) {
    if (!categoryKey(categoryPath(category.id!, categories)).includes(query)) continue;
    let node: CategoryGroup | undefined = category;
    const visited = new Set<string>();
    while (node?.id && !visited.has(node.id)) {
      visited.add(node.id); included.add(node.id); node = byId.get(node.parent_id ?? '');
    }
  }
  const children = new Map<string, CategoryGroup[]>();
  for (const category of byId.values()) {
    const parent = category.parent_id && byId.has(category.parent_id) ? category.parent_id : '';
    children.set(parent, [...(children.get(parent) ?? []), category]);
  }
  for (const list of children.values()) list.sort((a,b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, 'es'));
  const rows: { category: CategoryGroup; depth: number; childCount: number; open: boolean }[] = [];
  const visited = new Set<string>();
  const walk = (parent: string, depth: number) => {
    for (const category of children.get(parent) ?? []) {
      if (visited.has(category.id!) || (query && !included.has(category.id!))) continue;
      visited.add(category.id!);
      const childCount = children.get(category.id!)?.length ?? 0;
      const open = childCount > 0 && (Boolean(query) || expanded.has(category.id!));
      rows.push({category, depth, childCount, open});
      if (open) walk(category.id!, depth + 1);
    }
  };
  walk('', 0);
  return rows;
}
