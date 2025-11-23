import { StyleSheet, Text, View } from 'react-native';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: Props) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📋</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      paddingVertical: 48,
      alignItems: 'center',
      gap: 8
    },
    emoji: {
      fontSize: 42
    },
    title: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '700'
    },
    description: {
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 260
    }
  });
