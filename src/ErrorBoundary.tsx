import React, { ReactNode, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.retry) || (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-red-900">Oops! Algo deu errado</h1>
                <p className="text-red-700 text-sm">{this.state.error?.message || 'Um erro inesperado ocorreu'}</p>
              </div>
              <button
                onClick={this.retry}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-200 text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Loading Skeleton Component
export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-3 bg-slate-100 rounded-lg w-full" />
          <div className="h-3 bg-slate-100 rounded-lg w-5/6" />
        </div>
      ))}
    </div>
  );
}

// Loading Spinner Component
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin" />
      </div>
    </div>
  );
}

// Error Alert Component
export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-900">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-700 text-lg font-bold"
      >
        ✕
      </button>
    </div>
  );
}
