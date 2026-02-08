import { useState } from 'react';
import { useShow } from './useShow';
export type ModalClose = (
  // Boolean added just because we call close on onOpenChangeEvent for Modal component
  arg?: boolean | (Partial<React.MouseEvent> & { takeConfirmation?: boolean }),
) => void;

export const useModal = (defaultValue: boolean = false) => {
  const {
    shown: isOpen,
    show: open,
    hide: close,
    toggle,
  } = useShow(defaultValue);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return {
    isOpen,
    showConfirmation,
    open,

    dismissConfirmation: () => {
      setShowConfirmation(false);
    },

    close: ((option) => {
      if (typeof option === 'object' && option?.takeConfirmation) {
        return setShowConfirmation(true);
      }

      setShowConfirmation(false);
      close();
    }) as ModalClose,

    toggle: ((option) => {
      if (!isOpen && typeof option === 'object' && option?.takeConfirmation) {
        return setShowConfirmation(true);
      }

      toggle();
    }) as ModalClose,
  };
};

export type ModalControl = ReturnType<typeof useModal>;
