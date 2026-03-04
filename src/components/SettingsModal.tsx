import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette, ThemeMode } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';

interface SettingsModalProps {
  visible: boolean;
  onClose(): void;
  userName?: string | null;
  userEmail?: string | null;
  themeMode: ThemeMode;
  onSelectTheme(mode: ThemeMode): void;
  savingPreference?: boolean;
  preferenceError?: string | null;
}

type SettingsTab = 'profile' | 'preferences';

const TAB_LABELS: Record<SettingsTab, string> = {
  profile: 'Perfil',
  preferences: 'Preferências'
};

export const SettingsModal = ({
  visible,
  onClose,
  userName,
  userEmail,
  themeMode,
  onSelectTheme,
  savingPreference = false,
  preferenceError = null
}: SettingsModalProps) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<SettingsTab>('profile');

  useEffect(() => {
    if (visible) {
      setTab('profile');
    }
  }, [visible]);

  const renderProfile = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informações da conta</Text>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Nome</Text>
        <Text style={styles.infoValue}>{userName || 'Não informado'}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>E-mail</Text>
        <Text style={styles.infoValue}>{userEmail || '—'}</Text>
      </View>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tema</Text>
      <Text style={styles.sectionDescription}>Essa escolha fica vinculada à sua conta e será aplicada ao fazer login.</Text>
      <View style={styles.toggleRow}>
        {(['light', 'dark'] as ThemeMode[]).map((mode) => {
          const active = themeMode === mode;
          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => onSelectTheme(mode)}
              disabled={savingPreference || active}
              style={[styles.toggleChip, active && styles.toggleChipActive, (savingPreference || active) && styles.toggleChipDisabled]}
            >
              <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                {mode === 'light' ? 'Modo claro' : 'Modo escuro'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {preferenceError ? <Text style={styles.errorText}>{preferenceError}</Text> : null}
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Configurações</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeLabel}>Fechar</Text>
            </Pressable>
          </View>
          <View style={styles.tabRow}>
            {(Object.keys(TAB_LABELS) as SettingsTab[]).map((key) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setTab(key)}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{TAB_LABELS[key]}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.content}>{tab === 'profile' ? renderProfile() : renderPreferences()}</View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    },
    sheet: {
      width: '100%',
      maxWidth: 520,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      gap: 16
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text
    },
    closeLabel: {
      color: colors.accent,
      fontWeight: '600'
    },
    tabRow: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.mutedSurface,
      borderRadius: 999,
      padding: 4
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 999
    },
    tabButtonActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    tabLabel: {
      color: colors.textMuted,
      fontWeight: '600'
    },
    tabLabelActive: {
      color: colors.text
    },
    content: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      backgroundColor: colors.mutedSurface
    },
    section: {
      gap: 16
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textMuted
    },
    infoBlock: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    infoLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.textMuted
    },
    infoValue: {
      marginTop: 4,
      fontSize: 15,
      color: colors.text,
      fontWeight: '600'
    },
    toggleRow: {
      flexDirection: 'row',
      gap: 12
    },
    toggleChip: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface
    },
    toggleChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    toggleChipDisabled: {
      opacity: 0.65
    },
    toggleLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    toggleLabelActive: {
      color: colors.background
    },
    errorText: {
      color: colors.danger,
      fontSize: 12
    }
  });
