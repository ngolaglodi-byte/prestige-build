"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Functional wrapper to display error state - avoids using hooks in class component context
function ErrorFallbackUI({ 
  error, 
  onRetry,
  onGoBack,
}: { 
  error: Error | null; 
  onRetry: () => void;
  onGoBack: () => void;
}) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-white">
      <div className="text-center max-w-lg p-8 bg-[#111] border border-white/10 rounded-xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Impossible de charger cette section</h2>
        <p className="text-gray-400 text-sm mb-4">
          Une erreur s&apos;est produite lors du chargement du workspace.
        </p>
        {error && process.env.NODE_ENV === "development" && (
          <details className="text-left mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-xs">
            <summary className="cursor-pointer text-red-400 mb-2">Détails de l&apos;erreur</summary>
            <pre className="text-red-300 overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Retour aux projets
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm bg-accent hover:bg-accentDark text-white rounded transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[WorkspaceErrorBoundary] Caught error:", error);
    console.error("[WorkspaceErrorBoundary] Error info:", errorInfo);
    
    this.setState({ errorInfo });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service in production
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      console.error("[WorkspaceErrorBoundary] Production error logged:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  private handleRetry = () => {
    // Reset error state without full page reload - allows React to re-render children
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoBack = () => {
    // Navigate to projects page using standard navigation
    if (typeof window !== "undefined") {
      window.location.href = "/projects";
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallbackUI 
          error={this.state.error} 
          onRetry={this.handleRetry}
          onGoBack={this.handleGoBack}
        />
      );
    }

    return this.props.children;
  }
}

export default WorkspaceErrorBoundary;
