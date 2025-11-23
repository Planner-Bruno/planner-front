import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Goal, PlannerCategory } from '@/types/planner';
import type { Task, TaskPriority } from '@/types/task';
import type { Palette } from '@/theme/colors';
import { priorityColors } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { DateField } from '@/components/DateField';
import { CategorySelector } from '@/components/CategorySelector';

interface TaskComposerPayload {
  title: string;
  description?: string;
  categoryName?: string;
  categoryId?: string | null;
  categoryColor?: string | null;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  goalId?: string | null;
}

interface ComposerProps {
  visible: boolean;
  initialTask?: Task | null;
  goals: Goal[];
  categories: PlannerCategory[];
  categoryUsage: Record<string, number>;
  onCreateCategory(name: string, color: string): boolean;
  onDeleteCategory(id: string): boolean;
  onClose(): void;
  onSubmit(payload: TaskComposerPayload, editingId?: Task['id']): void;
}

type FormState = {
  title: string;
  description: string;
  categoryName: string;
  categoryId: string | null;
  categoryColor?: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  goalId: string | null;
  tagsInput: string;
};

const buildDefaultForm = (category?: PlannerCategory): FormState => ({
  title: '',
  description: '',
  categoryName: category?.name ?? '',
  categoryId: category?.id ?? null,
  categoryColor: category?.color,
  priority: 'medium',
  startDate: '',
  dueDate: '',
  goalId: null,
  tagsInput: ''
});

export const TaskComposer = ({
  visible,
  onClose,
  onSubmit,
  initialTask,
  goals,
  categories,
  categoryUsage,
  onCreateCategory,
  onDeleteCategory
}: ComposerProps) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const defaultCategoryRef = useRef<PlannerCategory | undefined>(categories[0]);
  const [form, setForm] = useState<FormState>(() => buildDefaultForm(defaultCategoryRef.current));
  const isEditing = Boolean(initialTask);
  const selectedCategory = categories.find((category) => category.id === form.categoryId);

  useEffect(() => {
    defaultCategoryRef.current = categories[0];
  }, [categories]);

  useEffect(() => {
    if (!visible) {
      setForm(buildDefaultForm(defaultCategoryRef.current));
      return;
    }

    if (initialTask) {
      const normalized = initialTask.category?.toLowerCase?.() ?? '';
      const matchedCategory = initialTask.categoryId
        ? categories.find((category) => category.id === initialTask.categoryId)
        : categories.find((category) => category.name.toLowerCase() === normalized);
      setForm({
        title: initialTask.title,
        description: initialTask.description ?? '',
        categoryName: matchedCategory?.name ?? initialTask.category,
        categoryId: matchedCategory?.id ?? initialTask.categoryId ?? null,
        categoryColor: matchedCategory?.color ?? initialTask.categoryColor,
        priority: initialTask.priority,
        startDate: initialTask.startDate ? initialTask.startDate.slice(0, 10) : '',
        dueDate: initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : '',
        goalId: initialTask.goalId ?? null,
        tagsInput: initialTask.tags?.join(', ') ?? ''
      });
      return;
    }

    setForm(buildDefaultForm(defaultCategoryRef.current));
  }, [visible, initialTask]);

  useEffect(() => {
    if (!visible || isEditing || form.categoryId || !categories.length) return;
    setForm((prev) => ({
      ...prev,
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      categoryColor: categories[0].color
    }));
  }, [categories, visible, isEditing, form.categoryId]);

  const handleConfirm = () => {
    if (!form.title.trim()) return;
    const parsedDue = form.dueDate ? new Date(form.dueDate) : null;
    const dueDate = parsedDue && !Number.isNaN(parsedDue.getTime()) ? parsedDue.toISOString() : null;
    const parsedStart = form.startDate ? new Date(form.startDate) : null;
    const startDate = parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart.toISOString() : null;
    const activeCategory = selectedCategory || (form.categoryName ? { name: form.categoryName, color: form.categoryColor } : undefined);
    const categoryName = (activeCategory?.name ?? form.categoryName) || 'Sem categoria';
    const categoryColor = form.categoryColor ?? activeCategory?.color ?? null;
    const tags = form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const payload: TaskComposerPayload = {
      title: form.title,
      description: form.description,
      categoryName,
      categoryId: form.categoryId,
      categoryColor,
      priority: form.priority,
      startDate,
      dueDate,
      tags: tags.length ? tags : [],
      goalId: form.goalId
    };
    onSubmit(payload, initialTask?.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.sheetTitle}>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</Text>
              <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Descrição"
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              multiline
              numberOfLines={3}
            />

            <CategorySelector
              label="Categorias personalizadas"
              categories={categories}
              selectedId={form.categoryId}
              usageMap={categoryUsage}
              onSelect={(category) =>
                setForm((prev) => ({
                  ...prev,
                  categoryId: category.id,
                  categoryName: category.name,
                  categoryColor: category.color
                }))
              }
              onCreateCategory={onCreateCategory}
              onDeleteCategory={onDeleteCategory}
            />

            <Text style={styles.label}>Data de início</Text>
            <DateField
              placeholder="Data de início"
              value={form.startDate}
              mode="date"
              onChange={(startDate) => setForm((prev) => ({ ...prev, startDate }))}
            />

            <Text style={styles.label}>Prazo estimado</Text>
            <DateField
              placeholder="Selecionar prazo"
              value={form.dueDate}
              mode="date"
              onChange={(dueDate) => setForm((prev) => ({ ...prev, dueDate }))}
            />

            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="Tags (separe com vírgula)"
              placeholderTextColor={colors.textMuted}
              value={form.tagsInput}
              onChangeText={(tagsInput) => setForm((prev) => ({ ...prev, tagsInput }))}
            />

            <View>
              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                  <Pressable
                    key={priority}
                    style={[styles.priorityChip, form.priority === priority && styles.priorityChipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, priority }))}
                  >
                    <View style={[styles.dot, { backgroundColor: priorityColors[priority] }]} />
                    <Text style={styles.priorityLabel}>{priority.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {goals.length ? (
              <View>
                <Text style={styles.label}>Objetivo relacionado</Text>
                <View style={styles.goalRow}>
                  <Pressable
                    style={[styles.goalChip, form.goalId === null && styles.goalChipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, goalId: null }))}
                  >
                    <Text style={styles.goalChipLabel}>Sem objetivo</Text>
                  </Pressable>
                  {goals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      style={[styles.goalChip, form.goalId === goal.id && styles.goalChipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, goalId: goal.id }))}
                    >
                      <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                      <Text style={[styles.goalChipLabel, form.goalId === goal.id && styles.goalChipLabelActive]} numberOfLines={1}>
                        {goal.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={[styles.actionButton, styles.secondary]} onPress={onClose}>
                <Text style={styles.actionText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.primary]} onPress={handleConfirm}>
                <Text style={styles.actionText}>Salvar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 520,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden'
    },
    content: {
      padding: 24,
      gap: 16
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700'
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    closeLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700'
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600'
    },
    input: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top'
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 12
    },
    goalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    priorityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    priorityChipActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(124,92,255,0.15)'
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    priorityLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    goalChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: '100%'
    },
    goalChipActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(124,92,255,0.15)'
    },
    goalChipLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    goalChipLabelActive: {
      color: colors.primary
    },
    goalDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12
    },
    actionButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 16
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border
    },
    primary: {
      backgroundColor: colors.accent
    },
    actionText: {
      color: colors.text,
      fontWeight: '600'
    }
  });
