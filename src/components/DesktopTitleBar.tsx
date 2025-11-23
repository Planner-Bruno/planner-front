import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { desktopWindowControls, isDesktopApp } from '@/utils/platform';
import type { DesktopWindowState } from '@/types/desktop';

const dragRegionStyle: ViewStyle & { WebkitAppRegion?: 'drag' | 'no-drag' } =
  Platform.OS === 'web' ? { WebkitAppRegion: 'drag' } : {};
const noDragRegionStyle: ViewStyle & { WebkitAppRegion?: 'drag' | 'no-drag' } =
  Platform.OS === 'web' ? { WebkitAppRegion: 'no-drag' } : {};

const styles = StyleSheet.create({ 
  bar: {
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  barSpacer: {
    flex: 1
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  control: {
    width: 42,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  controlPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  closeControl: {
    backgroundColor: 'transparent'
  },
  closeControlPressed: {
    backgroundColor: 'rgba(244, 63, 94, 0.85)'
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0'
  },
  closeLabel: {
    color: '#FFE4E6'
  }
});

const DesktopControlButton = ({
  label,
  onPress,
  variant = 'default'
}: {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'close';
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.control,
      noDragRegionStyle,
      variant === 'close' && styles.closeControl,
      pressed && (variant === 'close' ? styles.closeControlPressed : styles.controlPressed)
    ]}
    hitSlop={4}
  >
    <Text style={[styles.controlLabel, variant === 'close' && styles.closeLabel]}>{label}</Text>
  </Pressable>
);

export const DesktopTitleBar = () => {
  const colors = useColors();
  const controls = desktopWindowControls();
  const [windowState, setWindowState] = useState<DesktopWindowState>('normal');
  const isDesktop = isDesktopApp();

  useEffect(() => {
    if (!isDesktop || !controls) return undefined;
    let mounted = true;

    const syncInitialState = async () => {
      try {
        const state = await controls.getState?.();
        if (mounted && state) {
          setWindowState(state);
        }
      } catch (error) {
        console.warn('Unable to determine window state', error);
      }
    };

    syncInitialState();
    const unsubscribe = controls.onStateChange?.((state) => setWindowState(state));
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [controls, isDesktop]);

  const titleColor = useMemo(() => colors.text, [colors.text]);

  const handleMinimize = () => controls?.minimize?.();
  const handleMaximize = () => controls?.maximize?.();
  const handleClose = () => controls?.close?.();

  if (!isDesktop || !controls) {
    return null;
  }

  return (
    <View style={[styles.bar, dragRegionStyle, { borderBottomColor: colors.border, backgroundColor: colors.mutedSurface }]}> 
      <Text style={[styles.title, { color: titleColor }]}>Planner</Text>
      <View style={styles.barSpacer} />
      <View style={styles.actions}>
        <DesktopControlButton label="_" onPress={handleMinimize} />
        <DesktopControlButton label={windowState === 'maximized' ? '[ ]' : '[]'} onPress={handleMaximize} />
        <DesktopControlButton label="x" onPress={handleClose} variant="close" />
      </View>
    </View>
  );
};
