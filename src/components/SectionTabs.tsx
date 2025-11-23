import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlannerSection } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';

const labels: Record<PlannerSection, string> = {
  tasks: 'Tarefas',
  goals: 'Objetivos',
  calendar: 'Calendário',
  insights: 'Dashboard',
  notes: 'Notas'
};

const sectionOrder: PlannerSection[] = ['goals', 'tasks', 'calendar', 'insights', 'notes'];
interface Props {
  value: PlannerSection;
  onChange(section: PlannerSection): void;
}

export const SectionTabs = ({ value, onChange }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {sectionOrder.map((section) => (
        <Pressable key={section} style={[styles.tab, value === section && styles.tabActive]} onPress={() => onChange(section)}>
          <Text style={[styles.label, value === section && styles.labelActive]} numberOfLines={1}>
            {labels[section]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface,
      padding: 4,
      marginBottom: 24
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 999,
      alignItems: 'center'
    },
    tabActive: {
      backgroundColor: colors.primary
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      flexShrink: 1
    },
    labelActive: {
      color: colors.text,
      fontSize: 14
    }
  });
