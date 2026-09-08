"use client";

import { useEffect, useState } from "react";

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: (error: Error, info: string) => void;
  retry?: () => void;
}

export function ErrorBoundary({ fallback, onError, retry }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (err: Error) => {
      setError(err);
      setHasError(true);
      onError?.(err, "component");
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [onError]);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    retry?.();
  };

  if (hasError) {
    console.error("ErrorBoundary capturado:", error);
    return fallback;
  }

  return null;
}