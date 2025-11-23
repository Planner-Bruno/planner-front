import { useMemo } from 'react';
import type { Palette } from './colors';
import { useColors } from './ThemeProvider';

export const useThemedStyles = <T>(factory: (colors: Palette) => T): T => {
  const colors = useColors();
  return useMemo(() => factory(colors), [colors, factory]);
};
