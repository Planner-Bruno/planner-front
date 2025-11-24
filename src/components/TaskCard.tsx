import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import type { Task } from '@/types/task';
import { isOverdue } from '@/utils/taskUtils';
import type { Palette } from '@/theme/colors';
import { priorityColors } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  task: Task;
  onToggle(): void;
  onAdvance(): void;
  onEdit?(): void;
  onDelete?(): void;
  onPress?(): void;
  onToggleSubtask?(subtaskId: string): void;
  onAddSubtask?(title: string): void;
  onRemoveSubtask?(subtaskId: string): void;
  style?: StyleProp<ViewStyle>;
  goalMeta?: {
    title: string;
    color: string;
  };
}

const statusLabel: Record<Task['status'], string> = {
  backlog: 'Planejada',
  in_progress: 'Em progresso',
  done: 'Concluída'
};

const TaskCardComponent = ({
  task,
  onToggle,
  onAdvance,
  onEdit,
  onDelete,
  onPress,
  goalMeta,
  style,
  onToggleSubtask,
  onAddSubtask,
  onRemoveSubtask
}: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const overdue = isOverdue(task);
  const startLabel = task.startDate ? format(new Date(task.startDate), "dd MMM", { locale: ptBR }) : null;
  const dueLabel = task.dueDate ? format(new Date(task.dueDate), "dd MMM", { locale: ptBR }) : null;
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const totalSubtasks = task.subtasks?.length ?? 0;
  const hasSubtasks = Boolean(totalSubtasks);
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.completed).length ?? 0;
  const progressPercent = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const canAddSubtask = Boolean(subtaskDraft.trim());

  useEffect(() => {
    setSubtaskDraft('');
  }, [task.id]);

  const handleAddSubtask = () => {
    if (!onAddSubtask || !canAddSubtask) return;
    onAddSubtask(subtaskDraft.trim());
    setSubtaskDraft('');
  };

  return (
    <Pressable style={({ pressed }) => [styles.card, style, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{task.title}</Text>
            <View style={[styles.badge, overdue ? styles.badgeDanger : styles.badgeMuted]}>
              <Text style={styles.badgeText}>{statusLabel[task.status]}</Text>
            </View>
          </View>
          {task.description ? <Text style={styles.description}>{task.description}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          {onEdit ? (
            <Pressable style={styles.chip} onPress={onEdit}>
              <Text style={styles.chipLabel}>Editar</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable style={[styles.chip, styles.deleteChip]} onPress={onDelete}>
              <Text style={[styles.chipLabel, styles.deleteLabel]}>Excluir</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {hasSubtasks ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso das subtarefas</Text>
            <Text style={styles.progressValue}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <View style={[styles.dot, { backgroundColor: priorityColors[task.priority] }]} />
          <Text style={styles.metaLabel}>{task.priority.toUpperCase()}</Text>
        </View>
        <View style={styles.metaPill}>
          <View style={[styles.dot, { backgroundColor: task.categoryColor ?? colors.border }]} />
          <Text style={styles.metaLabel}>{task.category}</Text>
        </View>
        {goalMeta ? (
          <View style={[styles.metaPill, styles.goalPill, { borderColor: goalMeta.color }]}>
            <View style={[styles.goalBadgeDot, { backgroundColor: goalMeta.color }]} />
            <Text style={styles.metaLabel} numberOfLines={1}>
              {goalMeta.title}
            </Text>
          </View>
        ) : null}
      </View>

      {startLabel || dueLabel ? (
        <View style={styles.timelineRow}>
          {startLabel ? <Text style={styles.timelineLabel}>Início · {startLabel}</Text> : <Text style={styles.timelineLabel}>Início · —</Text>}
          <View style={styles.timelineDivider} />
          {dueLabel ? (
            <Text style={[styles.timelineLabel, overdue && styles.dangerText]}>Previsão · {dueLabel}</Text>
          ) : (
            <Text style={[styles.timelineLabel, overdue && styles.dangerText]}>Previsão · —</Text>
          )}
        </View>
      ) : null}

      {task.tags?.length ? (
        <View style={styles.tagRow}>
          {task.tags.map((tag, index) => (
            <View key={`${task.id}-${tag}-${index}`} style={styles.tagChip}>
              <Text style={styles.tagLabel}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {(hasSubtasks || onAddSubtask) ? (
        <View style={styles.subtaskSection}>
          {hasSubtasks ? (
            <View style={styles.subtaskList}>
              {task.subtasks.map((subtask) => (
                <View key={subtask.id} style={styles.subtaskItem}>
                  <Pressable
                    style={[styles.subtaskCheckbox, subtask.completed && styles.subtaskCheckboxChecked]}
                    onPress={() => onToggleSubtask?.(subtask.id)}
                  >
                    {subtask.completed ? <View style={styles.subtaskCheckboxIndicator} /> : null}
                  </Pressable>
                  <Text style={[styles.subtaskLabel, subtask.completed && styles.subtaskCompleted]} numberOfLines={2}>
                    {subtask.title}
                  </Text>
                  {onRemoveSubtask ? (
                    <Pressable style={styles.subtaskRemove} onPress={() => onRemoveSubtask(subtask.id)}>
                      <Text style={styles.subtaskRemoveLabel}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helperText}>Nenhuma subtarefa cadastrada ainda.</Text>
          )}

          {onAddSubtask ? (
            <View style={styles.subtaskInputRow}>
              <TextInput
                style={styles.subtaskInput}
                placeholder="Adicionar subtarefa"
                placeholderTextColor={colors.textMuted}
                value={subtaskDraft}
                onChangeText={setSubtaskDraft}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.subtaskAddButton, !canAddSubtask && styles.subtaskAddButtonDisabled]}
                onPress={handleAddSubtask}
                disabled={!canAddSubtask}
              >
                <Text style={styles.subtaskAddLabel}>Adicionar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={onAdvance}>
          <Text style={styles.actionText}>Próxima etapa</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={onToggle}>
          <Text style={styles.primaryText}>{task.status === 'done' ? 'Reabrir' : 'Concluir'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
      width: '100%'
    },
    pressed: {
      opacity: 0.85
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12
    },
    headerContent: {
      flex: 1,
      gap: 6
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexShrink: 0
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      flexShrink: 1
    },
    description: {
      color: colors.textMuted,
      marginTop: 4,
      fontSize: 14,
      flexShrink: 1
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'flex-start'
    },
    badgeMuted: {
      backgroundColor: colors.mutedSurface
    },
    badgeDanger: {
      backgroundColor: 'rgba(251,113,133,0.15)',
      borderColor: colors.danger
    },
    badgeText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 4
    },
    deleteChip: {
      borderColor: colors.danger
    },
    chipLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    deleteLabel: {
      color: colors.danger
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface,
      flexShrink: 1
    },
    goalPill: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    goalBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    metaLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '500',
      flexShrink: 1
    },
    dangerText: {
      color: colors.danger
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    },
    timelineDivider: {
      width: 1,
      height: 16,
      backgroundColor: colors.border
    },
    timelineLabel: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600'
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
    progressSection: {
      gap: 6
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    progressLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600'
    },
    progressValue: {
      color: colors.text,
      fontWeight: '700'
    },
    progressBar: {
      width: '100%',
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.primary
    },
    subtaskSection: {
      gap: 8
    },
    subtaskList: {
      gap: 8
    },
    subtaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8
    },
    subtaskCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    subtaskCheckboxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary
    },
    subtaskCheckboxIndicator: {
      width: 10,
      height: 10,
      borderRadius: 3,
      backgroundColor: colors.background
    },
    subtaskLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600'
    },
    subtaskCompleted: {
      color: colors.textMuted,
      textDecorationLine: 'line-through'
    },
    subtaskRemove: {
      paddingHorizontal: 4,
      paddingVertical: 2
    },
    subtaskRemoveLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700'
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 12
    },
    subtaskInputRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center'
    },
    subtaskInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text
    },
    subtaskAddButton: {
      borderRadius: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    subtaskAddButtonDisabled: {
      opacity: 0.6
    },
    subtaskAddLabel: {
      color: colors.background,
      fontWeight: '700'
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    actionButton: {
      flex: 1,
      minWidth: 120,
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: 'center'
    },
    secondaryAction: {
      borderWidth: 1,
      borderColor: colors.border
    },
    primaryAction: {
      backgroundColor: colors.primary
    },
    actionText: {
      color: colors.text,
      fontWeight: '600'
    },
    primaryText: {
      color: colors.background,
      fontWeight: '600'
    }
  });

export const TaskCard = memo(TaskCardComponent);
