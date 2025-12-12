import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { FinanceWallet, FinanceWalletType } from '@/types/finance';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';

export interface WalletPayload {
  name: string;
  type: FinanceWalletType;
  balance: number;
  currency: string;
  include_in_net_worth: boolean;
  archived: boolean;
}

interface Props {
  visible: boolean;
  initialWallet?: FinanceWallet | null;
  onClose(): void;
  onSubmit(payload: WalletPayload, editingId?: FinanceWallet['id']): void;
}

interface FormState {
  name: string;
  type: FinanceWalletType;
  balance: string;
  currency: string;
  include: boolean;
  archived: boolean;
}

const walletTypes: FinanceWalletType[] = ['cash', 'checking', 'savings', 'credit', 'investment', 'other'];

const buildDefaultForm = (): FormState => ({
  name: '',
  type: 'checking',
  balance: '0',
  currency: 'BRL',
  include: true,
  archived: false
});

export const WalletComposer = ({ visible, onClose, onSubmit, initialWallet }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState<FormState>(() => buildDefaultForm());
  const isEditing = Boolean(initialWallet);

  useEffect(() => {
    if (!visible) {
      setForm(buildDefaultForm());
      return;
    }
    if (initialWallet) {
      setForm({
        name: initialWallet.name,
        type: initialWallet.type,
        balance: String(initialWallet.balance ?? 0),
        currency: initialWallet.currency ?? 'BRL',
        include: initialWallet.include_in_net_worth !== false,
        archived: Boolean(initialWallet.archived)
      });
    } else {
      setForm(buildDefaultForm());
    }
  }, [visible, initialWallet]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const balanceValue = Number(form.balance.replace(',', '.')) || 0;
    onSubmit(
      {
        name: form.name.trim(),
        type: form.type,
        balance: balanceValue,
        currency: form.currency.trim().toUpperCase() || 'BRL',
        include_in_net_worth: form.include,
        archived: form.archived
      },
      initialWallet?.id
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar carteira' : 'Nova carteira'}</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Conta corrente, Cofre, ..."
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(text) => setField('name', text)}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {walletTypes.map((type) => {
                const active = form.type === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setField('type', type)}
                  >
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{type}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Saldo inicial</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={form.balance}
              onChangeText={(text) => setField('balance', text)}
            />
            <Text style={styles.fieldLabel}>Moeda</Text>
            <TextInput
              style={styles.input}
              placeholder="BRL"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={form.currency}
              onChangeText={(text) => setField('currency', text)}
              maxLength={4}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Incluir no patrimônio</Text>
              <Switch value={form.include} onValueChange={(value) => setField('include', value)} thumbColor={colors.surface} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Arquivar</Text>
              <Switch value={form.archived} onValueChange={(value) => setField('archived', value)} thumbColor={colors.surface} />
            </View>
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
      backgroundColor: 'rgba(5,5,15,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    sheet: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    closeLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text
    },
    fieldLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text
    },
    typeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    typeChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    typeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    typeLabel: {
      color: colors.text
    },
    typeLabelActive: {
      color: colors.background,
      fontWeight: '600'
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    switchLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8
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
    }
  });
