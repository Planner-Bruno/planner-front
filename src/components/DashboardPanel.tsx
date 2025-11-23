import { StyleSheet, Text, View } from 'react-native';
import type { PlannerInsights } from '@/types/planner';
import type { TaskInsights } from '@/types/task';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  plannerInsights: PlannerInsights;
  taskInsights: TaskInsights;
}

const InsightCard = ({ label, value, accent, styles }: { label: string; value: string; accent: string; styles: ReturnType<typeof createStyles> }) => (
  <View style={[styles.card, { borderColor: accent }]}> 
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

export const DashboardPanel = ({ plannerInsights, taskInsights }: Props) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.cardRow}>
        <InsightCard label="Objetivos ativos" value={`${plannerInsights.activeGoals}`} accent="#818cf8" styles={styles} />
        <InsightCard label="Tarefas concluídas" value={`${taskInsights.completed}`} accent="#22d3ee" styles={styles} />
        <InsightCard label="Horas focadas (semana)" value={`${plannerInsights.weeklyFocusHours}h`} accent="#f472b6" styles={styles} />
        <InsightCard label="Momentum de metas" value={`${Math.round(plannerInsights.goalMomentum * 100)}%`} accent="#34d399" styles={styles} />
      </View>
      <View style={styles.nextMilestone}>
        <Text style={styles.sectionTitle}>Próximo marco</Text>
        {plannerInsights.nextMilestone ? (
          <View>
            <Text style={styles.milestoneTitle}>{plannerInsights.nextMilestone.title}</Text>
            {plannerInsights.nextMilestone.dueDate ? (
              <Text style={styles.milestoneMeta}>
                deadline: {new Date(plannerInsights.nextMilestone.dueDate).toLocaleDateString('pt-BR')}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.milestoneMeta}>Sem milestones pendentes. Bora criar um novo desafio?</Text>
        )}
      </View>
      <View style={styles.goalOverview}>
        <Text style={styles.sectionTitle}>Panorama de objetivos</Text>
        {plannerInsights.goalHighlights.length ? (
          plannerInsights.goalHighlights.map((highlight) => (
            <View key={highlight.id} style={styles.goalRow}>
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleBlock}>
                  <View style={[styles.goalDot, { backgroundColor: highlight.color }]} />
                  <Text style={styles.goalName}>{highlight.title}</Text>
                </View>
                <Text style={styles.goalProgressLabel}>{Math.round(highlight.progress * 100)}%</Text>
              </View>
              <Text style={styles.goalMetaLine}>
                {highlight.completedTasks}/{highlight.totalTasks || 0} tarefas · {highlight.eventCount} agenda · {highlight.noteCount} notas
              </Text>
              {highlight.nextEventLabel ? (
                <Text style={styles.goalSecondary}>Próximo: {highlight.nextEventLabel}</Text>
              ) : null}
              {highlight.latestNoteTitle ? (
                <Text style={styles.goalSecondary}>Nota: {highlight.latestNoteTitle}</Text>
              ) : null}
              <View style={styles.goalBar}>
                <View
                  style={[styles.goalFill, { width: `${Math.round(highlight.progress * 100)}%`, backgroundColor: highlight.color }]}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.milestoneMeta}>Vincule tarefas aos objetivos para visualizar este panorama.</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    cardRow: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap'
    },
    card: {
      flex: 1,
      minWidth: 160,
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.mutedSurface
    },
    value: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700'
    },
    label: {
      color: colors.textMuted,
      marginTop: 6,
      fontSize: 13
    },
    nextMilestone: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8
    },
    milestoneTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600'
    },
    milestoneMeta: {
      color: colors.textMuted,
      marginTop: 4
    },
    goalOverview: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    goalRow: {
      gap: 6
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    },
    goalTitleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    goalDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    goalName: {
      color: colors.text,
      fontWeight: '600'
    },
    goalProgressLabel: {
      color: colors.text,
      fontWeight: '700'
    },
    goalMetaLine: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '500'
    },
    goalSecondary: {
      color: colors.textMuted,
      fontSize: 12
    },
    goalBar: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: 'hidden'
    },
    goalFill: {
      height: 6,
      borderRadius: 999
    }
  });
