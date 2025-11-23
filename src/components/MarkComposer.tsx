import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CalendarMark } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

const colorOptions = ['#FDE047', '#A5B4FC', '#F472B6', '#34D399', '#F97316', '#0EA5E9'];

interface MarkPayload {
  label: string;
  color: string;
}

interface Props {
  visible: boolean;
  date: string;
  initialMark?: CalendarMark | null;
  onClose(): void;
  onSubmit(payload: MarkPayload, editingId?: CalendarMark['id']): void;
}

const defaultState: MarkPayload = {
  label: '',
  color: '#FDE047'
};

const parseDate = (value: string) => (value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value));

export const MarkComposer = ({ visible, onClose, onSubmit, date, initialMark }: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState(defaultState);
  const displayDate = useMemo(() => format(parseDate(date), "dd 'de' MMMM", { locale: ptBR }), [date]);
  const isEditing = Boolean(initialMark);

  useEffect(() => {
    if (visible && initialMark) {
      setForm({ label: initialMark.label, color: initialMark.color });
    } else if (!visible) {
      setForm(defaultState);
    }
  }, [visible, initialMark]);

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSubmit(form, initialMark?.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar marcação' : `Marcar ${displayDate}`}</Text>
              <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Rótulo</Text>
            <TextInput
              style={styles.input}
              placeholder="Rótulo"
              placeholderTextColor={colors.textMuted}
              value={form.label}
              onChangeText={(label) => setForm((prev) => ({ ...prev, label }))}
            />
            <View>
              <Text style={styles.sectionLabel}>Cor do destaque</Text>
              <View style={styles.swatchRow}>
                {colorOptions.map((hex) => (
                  <Pressable
                    key={hex}
                    style={[styles.swatch, { backgroundColor: hex }, form.color === hex && styles.swatchSelected]}
                    onPress={() => setForm((prev) => ({ ...prev, color: hex }))}
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
              onChangeText={(colorValue) => setForm((prev) => ({ ...prev, color: colorValue }))}
            />
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
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      width: '100%',
      maxWidth: 440,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '80%',
      overflow: 'hidden'
    },
    content: {
      padding: 20,
      gap: 16
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      color: colors.text,
      fontSize: 16,
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
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: colors.text
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8
    },
    button: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center'
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border
    },
    primary: {
      backgroundColor: colors.primary
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
    swatch: {
      width: 38,
      height: 38,
      borderRadius: 16,
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
      backgroundColor: 'rgba(0,0,0,0.4)'
    }
  });
