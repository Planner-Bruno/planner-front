import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Goal, PlannerNote } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface NotePayload {
  title: string;
  content: string;
  color?: string;
  tags?: string[];
  goalId?: string | null;
}

interface Props {
  visible: boolean;
  initialNote?: PlannerNote | null;
  goals: Goal[];
  onClose(): void;
  onSubmit(payload: NotePayload, editingId?: PlannerNote['id']): void;
}

const colorOptions = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#A5B4FC', '#86EFAC', '#FCA5A5'];

type FormState = {
  title: string;
  content: string;
  color: string;
  tagsInput: string;
  goalId: string | null;
};

const defaultState: FormState = {
  title: '',
  content: '',
  color: '#FDE68A',
  tagsInput: '',
  goalId: null
};

export const NoteComposer = ({ visible, onClose, onSubmit, initialNote, goals }: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState<FormState>(defaultState);
  const isEditing = Boolean(initialNote);

  useEffect(() => {
    if (visible && initialNote) {
      setForm({
        title: initialNote.title,
        content: initialNote.content,
        color: initialNote.color,
        tagsInput: initialNote.tags?.join(', ') ?? '',
        goalId: initialNote.goalId ?? null
      });
    } else if (!visible) {
      setForm(defaultState);
    }
  }, [visible, initialNote]);

  const handleSave = () => {
    if (!form.content.trim()) return;
    const tags = form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onSubmit(
      {
        title: form.title,
        content: form.content,
        color: form.color,
        tags: tags.length ? tags : undefined,
        goalId: form.goalId
      },
      initialNote?.id
    );
    onClose();
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar anotação' : 'Nova anotação'}</Text>
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
            <Text style={styles.fieldLabel}>Conteúdo</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Conteúdo"
              placeholderTextColor={colors.textMuted}
              value={form.content}
              onChangeText={(text) => setField('content', text)}
              multiline
            />
            <View>
              <Text style={styles.sectionLabel}>Cor da nota</Text>
              <View style={styles.swatchRow}>
                {colorOptions.map((hex) => (
                  <Pressable
                    key={hex}
                    style={[styles.colorSwatch, { backgroundColor: hex }, form.color === hex && styles.swatchSelected]}
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
              placeholder="Cor #HEX"
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
            {goals.length ? (
              <View>
                <Text style={styles.sectionLabel}>Objetivo relacionado</Text>
                <View style={styles.goalRow}>
                  <Pressable
                    style={[styles.goalChip, form.goalId === null && styles.goalChipActive]}
                    onPress={() => setField('goalId', null)}
                  >
                    <Text style={styles.goalChipLabel}>Sem objetivo</Text>
                  </Pressable>
                  {goals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      style={[styles.goalChip, form.goalId === goal.id && styles.goalChipActive]}
                      onPress={() => setField('goalId', goal.id)}
                    >
                      <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                      <Text
                        style={[styles.goalChipLabel, form.goalId === goal.id && styles.goalChipLabelActive]}
                        numberOfLines={1}
                      >
                        {goal.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.secondary]} onPress={onClose}>
                <Text style={styles.buttonLabel}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.primary]} onPress={handleSave}>
                <Text style={styles.buttonLabel}>{isEditing ? 'Salvar' : 'Adicionar'}</Text>
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
      backgroundColor: 'rgba(0,0,0,0.6)',
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
      fontSize: 18,
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
      height: 120,
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
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase'
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 14,
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
      backgroundColor: 'rgba(0,0,0,0.35)'
    },
    goalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
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
    }
  });
