import { useCallback, useState } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [asyncFunction]);

  if (immediate) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback(() => {
      execute();
    }, [execute])();
  }

  return { ...state, execute };
}

export function useError() {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string, duration = 5000) => {
    setError(message);
    setTimeout(() => setError(null), duration);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, showError, clearError };
}

export function useLoading() {
  const [loading, setLoading] = useState(false);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  return { loading, startLoading, stopLoading };
}
