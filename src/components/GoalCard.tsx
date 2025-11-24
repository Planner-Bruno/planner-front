import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Goal, PlannerNote, ScheduleEvent } from '@/types/planner';
import type { Task } from '@/types/task';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';

interface Props {
  goal: Goal;
  tasks?: Task[];
  events?: ScheduleEvent[];
  notes?: PlannerNote[];
  onEdit?(goal: Goal): void;
  onDelete?(goal: Goal): void;
}

const statusLabel: Record<Task['status'], string> = {
  backlog: 'planejada',
  in_progress: 'em progresso',
  done: 'concluída'
};

export const GoalCard = ({ goal, tasks = [], events = [], notes = [], onEdit, onDelete }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const hasTasks = tasks.length > 0;
  const previewTasks = tasks.slice(0, 3);
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );
  const upcomingEvents = sortedEvents.slice(0, 2);
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [notes]
  );
  const notePreview = sortedNotes.slice(0, 2);
  const hasAgenda = upcomingEvents.length > 0;
  const hasNotes = notePreview.length > 0;
  const hasMilestones = goal.milestones.length > 0;
  const startLabel = goal.startDate ? format(new Date(goal.startDate), "dd MMM", { locale: ptBR }) : null;
  const dueLabel = goal.dueDate ? format(new Date(goal.dueDate), "dd MMM", { locale: ptBR }) : null;
  const progressPercentage = Math.round(goal.progress * 100);

  const formatEventLabel = (event: ScheduleEvent) => {
    const dateLabel = format(new Date(event.date), "dd MMMM", { locale: ptBR });
    const timeLabel = event.start ? ` · ${event.start}` : '';
    return `${dateLabel}${timeLabel} · ${event.title}`;
  };

  const sectionData = [
    {
      key: 'milestones',
      title: 'Milestones',
      content: hasMilestones ? (
        goal.milestones.slice(0, 2).map((milestone) => (
          <View key={milestone.id} style={styles.milestoneRow}>
            <View style={[styles.dot, milestone.completed && styles.dotDone]} />
            <View style={styles.milestoneBody}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <View style={styles.milestoneTrack}>
                <View style={[styles.milestoneFill, { width: `${milestone.progress * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.milestonePercent}>{Math.round(milestone.progress * 100)}%</Text>
          </View>
        ))
      ) : (
        <Text style={styles.taskPlaceholder}>Adicione marcos para acompanhar entregas chave.</Text>
      )
    },
    {
      key: 'tasks',
      title: 'Tarefas vinculadas',
      content: hasTasks ? (
        previewTasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={[styles.taskIndicator, task.status === 'done' && styles.taskIndicatorDone]} />
            <Text style={[styles.taskTitle, task.status === 'done' && styles.taskTitleDone]} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.taskStatus}>{statusLabel[task.status]}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.taskPlaceholder}>Adicione tarefas para acompanhar o avanço deste objetivo.</Text>
      )
    },
    {
      key: 'agenda',
      title: 'Agenda vinculada',
      content: hasAgenda ? (
        upcomingEvents.map((event) => (
          <View key={event.id} style={styles.agendaRow}>
            <View style={[styles.goalDot, { backgroundColor: event.color }]} />
            <Text style={styles.agendaTitle} numberOfLines={2}>
              {formatEventLabel(event)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.taskPlaceholder}>Vincule eventos ou lembretes para trazer o próximo passo aqui.</Text>
      )
    },
    {
      key: 'notes',
      title: 'Notas relacionadas',
      content: hasNotes ? (
        notePreview.map((note) => (
          <View key={note.id} style={styles.noteRow}>
            <View style={[styles.noteBadge, { backgroundColor: note.color }]} />
            <View style={styles.noteBody}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {note.title}
              </Text>
              <Text style={styles.noteSnippet} numberOfLines={1}>
                {note.content}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.taskPlaceholder}>Conecte notas para manter os insights acessíveis.</Text>
      )
    }
  ];

  const progressBubble = (
    <View style={[styles.progressBubble, isCompact && styles.progressBubbleCompact]}>
      <Text style={styles.progressValue}>{progressPercentage}%</Text>
      <Text style={styles.progressLabel}>progresso</Text>
    </View>
  );

  return (
    <View style={[styles.card, { borderColor: goal.color }]}>
      <View style={styles.header}>
        <View style={[styles.headerPrimary, isCompact && styles.headerPrimaryCompact]}>
          <View style={styles.headerText}>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: goal.categoryColor ?? colors.textMuted }]} />
              <Text style={styles.category}>{goal.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{goal.title}</Text>
          </View>
          {isCompact ? progressBubble : null}
        </View>
        <View style={[styles.actions, isCompact && styles.actionsStacked]}>
          {!isCompact ? progressBubble : null}
          <View style={[styles.actionRow, isCompact && styles.actionRowStacked]}>
            {onEdit ? (
              <Pressable style={styles.editChip} onPress={() => onEdit(goal)}>
                <Text style={styles.editLabel}>Editar</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable style={[styles.editChip, styles.deleteChip]} onPress={() => onDelete(goal)}>
                <Text style={[styles.editLabel, styles.deleteLabel]}>Excluir</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      <Text style={styles.description}>{goal.description}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Progresso</Text>
          <Text style={styles.progressPercentLabel}>{progressPercentage}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progressPercentage}%`, backgroundColor: goal.color }]} />
        </View>
        {hasTasks ? (
          <Text style={styles.taskSummary}>
            {completedTasks}/{tasks.length} tarefas vinculadas
          </Text>
        ) : null}
      </View>
      {startLabel || dueLabel ? (
        <View style={styles.timelineRow}>
          <View style={styles.timelineBlock}>
            <Text style={styles.timelineEyebrow}>Início</Text>
            <Text style={styles.timelineValue}>{startLabel ?? '—'}</Text>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineBlock}>
            <Text style={styles.timelineEyebrow}>Previsão</Text>
            <Text style={styles.timelineValue}>{dueLabel ?? '—'}</Text>
          </View>
        </View>
      ) : null}
      {goal.tags?.length ? (
        <View style={styles.tagRow}>
          {goal.tags.map((tag, index) => (
            <View key={`${goal.id}-${tag}-${index}`} style={styles.tagChip}>
              <Text style={styles.tagLabel}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.sectionStack}>
        {sectionData.map((section) => (
          <View key={section.key} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
            </View>
            {section.content}
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12
    },
    headerPrimary: {
      flexShrink: 1,
      flexGrow: 1,
      gap: 8
    },
    headerPrimaryCompact: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    headerText: {
      flexShrink: 1,
      minWidth: 220,
      gap: 4
    },
    actions: {
      alignItems: 'flex-end',
      gap: 8,
      flexShrink: 1,
      minWidth: 160
    },
    actionsStacked: {
      width: '100%',
      alignSelf: 'stretch'
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4
    },
    actionRowStacked: {
      width: '100%',
      justifyContent: 'flex-end'
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },
    category: {
      color: colors.textMuted,
      letterSpacing: 1,
      fontSize: 11
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      flexShrink: 1
    },
    description: {
      color: colors.textMuted,
      fontSize: 14,
      flexShrink: 1,
      lineHeight: 20
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16
    },
    timelineBlock: {
      flex: 1,
      gap: 4,
      minWidth: 120
    },
    timelineEyebrow: {
      color: colors.textMuted,
      fontSize: 11,
      textTransform: 'uppercase'
    },
    timelineValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600'
    },
    timelineDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    tagChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface
    },
    tagLabel: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600'
    },
    progressContainer: {
      gap: 6
    },
    progressHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    progressTitle: {
      color: colors.textMuted,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6
    },
    progressPercentLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700'
    },
    progressBubble: {
      backgroundColor: colors.mutedSurface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'flex-end',
      alignSelf: 'flex-end'
    },
    progressBubbleCompact: {
      marginLeft: 12
    },
    progressValue: {
      color: colors.text,
      fontWeight: '700'
    },
    progressLabel: {
      color: colors.textMuted,
      fontSize: 11
    },
    editChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6
    },
    editLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    deleteChip: {
      borderColor: colors.danger
    },
    deleteLabel: {
      color: colors.danger
    },
    barTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface
    },
    barFill: {
      height: 8,
      borderRadius: 999
    },
    taskSummary: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600'
    },
    sectionStack: {
      flexDirection: 'column',
      gap: 12,
      width: '100%'
    },
    sectionCard: {
      width: '100%',
      backgroundColor: colors.mutedSurface,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    milestoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
    },
    milestoneBody: {
      flex: 1
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border
    },
    dotDone: {
      backgroundColor: colors.success
    },
    milestoneTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '500'
    },
    milestoneTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface,
      marginTop: 4
    },
    milestoneFill: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.primaryMuted
    },
    milestonePercent: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border
    },
    taskIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border
    },
    taskIndicatorDone: {
      backgroundColor: colors.success
    },
    goalDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    taskTitle: {
      flex: 1,
      color: colors.text,
      fontWeight: '600'
    },
    taskTitleDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted
    },
    taskStatus: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase'
    },
    taskPlaceholder: {
      color: colors.textMuted,
      fontStyle: 'italic'
    },
    agendaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 4
    },
    agendaTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 13
    },
    noteRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
      paddingVertical: 6
    },
    noteBadge: {
      width: 12,
      height: 12,
      borderRadius: 6
    },
    noteBody: {
      flex: 1
    },
    noteTitle: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 13
    },
    noteSnippet: {
      color: colors.textMuted,
      fontSize: 12
    }
  });
