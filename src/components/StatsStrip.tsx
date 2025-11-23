import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { TaskInsights } from '@/types/task';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  insights: TaskInsights;
}

const StatBox = ({ label, value, compact, styles }: { label: string; value: number; compact: boolean; styles: ReturnType<typeof createStyles> }) => (
  <View style={[styles.statBox, compact && styles.statBoxCompact]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const StatsStrip = ({ insights }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  return (
    <View style={[styles.wrapper, isCompact && styles.wrapperCompact]}>
      <StatBox label="Ativas" value={insights.active} compact={isCompact} styles={styles} />
      <StatBox label="Concluídas" value={insights.completed} compact={isCompact} styles={styles} />
      <StatBox label="Total" value={insights.total} compact={isCompact} styles={styles} />
      <StatBox label="Atrasadas" value={insights.overdue} compact={isCompact} styles={styles} />
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 24
    },
    wrapperCompact: {
      flexWrap: 'wrap'
    },
    statBox: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    statBoxCompact: {
      flexBasis: '48%',
      minWidth: '48%'
    },
    statValue: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700'
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4
    }
  });

export default StatsStrip;
