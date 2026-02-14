import { useLocalStorage } from './use-local-storage';

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

export const useSidebarState = () => {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    SIDEBAR_STORAGE_KEY,
    false,
  );

  const toggle = () => {
    setCollapsed((open) => !open);
  };

  const open = () => {
    setCollapsed(true);
  };

  const close = () => {
    setCollapsed(false);
  };

  return { collapsed, toggle, open, close, SIDEBAR_STORAGE_KEY };
};
