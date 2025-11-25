import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlannerInsightsOverview } from '@/services/insightsApi';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  overview: PlannerInsightsOverview | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const InsightMetric = ({ label, value, accent, styles }: { label: string; value: string; accent: string; styles: ReturnType<typeof createStyles> }) => (
  <View style={[styles.metricCard, { borderColor: accent }]}
  >
    <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export const InsightsPanel = ({ overview, loading, error, onRefresh }: Props) => {
  const palette = useColors();
  const styles = useThemedStyles(createStyles);

  if (loading && !overview) {
    return (
      <View style={styles.feedbackWrapper}>
        <ActivityIndicator color={palette.accent} />
        <Text style={styles.feedbackText}>Calculando seus insights...</Text>
      </View>
    );
  }

  if (error && !overview) {
    return (
      <View style={styles.feedbackWrapper}>
        <Text style={styles.feedbackText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!overview) {
    return (
      <View style={styles.feedbackWrapper}>
        <Text style={styles.feedbackText}>Crie tarefas, metas e eventos para ver os painéis.</Text>
      </View>
    );
  }

  const completionRate = overview.tasks.total ? Math.round((overview.tasks.done / overview.tasks.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.metricGrid}>
        <InsightMetric label="Tarefas" value={`${overview.tasks.total}`} accent="#22d3ee" styles={styles} />
        <InsightMetric label="Metas" value={`${overview.goals.total}`} accent="#a855f7" styles={styles} />
        <InsightMetric label="Eventos" value={`${overview.events.total}`} accent="#f97316" styles={styles} />
        <InsightMetric label="Notas" value={`${overview.notes}`} accent="#10b981" styles={styles} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status das tarefas</Text>
        <View style={styles.statusRow}>
          <StatusBar label="Backlog" value={overview.tasks.backlog} total={overview.tasks.total} color="#f97316" styles={styles} />
          <StatusBar label="Em progresso" value={overview.tasks.in_progress} total={overview.tasks.total} color="#3b82f6" styles={styles} />
          <StatusBar label="Concluídas" value={overview.tasks.done} total={overview.tasks.total} color="#22c55e" styles={styles} />
        </View>
        <Text style={styles.secondaryText}>
          {overview.tasks.overdue} atrasadas · {overview.tasks.due_today} para hoje · {completionRate}% concluídas
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metas</Text>
        <Text style={styles.highlightText}>
          {overview.goals.completed}/{overview.goals.total} concluídas · {overview.goals.active} em andamento
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agenda</Text>
        <Text style={styles.highlightText}>
          {overview.events.today} hoje · {overview.events.upcoming_7d} próximos 7 dias
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.secondaryText}>{loading ? 'Atualizando...' : 'Atualizado automaticamente com base nos seus dados.'}</Text>
        <Pressable style={styles.secondaryButton} onPress={onRefresh}>
          <Text style={styles.secondaryButtonLabel}>Atualizar</Text>
        </Pressable>
      </View>
    </View>
  );
};

const StatusBar = ({ label, value, total, color, styles }: { label: string; value: number; total: number; color: string; styles: ReturnType<typeof createStyles> }) => {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.statusBarWrapper}>
      <View style={styles.statusBarHeader}>
        <Text style={styles.statusBarLabel}>{label}</Text>
        <Text style={styles.statusBarLabel}>{value}</Text>
      </View>
      <View style={styles.statusTrack}>
        <View style={[styles.statusFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 18
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    metricCard: {
      flexBasis: '48%',
      flexGrow: 1,
      borderWidth: 1,
      borderRadius: 20,
      padding: 16
    },
    metricValue: {
      fontSize: 26,
      fontWeight: '700'
    },
    metricLabel: {
      color: colors.textMuted,
      marginTop: 4
    },
    section: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text
    },
    statusRow: {
      flexDirection: 'column',
      gap: 12
    },
    statusBarWrapper: {
      flex: 1
    },
    statusBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4
    },
    statusBarLabel: {
      color: colors.textMuted,
      fontSize: 12
    },
    statusTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.border
    },
    statusFill: {
      height: 6,
      borderRadius: 999
    },
    highlightText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500'
    },
    secondaryText: {
      color: colors.textMuted,
      fontSize: 13
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8
    },
    secondaryButtonLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    feedbackWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      gap: 12
    },
    feedbackText: {
      color: colors.text,
      textAlign: 'center'
    },
    retryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10
    },
    retryLabel: {
      color: colors.text,
      fontWeight: '600'
    }
  });
