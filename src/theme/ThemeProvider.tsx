import { Appearance } from 'react-native';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Palette, palettes, ThemeMode } from './colors';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Palette;
  toggleTheme(): void;
  setMode(next: ThemeMode): void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: palettes.dark,
  toggleTheme: () => undefined,
  setMode: () => undefined
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => (Appearance.getColorScheme() === 'light' ? 'light' : 'dark'));

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'light' || colorScheme === 'dark') {
        setMode(colorScheme);
      }
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: palettes[mode],
      toggleTheme: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setMode
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeContext);
export const useColors = () => useThemeMode().colors;
