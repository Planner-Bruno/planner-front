import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  label: string;
  onPress(): void;
}

export const FloatingButton = ({ label, onPress }: Props) => {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      right: 24,
      bottom: 36,
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 28,
      paddingVertical: 16,
      elevation: 6,
      ...Platform.select({
        web: {
          boxShadow: '0 14px 26px rgba(0, 0, 0, 0.25)'
        },
        default: {
          shadowColor: colors.accent,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 }
        }
      })
    },
    label: {
      color: colors.background,
      fontWeight: '700',
      fontSize: 16
    }
  });
