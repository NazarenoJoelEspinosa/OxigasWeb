import { useEffect } from 'react';

export type Theme = 'light';

export function useTheme() {
  // Siempre modo claro — el toggle fue removido por decisión del cliente
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    // Limpiar preferencia guardada para que no haya conflictos
    window.localStorage.removeItem('oxi-gas-theme-v2');
  }, []);

  return {
    theme: 'light' as Theme,
    toggleTheme: () => {},
  } as const;
}
