import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const strip = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState({ left: false, right: false });
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
    const element = strip.current;
    if (!element) return;
    const update = () => {
      const left = element.scrollLeft > 1;
      const right = element.scrollWidth - element.clientWidth - element.scrollLeft > 1;
      setScrollable(current => current.left === left && current.right === right ? current : { left, right });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (track.current) observer.observe(track.current);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener('scroll', update); };
  }, []);
  const moveCategories = (direction: number) => {
    close();
    const element = strip.current;
    if (!element) return;
    element.scrollBy({ left: direction * Math.max(180, element.clientWidth * 0.75), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
    <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 sm:px-6 lg:px-8 py-2">
      <button type="button" aria-label="Ver categorías anteriores" aria-controls="shop-category-strip" disabled={!scrollable.left}
        onMouseEnter={close} onClick={() => moveCategories(-1)}
        className="shrink-0 h-10 w-10 inline-flex items-center justify-center rounded-full border border-primary/25 bg-[hsl(var(--surface-0))] text-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-default disabled:hover:bg-[hsl(var(--surface-0))] disabled:hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <ChevronLeft size={21} aria-hidden="true" />
      </button>
      <div ref={strip} id="shop-category-strip" className="min-w-0 flex-1 overflow-x-auto no-scrollbar"
        onFocusCapture={event => {
          const element = strip.current;
          if (!element || !(event.target instanceof HTMLButtonElement)) return;
          const bounds = element.getBoundingClientRect(), button = event.target.getBoundingClientRect();
          if (button.left < bounds.left) element.scrollBy({ left: button.left - bounds.left - 4 });
          else if (button.right > bounds.right) element.scrollBy({ left: button.right - bounds.right + 4 });
        }}>
        <div ref={track} className="flex w-max min-w-full gap-1">
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
      </div>
      <button type="button" aria-label="Ver categorías siguientes" aria-controls="shop-category-strip" disabled={!scrollable.right}
        onMouseEnter={close} onClick={() => moveCategories(1)}
        className="shrink-0 h-10 w-10 inline-flex items-center justify-center rounded-full border border-primary/25 bg-[hsl(var(--surface-0))] text-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-default disabled:hover:bg-[hsl(var(--surface-0))] disabled:hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <ChevronRight size={21} aria-hidden="true" />
      </button>
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
              return <div key={child.id}
                onMouseEnter={() => { if (!window.matchMedia('(min-width: 640px) and (hover: hover)').matches) return; cancelClose(); setPath(previous => [...previous.slice(0, depth + 1), ...(expandable ? [child.id!] : [])]); }}
                onFocus={() => { cancelClose(); }}
                className={`w-full flex items-stretch text-sm font-semibold hover:bg-primary ${expanded ? 'bg-primary' : ''}`}>
                <button type="button" onClick={() => choose(nodeValue(child.id!))}
                  className="min-w-0 flex-1 text-left px-4 py-3 focus-visible:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-200">
                  {child.label}
                </button>
                {expandable && <button type="button" aria-label={`Mostrar subcategorías de ${child.label}`} aria-expanded={expanded}
                  onClick={() => setPath([...path.slice(0, depth + 1), child.id!])}
                  className="shrink-0 min-h-11 w-11 inline-flex items-center justify-center border-l border-white/15 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-200">
                  <ChevronRight size={16} aria-hidden="true" />
                </button>}
              </div>;
            })}
          </div>;
        })}
      </div>
    </div>}
  </nav>;
}
