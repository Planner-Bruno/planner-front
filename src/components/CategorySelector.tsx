import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PlannerCategory } from '@/types/planner';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  label: string;
  categories: PlannerCategory[];
  selectedId?: string | null;
  onSelect(category: PlannerCategory): void;
  onCreateCategory(name: string, color: string): boolean;
  onDeleteCategory(id: PlannerCategory['id']): boolean;
  usageMap: Record<string, number>;
}

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

export const CategorySelector = ({
  label,
  categories,
  selectedId,
  onSelect,
  onCreateCategory,
  onDeleteCategory,
  usageMap
}: Props) => {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#94A3B8');
  const [expanded, setExpanded] = useState(false);
  const normalizedColor = useMemo(() => (color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`), [color]);
  const previewColor = useMemo(() => (isHexColor(normalizedColor) ? normalizedColor : colors.border), [normalizedColor, colors.border]);
  const canCreate = name.trim().length > 0 && isHexColor(normalizedColor);
  const webColorOverlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent'
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const created = onCreateCategory(name, normalizedColor);
    if (created) {
      setName('');
      setColor('#94A3B8');
    }
  };

  const handleDelete = (categoryId: string) => {
    onDeleteCategory(categoryId);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {categories.map((category) => {
          const isSelected = selectedId === category.id;
          const deletable = (usageMap[category.id] ?? 0) === 0;
          return (
            <Pressable
              key={category.id}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelect(category)}
            >
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>{category.name}</Text>
              {deletable ? (
                <Pressable
                  style={styles.removeBtn}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleDelete(category.id);
                  }}
                >
                  <Text style={styles.removeLabel}>x</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
        {!categories.length ? (
          <Text style={styles.emptyLabel}>Nenhuma categoria cadastrada.</Text>
        ) : null}
      </View>
      <Pressable
        style={[styles.toggleButton, expanded && styles.toggleButtonActive]}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Text style={[styles.toggleButtonLabel, expanded && styles.toggleButtonLabelActive]}>
          {expanded ? 'Ocultar formulário' : 'Nova categoria'}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.createBlock}>
          <Text style={styles.createLabel}>Adicionar categoria</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.colorRow}>
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Cor (#HEX)"
              placeholderTextColor={colors.textMuted}
              value={color}
              onChangeText={setColor}
              autoCapitalize="none"
            />
            <View style={[styles.colorPreview, { backgroundColor: previewColor }]} />
            {Platform.OS === 'web' ? (
              <View style={styles.pickButton}>
                <Text style={styles.pickButtonLabel}>Paleta</Text>
                <input
                  type="color"
                  value={previewColor}
                  onChange={(event) => setColor(event.target.value)}
                  style={webColorOverlayStyle}
                />
              </View>
            ) : null}
          </View>
          <Pressable
            style={[styles.addButton, !canCreate && styles.addButtonDisabled]}
            onPress={handleCreate}
            disabled={!canCreate}
          >
            <Text style={styles.addButtonLabel}>Adicionar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      gap: 12
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase'
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    chipLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    chipLabelActive: {
      color: colors.background
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    removeBtn: {
      marginLeft: 4,
      paddingHorizontal: 4
    },
    removeLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700'
    },
    emptyLabel: {
      color: colors.textMuted,
      fontStyle: 'italic'
    },
    toggleButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignSelf: 'flex-start'
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    toggleButtonLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    toggleButtonLabelActive: {
      color: colors.background
    },
    createBlock: {
      gap: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      alignSelf: 'stretch'
    },
    createLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    },
    colorInput: {
      flex: 1
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    pickButton: {
      position: 'relative',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    pickButtonLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    addButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.primary
    },
    addButtonDisabled: {
      opacity: 0.5
    },
    addButtonLabel: {
      color: colors.background,
      fontWeight: '700'
    }
  });
