import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TaskFilter } from '@/types/task';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { useColors } from '@/theme/ThemeProvider';

interface Props {
  filter: TaskFilter;
  onChange(value: Partial<TaskFilter>): void;
}

const statusFilters = [
  { label: 'Todas', value: 'all' as const },
  { label: 'Backlog', value: 'backlog' as const },
  { label: 'Em progresso', value: 'in_progress' as const },
  { label: 'Concluídas', value: 'done' as const }
];

const rangeFilters = [
  { label: 'Qualquer data', value: 'all' as const },
  { label: 'Hoje', value: 'today' as const },
  { label: 'Próx. 7 dias', value: 'week' as const }
];

export const FilterBar = ({ filter, onChange }: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholder="Buscar tarefas"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={filter.query}
        onChangeText={(text) => onChange({ query: text })}
      />

      <View style={styles.chipRow}>
        {statusFilters.map((option) => (
          <Text
            key={option.value}
            style={[styles.chip, filter.status === option.value && styles.chipActive]}
            onPress={() => onChange({ status: option.value })}
          >
            {option.label}
          </Text>
        ))}
      </View>

      <View style={styles.chipRow}>
        {rangeFilters.map((option) => (
          <Text
            key={option.value}
            style={[styles.chip, filter.range === option.value && styles.chipActive]}
            onPress={() => onChange({ range: option.value })}
          >
            {option.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      gap: 12,
      marginBottom: 24
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 0,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textMuted,
      fontWeight: '600'
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.background
    }
  });
