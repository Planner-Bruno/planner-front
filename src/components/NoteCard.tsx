import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlannerNote } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { useColors } from '@/theme/ThemeProvider';

interface Props {
  note: PlannerNote;
  onEdit(note: PlannerNote): void;
  onDelete(id: PlannerNote['id']): void;
}

export const NoteCard = ({ note, onEdit, onDelete }: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, { backgroundColor: note.color || colors.mutedSurface }]}> 
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{note.title || 'Sem título'}</Text>
          <Text style={styles.timestamp}>{new Date(note.updatedAt).toLocaleDateString('pt-BR')}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionChip} onPress={() => onEdit(note)}>
            <Text style={styles.actionLabel}>Editar</Text>
          </Pressable>
          <Pressable style={styles.deleteChip} onPress={() => onDelete(note.id)}>
            <Text style={styles.deleteLabel}>Excluir</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.content}>{note.content}</Text>
      {note.tags?.length ? (
        <View style={styles.tagRow}>
          {note.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
      width: '100%'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12
    },
    headerText: {
      flexShrink: 1,
      minWidth: 180,
      gap: 4
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      flexShrink: 1
    },
    timestamp: {
      color: colors.textMuted,
      fontSize: 12
    },
    content: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      flexShrink: 1
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6
    },
    tagChip: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999
    },
    tagLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 8
    },
    actionChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6
    },
    deleteChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.danger,
      paddingHorizontal: 12,
      paddingVertical: 6
    },
    actionLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    deleteLabel: {
      color: colors.danger,
      fontWeight: '600'
    }
  });
