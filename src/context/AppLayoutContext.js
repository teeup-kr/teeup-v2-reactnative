import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AppLayoutContext = createContext(null);

export function AppLayoutProvider({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      isMenuOpen,
      openMenu,
      closeMenu,
      toggleMenu,
    }),
    [isMenuOpen, openMenu, closeMenu, toggleMenu],
  );

  return <AppLayoutContext.Provider value={value}>{children}</AppLayoutContext.Provider>;
}

export const useAppLayout = () => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayout must be used within an AppLayoutProvider.');
  }
  return context;
};
