import React, { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error capturado por ErrorBoundary:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[hsl(var(--surface-0))] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/15 text-red-600 mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] mb-2">
              Algo salió mal
            </h1>

            <p className="text-[hsl(var(--text-soft))] mb-8 leading-relaxed">
              Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página o 
              contactate con nosotros si el problema persiste.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Volver al inicio
              </button>

              <a
                href="https://wa.me/5491134446666"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--surface-3))] text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-1))] font-semibold py-3 px-6 transition-colors"
              >
                Contactar por WhatsApp
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs font-mono text-red-600 text-left overflow-auto max-h-24">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
