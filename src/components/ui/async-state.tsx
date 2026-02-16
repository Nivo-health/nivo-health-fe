import CircleAlertIcon from 'lucide-react/dist/esm/icons/circle-alert';
import type * as React from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface AsyncStateProps {
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

function AsyncState({
  loading,
  error,
  children,
  loadingFallback,
  errorFallback,
  onRetry,
  className,
}: AsyncStateProps) {
  if (loading) {
    return (
      loadingFallback ?? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground',
            className,
          )}
        >
          <Spinner className="size-6" />
          <span className="text-sm">Loading...</span>
        </div>
      )
    );
  }

  if (error) {
    return (
      errorFallback ?? (
        <div className={cn('py-4', className)}>
          <Alert.Root variant="error">
            <CircleAlertIcon />
            <Alert.Title>{error}</Alert.Title>
            {onRetry && (
              <Alert.Action>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              </Alert.Action>
            )}
          </Alert.Root>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export { AsyncState };
export type { AsyncStateProps };
