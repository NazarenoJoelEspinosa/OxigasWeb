import type { CategoryGroup } from '@/hooks/useCategoryGroups';
import { categoryPath, orderedCategories } from '@/lib/categories';

export function ClassificationFields({ categories, primary, related, onPrimary, onRelated, prefix = 'product', showPrimary = true, showRelated = true }: {
  categories: CategoryGroup[]; primary: string; related: string[];
  onPrimary: (id: string) => void; onRelated: (ids: string[]) => void; prefix?: string; showPrimary?: boolean; showRelated?: boolean;
}) {
  const options = orderedCategories(categories).filter(category => category.id);
  return <div className="space-y-4">
    {showPrimary && <div><label htmlFor={`${prefix}-primary`} className="block text-sm font-medium mb-1">Categoría principal</label>
      <select id={`${prefix}-primary`} value={primary} onChange={e => { onPrimary(e.target.value); onRelated(related.filter(id => id !== e.target.value)); }} className="w-full border rounded p-2 bg-background text-sm">
        <option value="">Sin clasificar</option>
        {options.map(cat => <option key={cat.id} value={cat.id}>{categoryPath(cat.id!, categories)}</option>)}
      </select>
    </div>}
    {showRelated && <fieldset className="border rounded p-3"><legend className="text-sm font-medium px-1">También mostrar en</legend>
      <p className="text-xs text-muted-foreground mb-2">Secciones relacionadas. No crean copias del producto.</p>
      <div className="max-h-52 overflow-y-auto space-y-1">
        {options.filter(cat => cat.id !== primary).map(cat => <label key={cat.id} className="flex items-center gap-2 text-sm py-1.5">
          <input type="checkbox" checked={related.includes(cat.id!)} onChange={e => onRelated(e.target.checked ? [...related, cat.id!] : related.filter(id => id !== cat.id))} />
          {categoryPath(cat.id!, categories)}
        </label>)}
      </div>
    </fieldset>}
  </div>;
}
