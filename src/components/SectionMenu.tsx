import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlannerSection } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';

const labels: Record<PlannerSection, string> = {
  tasks: 'Tarefas',
  goals: 'Objetivos',
  calendar: 'Agenda',
  insights: 'Dashboard',
  notes: 'Notas'
};

const sectionOrder: PlannerSection[] = ['goals', 'tasks', 'calendar', 'insights', 'notes'];

interface Props {
  value: PlannerSection;
  onChange(section: PlannerSection): void;
}

export const SectionMenu = ({ value, onChange }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.menu}>
      {sectionOrder.map((section) => {
        const active = value === section;
        return (
          <Pressable key={section} style={[styles.item, active && styles.itemActive]} onPress={() => onChange(section)}>
            <View style={[styles.bullet, active && styles.bulletActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{labels[section]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    menu: {
      gap: 6
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 10,
      backgroundColor: 'transparent'
    },
    itemActive: {
      backgroundColor: colors.surface
    },
    bullet: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.border
    },
    bulletActive: {
      backgroundColor: colors.accent
    },
    label: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600'
    },
    labelActive: {
      color: colors.text
    }
  });
