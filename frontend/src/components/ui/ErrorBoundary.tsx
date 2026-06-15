import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. If omitted, a themed reload card is shown. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Catches render-time crashes — including failures to load a lazily-imported
 * route/trainer chunk (common when a user keeps a stale tab open across a
 * deploy and the old hashed chunk 404s). Without this, such a failure would
 * white-screen the whole app, since <Suspense> only handles loading, not errors.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    // Vite/Rollup chunk-load failures surface with these messages.
    const isChunkError = /loading chunk|dynamically imported module|importing a module script failed|failed to fetch/i.test(msg);
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface for debugging; a real error-reporting service could hook in here.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return <>{this.props.fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-6">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-white">
          {this.state.isChunkError ? 'Une nouvelle version est disponible' : 'Une erreur est survenue'}
        </h2>
        <p className="max-w-sm text-sm text-gray-400">
          {this.state.isChunkError
            ? "Le contenu de cette page a été mis à jour depuis l'ouverture de l'onglet. Recharge pour récupérer la dernière version."
            : "Quelque chose s'est mal passé en affichant cette page. Tu peux recharger pour réessayer."}
        </p>
        <button
          onClick={this.handleReload}
          className="bg-felt-600 hover:bg-felt-500 text-white border border-felt-500 shadow-glow-green
                     px-5 py-2.5 rounded-lg font-medium transition-all duration-150 cursor-pointer"
        >
          Recharger la page
        </button>
      </div>
    );
  }
}
