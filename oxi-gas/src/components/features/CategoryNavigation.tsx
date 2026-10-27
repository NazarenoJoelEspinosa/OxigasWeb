import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import type { CategoryGroup } from '@/hooks/useCategoryGroups';
import { categoryBranch } from '@/lib/categories';

type Option = { value: string; label: string };
const nodeValue = (id: string) => '__node__' + id;

/** Disclosures, no un selector plano: cada columna muestra un único nivel. */
export function CategoryNavigation({ options, categories, value, onChange }: {
  options: Option[]; categories: CategoryGroup[]; value: string; onChange: (value: string) => void;
}) {
  const [path, setPath] = useState<string[]>([]);
  const nav = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusPanel = useRef(false);
  const isOpen = path.length > 0;
  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = () => { cancelClose(); setPath([]); };
  const children = (id: string) => categories.filter(cat => cat.parent_id === id);
  const choose = (next: string) => { onChange(next); close(); };
  const openRoot = (id: string, button: HTMLButtonElement) => {
    cancelClose(); trigger.current = button; setPath(current => current[0] === id ? current : [id]);
  };

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !nav.current?.contains(event.target)) setPath([]); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); clearTimeout(closeTimer.current); };
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); clearTimeout(closeTimer.current); setPath([]); trigger.current?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [isOpen]);
  useEffect(() => {
    if (path.length && focusPanel.current) {
      panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
      focusPanel.current = false;
    }
  }, [path]);

  return <nav ref={nav} aria-label="Categorías de la tienda" className="relative z-30 border-b border-primary/20 bg-primary/10"
    onMouseEnter={cancelClose} onMouseLeave={() => { cancelClose(); closeTimer.current = setTimeout(() => setPath([]), 200); }}
    onBlur={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-2">
      {[{value:'all',label:'Todos los productos'}, ...options].map(option => {
        const id = option.value.startsWith('__node__') ? option.value.slice(8) : '';
        const expandable = Boolean(id && children(id).length);
        const expanded = expandable && path[0] === id;
        const active = value === option.value || (id && value.startsWith('__node__') && categoryBranch(id, categories).has(value.slice(8)));
        return <button key={option.value} type="button" aria-pressed={Boolean(active)} aria-expanded={expandable ? expanded : undefined}
          aria-controls={expandable ? 'shop-category-panel' : undefined}
          onMouseEnter={event => { if (!window.matchMedia('(min-width: 640px) and (hover: hover)').matches) return; if (expandable) openRoot(id, event.currentTarget); else close(); }}
          onClick={event => {
            onChange(option.value);
            if (expandable) openRoot(id, event.currentTarget); else close();
          }}
          onKeyDown={event => { if (event.key === 'ArrowDown' && expandable) { event.preventDefault(); focusPanel.current = true; trigger.current = event.currentTarget; setPath([id]); } }}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active || expanded ? 'bg-primary text-white' : 'text-[hsl(var(--text-main))] hover:bg-primary/10'}`}>
          {option.label}{expandable && <ChevronDown size={13} aria-hidden="true" />}
        </button>;
      })}
    </div>
    {path.length > 0 && <div ref={panel} id="shop-category-panel" role="region" aria-label={`Subcategorías de ${categories.find(cat => cat.id === path[0])?.label ?? ''}`}
      className="absolute top-full inset-x-4 sm:inset-x-6 max-w-6xl mx-auto bg-[#102031] text-white rounded-b-xl shadow-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/15">
        <span className="text-sm font-semibold">{categories.find(cat => cat.id === path[0])?.label}</span>
        <button type="button" aria-label="Cerrar categorías" onClick={() => { close(); trigger.current?.focus(); }} className="p-1 rounded hover:bg-white/10"><X size={18} /></button>
      </div>
      <div className="flex overflow-x-auto max-h-[60vh]">
        {path.slice(-3).map(id => {
          const depth = path.indexOf(id);
          const current = categories.find(cat => cat.id === id);
          if (!current) return null;
          const last = depth === path.length - 1;
          return <div key={id} className={`${last ? 'block' : 'hidden sm:block'} w-full sm:w-64 sm:min-w-56 sm:flex-1 shrink-0 border-r border-white/10 last:border-r-0 overflow-y-auto`}>
            {depth > 0 && <button type="button" onClick={() => setPath(path.slice(0, depth))} className="sm:hidden w-full text-left px-4 py-3 text-sm text-sky-200 border-b border-white/10">← Volver</button>}
            <button type="button" onClick={() => choose(nodeValue(id))} className="w-full text-left px-4 py-3 text-sm font-bold text-sky-200 border-b border-white/10 hover:bg-primary focus-visible:bg-primary focus-visible:text-white">Ver todos en {current.label}</button>
            {children(id).map(child => {
              const expandable = children(child.id!).length > 0;
              const expanded = path[depth + 1] === child.id;
              return <button type="button" key={child.id} aria-expanded={expandable ? expanded : undefined}
                onMouseEnter={() => { if (!window.matchMedia('(min-width: 640px) and (hover: hover)').matches) return; cancelClose(); setPath(previous => [...previous.slice(0, depth + 1), ...(expandable ? [child.id!] : [])]); }}
                onFocus={() => { cancelClose(); }}
                onClick={() => expandable ? setPath([...path.slice(0, depth + 1), child.id!]) : choose(nodeValue(child.id!))}
                className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-sm font-semibold hover:bg-primary focus-visible:bg-primary focus-visible:outline-none ${expanded ? 'bg-primary' : ''}`}>
                {child.label}{expandable && <ChevronRight size={15} aria-hidden="true" />}
              </button>;
            })}
          </div>;
        })}
      </div>
    </div>}
  </nav>;
}
