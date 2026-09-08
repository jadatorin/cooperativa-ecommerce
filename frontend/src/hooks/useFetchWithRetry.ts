"use client";

import { useState, useEffect } from "react";

interface UseFetchOptions {
  retry?: number; // cantidad de reintentos (default 2)
  delay?: number; // delay ms entre reintentos (default 1000)
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useFetchWithRetry<T>(
  url: string,
  options: UseFetchOptions = {}
): [T | null, boolean, (page?: number) => Promise<void>, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.retry ?? 2;
  const delay = options.delay ?? 1000;

  const performFetch = async (page?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json() as T;
      setData(result);
      setRetryCount(0); // reset on success
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Error desconocido");
      setError(e);
      options.onError?.(e);
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setLoading(false);
        // Delay before retry
        const timer = setTimeout(() => {
          setLoading(true);
          performFetch(page);
        }, delay);
        return; // exit, will retry after delay
      }
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    performFetch();
    // Cleanup if needed
    return () => {};
  }, []);

  return [data, loading, performFetch, error];
}

export function useFetchWithRetryPage<T>(
  url: string,
  options: UseFetchOptions = {}
): [T | null, boolean, (page?: number) => Promise<void>, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.retry ?? 2;
  const delay = options.delay ?? 1000;

  const fetchPage = async (page?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${url}${page ? `?page=${page}` : ""}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json() as T;
      setData(result);
      setRetryCount(0); // reset on success
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Error desconocido");
      setError(e);
      options.onError?.(e);
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setLoading(false);
        const timer = setTimeout(() => {
          setLoading(true);
          fetchPage(page);
        }, delay);
        return;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, []);

  return [data, loading, fetchPage, error];
}

export { useFetchWithRetry };