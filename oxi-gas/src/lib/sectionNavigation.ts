export const SECTION_NAVIGATION_EVENT = 'oxigas:navigate-section';

/** Keep the destination aligned while the home page's async sections load. */
export function scrollToHomeSection(id: string): () => void {
  const target = document.getElementById(id);
  if (!target) return () => {};
  let frame = 0;
  let stopped = false;
  const align = () => {
    if (stopped) return;
    const bar = document.querySelector<HTMLElement>('[data-header-bar]');
    const header = bar?.closest('header');
    const style = header ? getComputedStyle(header) : null;
    const offset = bar ? bar.offsetHeight + parseFloat(style?.paddingTop || '0') + parseFloat(style?.paddingBottom || '0') + 12 : 0;
    const top = id === 'inicio' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: 'instant' });
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(align);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(document.querySelector('main') || document.body);
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    clearTimeout(timer);
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, stop);
  };
  const timer = window.setTimeout(stop, 6000);
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, stop, { passive: true });
  schedule();
  return stop;
}
