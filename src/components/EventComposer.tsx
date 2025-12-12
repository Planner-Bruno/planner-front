import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Goal, ScheduleEvent, ScheduleEventKind } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { DateField } from '@/components/DateField';
import { normalizeDateInput } from '@/utils/dateUtils';

interface EventPayload {
  kind: ScheduleEventKind;
  title: string;
  description?: string;
  date: string;
  start?: string;
  end?: string;
  color: string;
  reminderNote?: string;
  linkedGoalId?: string | null;
}

interface Props {
  visible: boolean;
  onClose(): void;
  onSubmit(payload: EventPayload, editingId?: ScheduleEvent['id']): void;
  defaultKind?: ScheduleEventKind;
  defaultDate?: string;
  initialEvent?: ScheduleEvent | null;
  goals: Goal[];
}

const colorOptions = ['#818CF8', '#F472B6', '#34D399', '#FB923C', '#FDE047', '#22D3EE'];

const defaultState: EventPayload = {
  kind: 'event',
  title: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  start: '',
  end: '',
  color: '#818CF8',
  reminderNote: '',
  linkedGoalId: null
};

export const EventComposer = ({ visible, onClose, onSubmit, defaultKind, defaultDate, initialEvent, goals }: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState(defaultState);
  const isEditing = Boolean(initialEvent);

  useEffect(() => {
    if (visible && initialEvent) {
      setForm({
        kind: initialEvent.kind,
        title: initialEvent.title,
        description: initialEvent.description ?? '',
        date: initialEvent.date.slice(0, 10),
        start: initialEvent.start ?? '',
        end: initialEvent.end ?? '',
        color: initialEvent.color,
        reminderNote: initialEvent.reminderNote ?? '',
        linkedGoalId: initialEvent.linkedGoalId ?? null
      });
    } else if (visible) {
      setForm({
        ...defaultState,
        kind: defaultKind ?? defaultState.kind,
        date: defaultDate ?? defaultState.date
      });
    } else {
      setForm(defaultState);
    }
  }, [visible, defaultKind, defaultDate, initialEvent]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    const normalizedDate = normalizeDateInput(form.date);
    if (!normalizedDate) return;
    onSubmit(
      {
        ...form,
        date: normalizedDate
      },
      initialEvent?.id
    );
    onClose();
  };

  const setField = <K extends keyof EventPayload>(key: K, value: EventPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar compromisso' : 'Novo compromisso'}</Text>
              <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chipRow}>
              {(['event', 'reminder'] as ScheduleEventKind[]).map((kind) => (
                <Pressable
                  key={kind}
                  style={[styles.kindChip, form.kind === kind && styles.kindChipActive]}
                  onPress={() => setField('kind', kind)}
                >
                  <Text style={[styles.kindLabel, form.kind === kind && styles.kindLabelActive]}>
                    {kind === 'event' ? 'Evento' : 'Lembrete'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(text) => setField('title', text)}
            />
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Descrição"
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={(text) => setField('description', text)}
              multiline
            />
            <Text style={styles.label}>Data</Text>
            <DateField
              placeholder="Escolher data"
              value={form.date}
              mode="date"
              onChange={(value) => setField('date', value)}
            />
            {form.kind === 'event' ? (
              <View>
                <Text style={styles.label}>Horários</Text>
                <View style={styles.row}>
                  <DateField
                    placeholder="Início"
                    value={form.start}
                    mode="time"
                    onChange={(value) => setField('start', value)}
                    style={styles.half}
                  />
                  <DateField
                    placeholder="Fim"
                    value={form.end}
                    mode="time"
                    onChange={(value) => setField('end', value)}
                    style={styles.half}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Observação</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Observação do lembrete"
                  placeholderTextColor={colors.textMuted}
                  value={form.reminderNote}
                  onChangeText={(text) => setField('reminderNote', text)}
                />
              </View>
            )}
            <View>
              <Text style={styles.label}>Cor do evento</Text>
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
            <Text style={styles.label}>Cor personalizada</Text>
            <TextInput
              style={styles.input}
              placeholder="Cor (#HEX)"
              placeholderTextColor={colors.textMuted}
              value={form.color}
              onChangeText={(text) => setField('color', text)}
            />
            {goals.length ? (
              <View>
                <Text style={styles.label}>Meta vinculada</Text>
                <View style={styles.goalRow}>
                  <Pressable
                    style={[styles.goalChip, form.linkedGoalId === null && styles.goalChipActive]}
                    onPress={() => setField('linkedGoalId', null)}
                  >
                    <Text style={styles.goalChipLabel}>Sem meta</Text>
                  </Pressable>
                  {goals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      style={[styles.goalChip, form.linkedGoalId === goal.id && styles.goalChipActive]}
                      onPress={() => setField('linkedGoalId', goal.id)}
                    >
                      <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                      <Text
                        style={[styles.goalChipLabel, form.linkedGoalId === goal.id && styles.goalChipLabelActive]}
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
                <Text style={styles.buttonLabel}>Salvar</Text>
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 32,
      gap: 12,
      width: '100%',
      maxWidth: 540,
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
    chipRow: {
      flexDirection: 'row',
      gap: 10
    },
    kindChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    kindChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    kindLabel: {
      color: colors.textMuted,
      fontWeight: '600'
    },
    kindLabelActive: {
      color: colors.background
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
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      width: '100%'
    },
    half: {
      flexGrow: 1,
      minWidth: 120,
      maxWidth: '48%'
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
    label: {
      color: colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 6
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 8
    },
    swatch: {
      width: 36,
      height: 36,
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
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.3)'
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
