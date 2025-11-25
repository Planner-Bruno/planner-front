import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { isDesktopApp } from '@/utils/platform';
import { DesktopTitleBar } from '@/components/DesktopTitleBar';

export const DesktopShell = ({ children }: PropsWithChildren) => {
  const colors = useColors();
  const desktop = isDesktopApp();

  if (!desktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.desktopRoot}>
      <View style={[styles.window, { backgroundColor: colors.background, borderColor: colors.border }]}> 
        <DesktopTitleBar />
        <View style={styles.windowContent}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    backgroundColor: '#01030F',
    padding: 24
  },
  window: {
    flex: 1,
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 32px 48px rgba(0, 0, 0, 0.35)'
      },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.45,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 }
      }
    })
  },
  windowContent: {
    flex: 1
  }
});
