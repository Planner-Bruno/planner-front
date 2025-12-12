import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import type { FinanceTransaction, FinanceTransactionType, FinanceWallet } from '@/types/finance';
import { DateField } from '@/components/DateField';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';

export interface TransactionPayload {
  type: FinanceTransactionType;
  wallet_id: string;
  destination_wallet_id?: string | null;
  amount: number;
  currency: string;
  description?: string | null;
  notes?: string | null;
  date: string;
  cleared: boolean;
}

interface Props {
  visible: boolean;
  wallets: FinanceWallet[];
  initialTransaction?: FinanceTransaction | null;
  onClose(): void;
  onSubmit(payload: TransactionPayload, editingId?: FinanceTransaction['id']): void;
}

interface FormState {
  type: FinanceTransactionType;
  walletId: string;
  destinationWalletId: string | null;
  amount: string;
  currency: string;
  date: string;
  description: string;
  notes: string;
  cleared: boolean;
}

const transactionTypes: FinanceTransactionType[] = ['income', 'expense', 'transfer', 'adjustment'];

const todayIso = () => format(new Date(), 'yyyy-MM-dd');

const buildDefaultForm = (wallet?: FinanceWallet): FormState => ({
  type: 'expense',
  walletId: wallet?.id ?? '',
  destinationWalletId: null,
  amount: '',
  currency: wallet?.currency ?? 'BRL',
  date: todayIso(),
  description: '',
  notes: '',
  cleared: true
});

const toIsoDateTime = (date: string): string => {
  if (!date) return new Date().toISOString();
  return new Date(`${date}T12:00:00`).toISOString();
};

export const TransactionComposer = ({ visible, wallets, onClose, onSubmit, initialTransaction }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState<FormState>(() => buildDefaultForm(wallets[0]));
  const isEditing = Boolean(initialTransaction);

  useEffect(() => {
    if (!visible) {
      setForm(buildDefaultForm(wallets[0]));
      return;
    }
    if (initialTransaction) {
      setForm({
        type: initialTransaction.type,
        walletId: initialTransaction.wallet_id,
        destinationWalletId: initialTransaction.destination_wallet_id ?? null,
        amount: String(initialTransaction.amount ?? ''),
        currency: initialTransaction.currency ?? 'BRL',
        date: initialTransaction.date?.slice(0, 10) ?? todayIso(),
        description: initialTransaction.description ?? '',
        notes: initialTransaction.notes ?? '',
        cleared: initialTransaction.cleared !== false
      });
    } else {
      setForm(buildDefaultForm(wallets[0]));
    }
  }, [visible, initialTransaction, wallets]);

  useEffect(() => {
    if (!visible || isEditing) return;
    if (!form.walletId && wallets.length) {
      setForm((prev) => ({ ...prev, walletId: wallets[0].id, currency: wallets[0].currency }));
    }
  }, [visible, wallets, isEditing, form.walletId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.walletId) return;
    const amountValue = Math.abs(Number(form.amount.replace(',', '.')) || 0);
    if (!amountValue) return;
    onSubmit(
      {
        type: form.type,
        wallet_id: form.walletId,
        destination_wallet_id: form.type === 'transfer' ? form.destinationWalletId || undefined : undefined,
        amount: amountValue,
        currency: form.currency.trim().toUpperCase() || 'BRL',
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        date: toIsoDateTime(form.date),
        cleared: form.cleared
      },
      initialTransaction?.id
    );
  };

  const renderWalletPicker = (label: string, selectedId: string | null, onSelect: (id: string) => void) => (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.walletPicker}>
        {wallets.length ? (
          wallets.map((wallet) => {
            const active = wallet.id === selectedId;
            return (
              <Pressable
                key={wallet.id}
                style={[styles.walletChip, active && styles.walletChipActive]}
                onPress={() => onSelect(wallet.id)}
              >
                <Text style={[styles.walletChipLabel, active && styles.walletChipLabelActive]}>{wallet.name}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyWallet}>Cadastre uma carteira antes de lançar.</Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{isEditing ? 'Editar transação' : 'Nova transação'}</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeLabel}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {transactionTypes.map((type) => {
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
            {renderWalletPicker('Carteira origem', form.walletId, (id) => setField('walletId', id))}
            {form.type === 'transfer'
              ? renderWalletPicker('Carteira destino', form.destinationWalletId, (id) => setField('destinationWalletId', id))
              : null}
            <Text style={styles.fieldLabel}>Valor</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(text) => setField('amount', text)}
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
            <DateField
              placeholder="Data do lançamento"
              value={form.date}
              mode="date"
              onChange={(value) => setField('date', value)}
            />
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Assinatura streaming"
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={(text) => setField('description', text)}
            />
            <Text style={styles.fieldLabel}>Notas</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Obs. internas"
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={(text) => setField('notes', text)}
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Conciliado</Text>
              <Switch value={form.cleared} onValueChange={(value) => setField('cleared', value)} thumbColor={colors.surface} />
            </View>
            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.secondary]} onPress={onClose}>
                <Text style={styles.buttonLabel}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.primary]} onPress={handleSave}>
                <Text style={styles.buttonLabel}>{isEditing ? 'Salvar' : 'Registrar'}</Text>
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
      maxWidth: 520,
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
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top'
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
    walletPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    walletChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    walletChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    walletChipLabel: {
      color: colors.text
    },
    walletChipLabelActive: {
      color: colors.background,
      fontWeight: '600'
    },
    emptyWallet: {
      color: colors.textMuted,
      fontStyle: 'italic'
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
