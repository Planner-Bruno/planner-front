import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFinanceStore } from '@/state/useFinanceStore';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';

type FinanceFocusVariant = 'home' | 'panel';

interface Props {
  onOpenFinance?: () => void;
  onCreateWallet?: () => void;
  onAddTransaction?: () => void;
  variant?: FinanceFocusVariant;
}

const formatCurrency = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

export const FinanceHomeSection = ({ onOpenFinance, onCreateWallet, onAddTransaction, variant = 'home' }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    snapshot,
    overview,
    derived,
    loadingSnapshot,
    loadingOverview,
    refreshSnapshot,
    refreshOverview
  } = useFinanceStore();
  const refreshing = loadingSnapshot || loadingOverview;
  const [expandTransactions, setExpandTransactions] = useState(false);

  const wallets = useMemo(
    () => snapshot.wallets.slice().sort((a, b) => b.balance - a.balance).slice(0, 3),
    [snapshot.wallets]
  );
  const transactions = useMemo(() => {
    return snapshot.transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, expandTransactions ? 10 : 5);
  }, [snapshot.transactions, expandTransactions]);

  const totalWallets = snapshot.wallets.length;
  const totalTransactions = snapshot.transactions.length;

  const handleRefresh = () => {
    if (refreshing) return;
    void refreshSnapshot();
    void refreshOverview();
  };

  const handleEmptyAction = (type: 'wallet' | 'transaction') => {
    if (variant === 'panel') {
      if (type === 'wallet' && onCreateWallet) {
        onCreateWallet();
        return;
      }
      if (type === 'transaction' && onAddTransaction) {
        onAddTransaction();
        return;
      }
    }
    if (onOpenFinance) {
      onOpenFinance();
      return;
    }
    Alert.alert('Financeiro', 'Acesse a aba de finanças para começar.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finanças em foco</Text>
          <Text style={styles.subtitle}>
            Patrimônio líquido {formatCurrency(overview?.total_balance ?? derived.netWorth)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.chip, refreshing && styles.chipDisabled]} onPress={handleRefresh} disabled={refreshing}>
            <Text style={styles.chipLabel}>{refreshing ? 'Atualizando...' : 'Sincronizar'}</Text>
          </Pressable>
          {variant === 'home' && onOpenFinance ? (
            <Pressable style={[styles.chip, styles.primaryChip]} onPress={onOpenFinance}>
              <Text style={[styles.chipLabel, styles.primaryChipLabel]}>Abrir painel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Carteiras</Text>
          <Text style={styles.sectionMeta}>{totalWallets} cadastradas</Text>
        </View>
        {wallets.length ? (
          <View style={styles.walletList}>
            {wallets.map((wallet) => (
              <View key={wallet.id} style={styles.walletItem}>
                <View style={styles.walletRow}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletType}>{wallet.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.walletBalance}>{formatCurrency(wallet.balance, wallet.currency)}</Text>
                {wallet.goal_amount ? (
                  <Text style={styles.walletMeta}>Meta: {formatCurrency(wallet.goal_amount, wallet.currency)}</Text>
                ) : null}
              </View>
            ))}
            {totalWallets > wallets.length ? (
              <Text style={styles.seeMoreMeta}>{totalWallets - wallets.length} outras carteiras ocultas</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineTitle}>Nenhuma carteira</Text>
            <Text style={styles.emptyInlineText}>Cadastre contas ou cofres para acompanhar o saldo.</Text>
            <Pressable
              style={[styles.chip, styles.primaryChip]}
              onPress={() => handleEmptyAction('wallet')}
            >
              <Text style={[styles.chipLabel, styles.primaryChipLabel]}>
                {variant === 'panel' ? 'Nova carteira' : 'Ir para finanças'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimentações recentes</Text>
          <Text style={styles.sectionMeta}>{totalTransactions} no histórico</Text>
        </View>
        {transactions.length ? (
          <View>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View>
                  <Text style={styles.transactionTitle}>{transaction.description ?? 'Transação'}</Text>
                  <Text style={styles.transactionMeta}>{formatDate(transaction.date)} • {transaction.type}</Text>
                </View>
                <Text style={[styles.transactionAmount, transaction.type === 'expense' ? styles.expense : styles.income]}>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </Text>
              </View>
            ))}
            {totalTransactions > transactions.length ? (
              <Pressable style={styles.showAllButton} onPress={() => setExpandTransactions((prev) => !prev)}>
                <Text style={styles.showAllLabel}>{expandTransactions ? 'Ver menos' : 'Ver mais lançamentos'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineTitle}>Sem lançamentos</Text>
            <Text style={styles.emptyInlineText}>Registre receitas ou despesas na aba de finanças.</Text>
            <Pressable
              style={[styles.chip, styles.primaryChip]}
              onPress={() => handleEmptyAction('transaction')}
            >
              <Text style={[styles.chipLabel, styles.primaryChipLabel]}>
                {variant === 'panel' ? 'Nova transação' : 'Abrir painel'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 20
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap'
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: 'center'
    },
    chipDisabled: {
      opacity: 0.6
    },
    chipLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    primaryChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    primaryChipLabel: {
      color: colors.background
    },
    sectionBlock: {
      gap: 12
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    sectionMeta: {
      color: colors.textMuted,
      fontSize: 13
    },
    walletList: {
      gap: 12
    },
    walletItem: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    walletRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    walletName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text
    },
    walletType: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.5
    },
    walletBalance: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 6,
      color: colors.text
    },
    walletMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4
    },
    seeMoreMeta: {
      color: colors.textMuted,
      fontSize: 12
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border
    },
    transactionTitle: {
      color: colors.text,
      fontWeight: '600'
    },
    transactionMeta: {
      color: colors.textMuted,
      fontSize: 12
    },
    transactionAmount: {
      fontWeight: '700'
    },
    income: {
      color: colors.success
    },
    expense: {
      color: colors.danger
    },
    showAllButton: {
      alignSelf: 'flex-start',
      marginTop: 12
    },
    showAllLabel: {
      color: colors.primary,
      fontWeight: '600'
    },
    emptyInline: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8
    },
    emptyInlineTitle: {
      color: colors.text,
      fontWeight: '600',
      marginBottom: 2
    },
    emptyInlineText: {
      color: colors.textMuted,
      fontSize: 13
    }
  });
