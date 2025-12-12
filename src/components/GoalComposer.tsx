import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Goal, PlannerCategory } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { DateField } from '@/components/DateField';
import { CategorySelector } from '@/components/CategorySelector';

interface GoalPayload {
  title: string;
  description: string;
  categoryName: string;
  categoryId?: string | null;
  categoryColor?: string | null;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  color: string;
}

interface Props {
  visible: boolean;
  initialGoal?: Goal | null;
  categories: PlannerCategory[];
  categoryUsage: Record<string, number>;
  onCreateCategory(name: string, color: string): boolean;
  onDeleteCategory(id: string): boolean;
  onClose(): void;
  onSubmit(payload: GoalPayload, editingId?: Goal['id']): void;
}

type FormState = {
  title: string;
  description: string;
  categoryName: string;
  categoryId: string | null;
  categoryColor?: string;
  startDate: string;
  dueDate: string;
  color: string;
  tagsInput: string;
};

const buildDefaultForm = (category?: PlannerCategory): FormState => ({
  title: '',
  description: '',
  categoryName: category?.name ?? '',
  categoryId: category?.id ?? null,
  categoryColor: category?.color,
  startDate: '',
  dueDate: '',
  color: '#F472B6',
  tagsInput: ''
});
const colorOptions = ['#F472B6', '#FB7185', '#A855F7', '#34D399', '#F97316', '#0EA5E9'];

export const GoalComposer = ({
  visible,
  onClose,
  onSubmit,
  initialGoal,
  categories,
  categoryUsage,
  onCreateCategory,
  onDeleteCategory
}: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const defaultCategoryRef = useRef<PlannerCategory | undefined>(categories[0]);
  const [form, setForm] = useState<FormState>(() => buildDefaultForm(defaultCategoryRef.current));
  const isEditing = Boolean(initialGoal);
  const selectedCategory = categories.find((category) => category.id === form.categoryId);

  useEffect(() => {
    defaultCategoryRef.current = categories[0];
  }, [categories]);

  useEffect(() => {
    if (!visible) {
      setForm(buildDefaultForm(defaultCategoryRef.current));
      return;
    }

    if (initialGoal) {
      const normalized = initialGoal.category?.toLowerCase?.() ?? '';
      const matchedCategory = initialGoal.categoryId
        ? categories.find((category) => category.id === initialGoal.categoryId)
        : categories.find((category) => category.name.toLowerCase() === normalized);
      setForm({
        title: initialGoal.title,
        description: initialGoal.description,
        categoryName: matchedCategory?.name ?? initialGoal.category,
        categoryId: matchedCategory?.id ?? initialGoal.categoryId ?? null,
        categoryColor: matchedCategory?.color ?? initialGoal.categoryColor,
        startDate: initialGoal.startDate ? initialGoal.startDate.slice(0, 10) : '',
        dueDate: initialGoal.dueDate ? initialGoal.dueDate.slice(0, 10) : '',
        color: initialGoal.color,
        tagsInput: initialGoal.tags?.join(', ') ?? ''
      });
      return;
    }

    setForm(buildDefaultForm(defaultCategoryRef.current));
  }, [visible, initialGoal]);

  useEffect(() => {
    if (!visible || isEditing || form.categoryId || !categories.length) return;
    setForm((prev) => ({
      ...prev,
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      categoryColor: categories[0].color
    }));
  }, [categories, visible, isEditing, form.categoryId]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    const tags = form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const activeCategory = selectedCategory || (form.categoryName ? { name: form.categoryName, color: form.categoryColor } : undefined);
    const categoryName = (activeCategory?.name ?? form.categoryName) || 'Sem categoria';
    const categoryColor = form.categoryColor ?? activeCategory?.color ?? null;
    onSubmit(
      {
        title: form.title,
        description: form.description,
        categoryName,
        categoryId: form.categoryId,
        categoryColor,
        startDate: form.startDate,
        dueDate: form.dueDate,
        color: form.color,
        tags: tags.length ? tags : []
      },
      initialGoal?.id
    );
    onClose();
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar meta' : 'Nova meta'}</Text>
              <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(text) => setField('title', text)}
            />
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Descrição"
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={(text) => setField('description', text)}
              multiline
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
            <Text style={styles.fieldLabel}>Data de início</Text>
            <DateField
              placeholder="Data de início"
              value={form.startDate}
              mode="date"
              onChange={(dateValue) => setField('startDate', dateValue)}
            />
            <Text style={styles.fieldLabel}>Data alvo</Text>
            <DateField
              placeholder="Data alvo"
              value={form.dueDate}
              mode="date"
              onChange={(dateValue) => setField('dueDate', dateValue)}
            />
            <View>
              <Text style={styles.sectionLabel}>Cor destaque</Text>
              <View style={styles.swatchRow}>
                {colorOptions.map((hex) => (
                  <Pressable
                    key={hex}
                    style={[styles.swatch, { backgroundColor: hex }, form.color === hex && styles.swatchSelected]}
                    onPress={() => setField('color', hex)}
                  >
                    {form.color === hex ? <View style={styles.swatchIndicator} /> : null}
                  </Pressable>
                ))}
              </View>
            </View>
            <Text style={styles.fieldLabel}>Cor personalizada</Text>
            <TextInput
              style={styles.input}
              placeholder="Cor (#HEX)"
              placeholderTextColor={colors.textMuted}
              value={form.color}
              onChangeText={(text) => setField('color', text)}
            />
            <Text style={styles.fieldLabel}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="Tags (separe com vírgula)"
              placeholderTextColor={colors.textMuted}
              value={form.tagsInput}
              onChangeText={(text) => setField('tagsInput', text)}
            />
            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.secondary]} onPress={onClose}>
                <Text style={styles.buttonLabel}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.primary]} onPress={handleSave}>
                <Text style={styles.buttonLabel}>{isEditing ? 'Salvar' : 'Criar'}</Text>
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
      borderRadius: 32,
      width: '100%',
      maxWidth: 520,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '90%',
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
    title: {
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
    fieldLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginTop: 8,
      marginBottom: 4
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text
    },
    multiline: {
      height: 90,
      textAlignVertical: 'top'
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12
    },
    button: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center'
    },
    primary: {
      backgroundColor: colors.accent
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border
    },
    buttonLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
      textTransform: 'uppercase'
    },
    swatchRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12
    },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center'
    },
    swatchSelected: {
      borderColor: colors.text
    },
    swatchIndicator: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: 'rgba(255,255,255,0.85)'
    }
  });
