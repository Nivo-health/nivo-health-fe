import { useCallback, useState } from 'react';

type UseShowOptions = {
  onShow?: () => void;
  onHide?: () => void;
  onToggle?: (shown: boolean) => void;
};

export const useShow = (defaultShown = false, options: UseShowOptions = {}) => {
  const [shown, setShown] = useState(defaultShown);
  const { onShow, onHide, onToggle } = options;

  const show = useCallback(() => {
    setShown(true);
    onShow?.();
    onToggle?.(true);
  }, [onShow, onToggle]);

  const hide = useCallback(() => {
    setShown(false);
    onHide?.();
    onToggle?.(false);
  }, [onHide, onToggle]);

  const toggle = useCallback(() => {
    setShown((prev) => {
      const next = !prev;
      next ? onShow?.() : onHide?.();
      onToggle?.(next);
      return next;
    });
  }, [onShow, onHide, onToggle]);

  return { shown, show, hide, toggle };
};

export type ShowControl = ReturnType<typeof useShow>;
