import { useState, useEffect, useCallback } from "react";

type QueryKey = string[];

// Global event emitter for query invalidation
const queryEvents = new EventTarget();

export function useQueryClient() {
  return {
    invalidateQueries: ({ queryKey }: { queryKey: QueryKey }) => {
      const eventName = queryKey[0]; // simplistic invalidation matching the first key part
      queryEvents.dispatchEvent(new Event(`invalidate-${eventName}`));
    }
  };
}

export function useQuery<T>({ queryKey, queryFn }: { queryKey: QueryKey; queryFn: () => Promise<T> }) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await queryFn();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    fetchData();

    // Listen for invalidations
    const eventName = queryKey[0];
    const listener = () => fetchData();
    queryEvents.addEventListener(`invalidate-${eventName}`, listener);

    return () => {
      queryEvents.removeEventListener(`invalidate-${eventName}`, listener);
    };
  }, [fetchData, queryKey[0]]);

  return { data, isLoading, error };
}

export function useMutation<TData, TVariables>({ 
  mutationFn, 
  onSuccess, 
  onError 
}: { 
  mutationFn: (vars: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (err: Error) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (vars?: TVariables) => {
    setIsPending(true);
    try {
      const data = await mutationFn(vars as TVariables);
      onSuccess?.(data);
    } catch (err: any) {
      onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
