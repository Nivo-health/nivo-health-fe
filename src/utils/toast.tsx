// Toast notification utilities
// This provides a simple API for showing toast notifications

import * as Toast from '../components/ui/Toast';
import { useEffect, useState } from 'react';

// Toast state management
let toastId = 0;
export type ToastData = {
  id: number;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
};

const toasts: ToastData[] = [];

let toastListeners: Array<(toasts: ToastData[]) => void> = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

export const toast = {
  /**
   * Show a toast notification
   */
  show(options: {
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
  }) {
    const id = toastId++;
    const duration = options.duration ?? 5000;
    const toastData: ToastData = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration,
    };

    toasts.push(toastData);
    notifyListeners();

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  },

  /**
   * Show a success toast
   */
  success(title: string, description?: string) {
    return this.show({ title, description, variant: 'success' });
  },

  /**
   * Show an error toast
   */
  error(title: string, description?: string) {
    return this.show({ title, description, variant: 'error' });
  },

  /**
   * Show a warning toast
   */
  warning(title: string, description?: string) {
    return this.show({ title, description, variant: 'warning' });
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss(id: number) {
    const index = toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
      notifyListeners();
    }
  },

  /**
   * Subscribe to toast changes (for React components)
   */
  subscribe(listener: (toasts: ToastData[]) => void) {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  },

  /**
   * Get current toasts
   */
  getToasts() {
    return [...toasts];
  },
};

// React component to render toasts
export function Toaster() {
  const [toastList, setToastList] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToastList);
    setToastList(toast.getToasts());
    return unsubscribe;
  }, []);

  return (
    <Toast.ToastProvider>
      <Toast.ToastViewport />
      {toastList.map((toastData) => (
        <Toast.Toast
          key={toastData.id}
          variant={toastData.variant}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              toast.dismiss(toastData.id);
            }
          }}
        >
          {toastData.title && (
            <Toast.ToastTitle>{toastData.title}</Toast.ToastTitle>
          )}
          {toastData.description && (
            <Toast.ToastDescription>
              {toastData.description}
            </Toast.ToastDescription>
          )}
          <Toast.ToastClose />
        </Toast.Toast>
      ))}
    </Toast.ToastProvider>
  );
}
