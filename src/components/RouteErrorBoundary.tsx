import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Detects the "stale deploy" failure: the browser is holding an old index.html
// and tries to lazy-load a chunk whose hashed filename no longer exists after a
// new deploy. The dynamic import() rejects with a recognizable message.
function isChunkLoadError(error: unknown): boolean {
  const msg = (error as Error)?.message || '';
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

const RELOAD_GUARD_KEY = 'chunk-reload-attempted';

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) {
      // A new version was deployed and our cached index.html is stale. Reload
      // ONCE to fetch the fresh HTML + new chunk hashes. The sessionStorage
      // guard prevents an infinite reload loop if the reload doesn't fix it.
      if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
        sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
        window.location.reload();
      }
    }
  }

  componentDidMount() {
    // Clear the reload guard once the app has successfully mounted, so a future
    // stale-deploy can trigger a fresh reload.
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
  }

  handleReload = () => {
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This page failed to load. A quick refresh usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
