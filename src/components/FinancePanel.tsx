import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFinanceStore } from '@/state/useFinanceStore';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';
import { EmptyState } from '@/components/EmptyState';
import { FinanceHomeSection } from '@/components/FinanceHomeSection';
import { WalletComposer, type WalletPayload } from '@/components/finance/WalletComposer';
import { TransactionComposer, type TransactionPayload } from '@/components/finance/TransactionComposer';
import { generateFinanceId } from '@/utils/financeUtils';
import type { FinanceBudget, FinanceGoal, FinanceTransaction, FinanceWallet } from '@/types/finance';

const formatCurrency = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

type FinanceTab = 'overview' | 'wallets' | 'transactions' | 'budgets' | 'goals';

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return 'Período aberto';
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  const formatPart = (value?: string | null, fallback?: string) => {
    if (!value) return fallback ?? 'sem data';
    try {
      return formatter.format(new Date(value));
    } catch (error) {
      return fallback ?? value;
    }
  };
  const startLabel = formatPart(start, 'início livre');
  const endLabel = formatPart(end, 'sem fim definido');
  return `${startLabel} • ${endLabel}`;
};

const getBudgetProgress = (budget: FinanceBudget) => {
  const total = Math.max(budget.amount ?? 0, 0);
  const spent = Math.max(budget.spent_amount ?? 0, 0);
  const ratio = total > 0 ? spent / total : 0;
  const percentage = Math.min(100, Math.round(ratio * 100));
  return { total, spent, ratio, percentage };
};

const getGoalProgress = (goal: FinanceGoal) => {
  const target = Math.max(goal.target_amount ?? 0, 0);
  const current = Math.max(goal.current_amount ?? 0, 0);
  const ratio = target > 0 ? current / target : 0;
  const percentage = Math.min(100, Math.round(ratio * 100));
  return { target, current, ratio, percentage };
};

export const FinancePanel = () => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    snapshot,
    overview,
    loadingSnapshot,
    loadingOverview,
    refreshSnapshot,
    refreshOverview,
    derived,
    createEntity,
    patchEntity,
    saving,
    removeEntity
  } = useFinanceStore();
  const [walletComposerVisible, setWalletComposerVisible] = useState(false);
  const [transactionComposerVisible, setTransactionComposerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense' | 'transfer' | 'adjustment'>('all');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<FinanceWallet | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const refreshing = loadingSnapshot || loadingOverview;
  const financeTabs: Array<{ key: FinanceTab; label: string }> = [
    { key: 'overview', label: 'Resumo' },
    { key: 'wallets', label: 'Carteiras' },
    { key: 'transactions', label: 'Transações' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'goals', label: 'Metas' }
  ];
  const closeWalletComposer = () => {
    setWalletComposerVisible(false);
    setEditingWallet(null);
  };
  const closeTransactionComposer = () => {
    setTransactionComposerVisible(false);
    setEditingTransaction(null);
  };
  const handleRefresh = () => {
    void refreshSnapshot();
    void refreshOverview();
  };

  const confirmFinanceRemoval = async (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const hasWindow = typeof window !== 'undefined';
      return hasWindow ? window.confirm(`${title}\n\n${message}`) : false;
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
  };

  const handleWalletSubmit = async (payload: WalletPayload, editingId?: string) => {
    try {
      if (editingId) {
        await patchEntity('wallets', editingId, payload);
      } else {
        const timestamp = new Date().toISOString();
        await createEntity('wallets', {
          id: generateFinanceId('wallet'),
          name: payload.name,
          type: payload.type,
          balance: payload.balance,
          currency: payload.currency,
          include_in_net_worth: payload.include_in_net_worth,
          archived: payload.archived,
          goal_amount: null,
          icon: null,
          color: undefined,
          created_at: timestamp,
          updated_at: timestamp
        });
      }
      closeWalletComposer();
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao salvar carteira', error instanceof Error ? error.message : 'Não foi possível salvar a carteira.');
    }
  };

  const handleTransactionSubmit = async (payload: TransactionPayload, editingId?: string) => {
    if (!payload.wallet_id) {
      Alert.alert('Selecione uma carteira', 'Escolha a carteira de origem antes de salvar.');
      return;
    }
    try {
      if (editingId) {
        await patchEntity('transactions', editingId, payload);
      } else {
        const timestamp = new Date().toISOString();
        await createEntity('transactions', {
          id: generateFinanceId('txn'),
          ...payload,
          category_id: null,
          category_name: null,
          tags: [],
          attachments: [],
          splits: [],
          created_at: timestamp,
          updated_at: timestamp
        });
      }
      closeTransactionComposer();
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao registrar transação', error instanceof Error ? error.message : 'Não foi possível registrar a transação.');
    }
  };

  const handleRemoveWallet = async (wallet: FinanceWallet) => {
    const confirmed = await confirmFinanceRemoval('Excluir carteira', `Tem certeza que deseja remover ${wallet.name}?`);
    if (!confirmed) return;
    try {
      await removeEntity('wallets', wallet.id);
      if (selectedWalletId === wallet.id) {
        setSelectedWalletId(null);
      }
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao excluir carteira', error instanceof Error ? error.message : 'Não foi possível excluir a carteira.');
    }
  };

  const handleRemoveTransaction = async (transaction: FinanceTransaction) => {
    const confirmed = await confirmFinanceRemoval('Excluir transação', `Remover "${transaction.description ?? 'Transação'}"?`);
    if (!confirmed) return;
    try {
      await removeEntity('transactions', transaction.id);
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao excluir transação', error instanceof Error ? error.message : 'Não foi possível excluir a transação.');
    }
  };

  const handleRemoveBudget = async (budget: FinanceBudget) => {
    const confirmed = await confirmFinanceRemoval('Excluir budget', `Deseja remover o budget ${budget.title}?`);
    if (!confirmed) return;
    try {
      await removeEntity('budgets', budget.id);
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao excluir budget', error instanceof Error ? error.message : 'Não foi possível excluir o budget.');
    }
  };

  const handleRemoveGoal = async (goal: FinanceGoal) => {
    const confirmed = await confirmFinanceRemoval('Excluir meta', `Remover a meta ${goal.title}?`);
    if (!confirmed) return;
    try {
      await removeEntity('goals', goal.id);
      void refreshOverview();
    } catch (error) {
      Alert.alert('Erro ao excluir meta', error instanceof Error ? error.message : 'Não foi possível excluir a meta.');
    }
  };

  const wallets = useMemo(
    () => snapshot.wallets.slice().sort((a, b) => b.balance - a.balance),
    [snapshot.wallets]
  );
  const sortedTransactions = useMemo(
    () => snapshot.transactions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [snapshot.transactions]
  );
  const recentWallets = useMemo(() => wallets.slice(0, 4), [wallets]);
  const recentTransactions = useMemo(() => sortedTransactions.slice(0, 5), [sortedTransactions]);
  const transactionsByWallet = useMemo(() => {
    return sortedTransactions.reduce<Record<string, FinanceTransaction[]>>((acc, transaction) => {
      const walletId = transaction.wallet_id;
      if (!walletId) return acc;
      if (!acc[walletId]) acc[walletId] = [];
      acc[walletId]!.push(transaction);
      return acc;
    }, {});
  }, [sortedTransactions]);
  const filteredTransactions = useMemo(() => {
    let base = transactionFilter === 'all' ? sortedTransactions : sortedTransactions.filter((tx) => tx.type === transactionFilter);
    if (selectedWalletId) {
      base = base.filter((tx) => tx.wallet_id === selectedWalletId || tx.destination_wallet_id === selectedWalletId);
    }
    return showAllTransactions ? base : base.slice(0, 15);
  }, [sortedTransactions, transactionFilter, selectedWalletId, showAllTransactions]);
  const totalTransactions = sortedTransactions.length;
  const transactionFilters = [
    { key: 'all', label: 'Todas' },
    { key: 'income', label: 'Receitas' },
    { key: 'expense', label: 'Despesas' },
    { key: 'transfer', label: 'Transferências' },
    { key: 'adjustment', label: 'Ajustes' }
  ] as const;
  const selectedWalletName = selectedWalletId ? wallets.find((wallet) => wallet.id === selectedWalletId)?.name : null;
  const clearWalletFilter = () => setSelectedWalletId(null);
  const orderedBudgets = useMemo(() => {
    const ordered = snapshot.budgets
      .slice()
      .sort((a, b) => new Date(a.start_date ?? 0).getTime() - new Date(b.start_date ?? 0).getTime());
    const activeFirst = ordered.filter((budget) => budget.status !== 'completed');
    return activeFirst.length ? activeFirst : ordered;
  }, [snapshot.budgets]);
  const highlightedBudgets = useMemo(() => orderedBudgets.slice(0, 4), [orderedBudgets]);
  const orderedGoals = useMemo(() => {
    const ordered = snapshot.goals
      .slice()
      .sort((a, b) => new Date(a.target_date ?? a.created_at ?? 0).getTime() - new Date(b.target_date ?? b.created_at ?? 0).getTime());
    const activeFirst = ordered.filter((goal) => goal.status !== 'completed' && goal.status !== 'cancelled');
    return activeFirst.length ? activeFirst : ordered;
  }, [snapshot.goals]);
  const highlightedGoals = useMemo(() => orderedGoals.slice(0, 4), [orderedGoals]);

  const cards = [
    {
      label: 'Patrimônio líquido',
      value: formatCurrency(overview?.total_balance ?? derived.netWorth)
    },
    {
      label: 'Receitas no mês',
      value: formatCurrency(overview?.monthly_income ?? 0)
    },
    {
      label: 'Despesas no mês',
      value: formatCurrency(overview?.monthly_expense ?? 0)
    },
    {
      label: 'Transações no mês',
      value: String(overview?.transactions_this_month ?? snapshot.transactions.length)
    }
  ];

  const renderSummaryCards = () => (
    <View style={styles.summaryGrid}>
      {cards.map((card) => (
        <View key={card.label} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{card.label}</Text>
          <Text style={styles.summaryValue}>{card.value}</Text>
        </View>
      ))}
    </View>
  );

  const renderActionButtons = (options: { wallet?: boolean; transaction?: boolean }) => {
    const buttons: JSX.Element[] = [];
    if (options.wallet) {
      buttons.push(
        <Pressable
          key="wallet"
          style={[styles.actionButton, styles.actionSecondary, saving && styles.actionDisabled]}
          onPress={() => setWalletComposerVisible(true)}
          disabled={saving}
        >
          <Text style={styles.actionLabel}>Nova carteira</Text>
        </Pressable>
      );
    }
    if (options.transaction) {
      buttons.push(
        <Pressable
          key="transaction"
          style={[
            styles.actionButton,
            styles.actionPrimary,
            (saving || wallets.length === 0) && styles.actionDisabled,
            wallets.length === 0 && styles.actionPrimaryDisabled
          ]}
          onPress={() => setTransactionComposerVisible(true)}
          disabled={saving || wallets.length === 0}
        >
          <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>
            {wallets.length === 0 ? 'Cadastre uma carteira' : 'Nova transação'}
          </Text>
        </Pressable>
      );
    }
    if (!buttons.length) return null;
    return <View style={styles.actionsRow}>{buttons}</View>;
  };

  const renderWalletGrid = (walletList: FinanceWallet[], options?: { enableActions?: boolean }) => {
    if (!walletList.length) {
      return <EmptyState title="Nenhuma carteira" description="Comece adicionando sua conta corrente ou um cofre." />;
    }
    const showActions = options?.enableActions;
    return (
      <View style={styles.walletGrid}>
        {walletList.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const recentTx = transactionsByWallet[wallet.id]?.[0];
          return (
            <Pressable
              key={wallet.id}
              style={[styles.walletCard, isSelected && styles.walletCardActive]}
              onPress={() => setSelectedWalletId(isSelected ? null : wallet.id)}
              onLongPress={() => {
                setEditingWallet(wallet);
                setWalletComposerVisible(true);
              }}
            >
              <View style={styles.walletRow}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <View style={styles.walletActions}>
                  <Pressable
                    style={styles.walletEditButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      setEditingWallet(wallet);
                      setWalletComposerVisible(true);
                    }}
                  >
                    <Text style={styles.walletEditLabel}>Editar</Text>
                  </Pressable>
                  {showActions ? (
                    <Pressable
                      style={styles.walletDeleteButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleRemoveWallet(wallet);
                      }}
                    >
                      <Text style={styles.walletDeleteLabel}>Excluir</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <Text style={styles.walletBalance}>{formatCurrency(wallet.balance, wallet.currency)}</Text>
              <Text style={styles.walletMeta}>{wallet.type.toUpperCase()}</Text>
              {recentTx ? (
                <Text style={styles.walletRecent}>
                  Último lançamento em {formatDate(recentTx.date)} ({recentTx.type})
                </Text>
              ) : (
                <Text style={styles.walletRecentMuted}>Sem lançamentos ainda</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderTransactionItems = (transactions: FinanceTransaction[], options?: { enableActions?: boolean }) => {
    if (!transactions.length) {
      return <EmptyState title="Sem lançamentos" description="Registre receitas e despesas para acompanhar seu fluxo." />;
    }
    const showActions = options?.enableActions;
    return (
      <View style={styles.transactionList}>
        {transactions.map((transaction) => (
          <Pressable
            key={transaction.id}
            style={styles.transactionItem}
            onLongPress={() => {
              setEditingTransaction(transaction);
              setTransactionComposerVisible(true);
            }}
          >
            <View>
              <Text style={styles.transactionTitle}>{transaction.description ?? 'Transação'}</Text>
              <Text style={styles.transactionMeta}>{formatDate(transaction.date)} • {transaction.type}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[styles.transactionAmount, transaction.type === 'expense' ? styles.expense : styles.income]}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount, transaction.currency)}
              </Text>
              {showActions ? (
                <Pressable
                  style={styles.transactionDeleteButton}
                  onPress={() => void handleRemoveTransaction(transaction)}
                >
                  <Text style={styles.transactionDeleteLabel}>Excluir</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderBudgetCards = (budgets: FinanceBudget[], options?: { enableActions?: boolean }) => {
    if (!budgets.length) {
      return <EmptyState title="Ainda sem budgets" description="Defina limites mensais ou semanais para controlar gastos." />;
    }
    const showActions = options?.enableActions;
    return (
      <View style={styles.budgetList}>
        {budgets.map((budget) => {
          const { total, spent, ratio, percentage } = getBudgetProgress(budget);
          const overBudget = total > 0 && spent > total;
          const threshold = ((budget.alert_percentage ?? 80) / 100) || 0.8;
          const warn = overBudget || ratio >= threshold;
          const width = `${Math.min(100, Math.max(0, percentage))}%`;
          return (
            <View key={budget.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View>
                  <Text style={styles.budgetTitle}>{budget.title}</Text>
                  <Text style={styles.budgetMeta}>{formatDateRange(budget.start_date, budget.end_date)}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Text style={[styles.budgetStatus, overBudget && styles.budgetStatusAlert]}>
                    {(budget.status ?? 'active').toUpperCase()}
                  </Text>
                  {showActions ? (
                    <Pressable style={styles.cardDeleteButton} onPress={() => void handleRemoveBudget(budget)}>
                      <Text style={styles.cardDeleteLabel}>Excluir</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{formatCurrency(spent, budget.currency)}</Text>
                <Text style={styles.progressMeta}>de {formatCurrency(total, budget.currency)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFillBudget, warn && styles.progressFillAlert, { width }]}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: percentage, min: 0, max: 100 }}
                />
              </View>
              <Text style={styles.progressPercentage}>{percentage}% usado</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderGoalCards = (goals: FinanceGoal[], options?: { enableActions?: boolean }) => {
    if (!goals.length) {
      return <EmptyState title="Crie sua primeira meta" description="Defina uma meta financeira e acompanhe o progresso aqui." />;
    }
    const showActions = options?.enableActions;
    return (
      <View style={styles.goalGrid}>
        {goals.map((goal) => {
          const { target, current, ratio, percentage } = getGoalProgress(goal);
          const width = `${Math.min(100, Math.max(0, percentage))}%`;
          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalName}>{goal.title}</Text>
                  <Text style={styles.goalMeta}>{goal.target_date ? `Até ${formatDate(goal.target_date)}` : 'Sem prazo definido'}</Text>
                </View>
                {showActions ? (
                  <Pressable style={styles.goalDeleteButton} onPress={() => void handleRemoveGoal(goal)}>
                    <Text style={styles.goalDeleteLabel}>Excluir</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{formatCurrency(current, goal.currency)}</Text>
                <Text style={styles.progressMeta}>de {formatCurrency(target, goal.currency)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFillGoal, ratio >= 1 && styles.progressFillGoalDone, { width }]}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: percentage, min: 0, max: 100 }}
                />
              </View>
              <Text style={styles.progressPercentage}>{percentage}% atingido</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOverview = () => (
    <>
      <View style={styles.focusCardWrapper}>
        <FinanceHomeSection
          variant="panel"
          onCreateWallet={() => setWalletComposerVisible(true)}
          onAddTransaction={() => setTransactionComposerVisible(true)}
        />
      </View>
      {renderSummaryCards()}
      {renderActionButtons({ wallet: true, transaction: true })}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Carteiras em destaque</Text>
          {wallets.length ? (
            <Pressable onPress={() => setActiveTab('wallets')}>
              <Text style={styles.sectionLink}>Ver todas</Text>
            </Pressable>
          ) : null}
        </View>
        {renderWalletGrid(recentWallets)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimentações recentes</Text>
          {totalTransactions ? (
            <Pressable onPress={() => setActiveTab('transactions')}>
              <Text style={styles.sectionLink}>Abrir transações</Text>
            </Pressable>
          ) : null}
        </View>
        {renderTransactionItems(recentTransactions)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budgets ativos</Text>
          {orderedBudgets.length ? (
            <Pressable onPress={() => setActiveTab('budgets')}>
              <Text style={styles.sectionLink}>Ver budgets</Text>
            </Pressable>
          ) : null}
        </View>
        {renderBudgetCards(highlightedBudgets)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Metas financeiras</Text>
          {orderedGoals.length ? (
            <Pressable onPress={() => setActiveTab('goals')}>
              <Text style={styles.sectionLink}>Ver metas</Text>
            </Pressable>
          ) : null}
        </View>
        {renderGoalCards(highlightedGoals)}
      </View>
    </>
  );

  const renderWalletsTab = () => (
    <>
      {renderActionButtons({ wallet: true })}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Carteiras</Text>
          <Text style={styles.sectionMeta}>{wallets.length} ativas</Text>
        </View>
        {renderWalletGrid(wallets, { enableActions: true })}
      </View>
    </>
  );

  const renderTransactionsTab = () => (
    <>
      {renderActionButtons({ transaction: true })}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações</Text>
          <Text style={styles.sectionMeta}>
            {filteredTransactions.length} de {totalTransactions}
          </Text>
        </View>
        {selectedWalletName ? (
          <View style={styles.walletFilterBanner}>
            <Text style={styles.walletFilterText}>Filtrando carteira: {selectedWalletName}</Text>
            <Pressable onPress={clearWalletFilter}>
              <Text style={styles.walletFilterClear}>Limpar</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.filterRow}>
          {transactionFilters.map((filter) => {
            const active = transactionFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setTransactionFilter(filter.key)}
              >
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {renderTransactionItems(filteredTransactions, { enableActions: true })}
        {totalTransactions > 15 ? (
          <Pressable style={styles.showAllButton} onPress={() => setShowAllTransactions((prev) => !prev)}>
            <Text style={styles.showAllLabel}>{showAllTransactions ? 'Mostrar menos' : 'Ver todas'}</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  const renderBudgetsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Budgets</Text>
        <Text style={styles.sectionMeta}>{orderedBudgets.length} cadastrados</Text>
      </View>
      {renderBudgetCards(orderedBudgets, { enableActions: true })}
    </View>
  );

  const renderGoalsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Metas</Text>
        <Text style={styles.sectionMeta}>{orderedGoals.length} registradas</Text>
      </View>
      {renderGoalCards(orderedGoals, { enableActions: true })}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wallets':
        return renderWalletsTab();
      case 'transactions':
        return renderTransactionsTab();
      case 'budgets':
        return renderBudgetsTab();
      case 'goals':
        return renderGoalsTab();
      default:
        return renderOverview();
    }
  };

  return (
    <>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.tabBar}>
          {financeTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabButtonLabel, active && styles.tabButtonLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {renderTabContent()}
      </ScrollView>
      <WalletComposer
        visible={walletComposerVisible}
        onClose={closeWalletComposer}
        onSubmit={handleWalletSubmit}
        initialWallet={editingWallet ?? undefined}
      />
      <TransactionComposer
        visible={transactionComposerVisible}
        wallets={wallets}
        onClose={closeTransactionComposer}
        onSubmit={handleTransactionSubmit}
        initialTransaction={editingTransaction ?? undefined}
      />
    </>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 32
    },
    focusCardWrapper: {
      marginBottom: 24
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 4,
      marginBottom: 24
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 16
    },
    tabButtonActive: {
      backgroundColor: colors.primary
    },
    tabButtonLabel: {
      fontWeight: '600',
      color: colors.textMuted,
      fontSize: 13
    },
    tabButtonLabelActive: {
      color: colors.background
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32
    },
    actionButton: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center'
    },
    actionLabel: {
      fontWeight: '600',
      color: colors.text
    },
    actionPrimary: {
      backgroundColor: colors.accent
    },
    actionSecondary: {
      borderWidth: 1,
      borderColor: colors.border
    },
    actionPrimaryLabel: {
      color: colors.background
    },
    actionPrimaryDisabled: {
      backgroundColor: colors.border
    },
    actionDisabled: {
      opacity: 0.5
    },
    summaryCard: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8
    },
    summaryValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700'
    },
    section: {
      marginBottom: 32
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text
    },
    sectionMeta: {
      color: colors.textMuted,
      fontSize: 13
    },
    sectionLink: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 13
    },
    walletGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    walletCard: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16
    },
    walletCardActive: {
      borderWidth: 1,
      borderColor: colors.primary
    },
    walletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6
    },
    walletActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },
    walletName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text
    },
    walletEditButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: colors.mutedSurface
    },
    walletEditLabel: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600'
    },
    walletDeleteButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: colors.mutedSurface
    },
    walletDeleteLabel: {
      fontSize: 12,
      color: colors.danger,
      fontWeight: '600'
    },
    walletBalance: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
      color: colors.text
    },
    walletMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2
    },
    walletRecent: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6
    },
    walletRecentMuted: {
      fontSize: 12,
      color: colors.border,
      marginTop: 6
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    filterChipLabel: {
      color: colors.text
    },
    filterChipLabelActive: {
      color: colors.background,
      fontWeight: '600'
    },
    walletFilterBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12
    },
    walletFilterText: {
      color: colors.text,
      fontSize: 13,
      flex: 1
    },
    walletFilterClear: {
      color: colors.primary,
      fontWeight: '600'
    },
    transactionList: {
      gap: 8
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border
    },
    transactionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text
    },
    transactionMeta: {
      fontSize: 13,
      color: colors.textMuted
    },
    transactionAmount: {
      fontSize: 15,
      fontWeight: '700'
    },
    transactionRight: {
      alignItems: 'flex-end',
      gap: 6
    },
    income: {
      color: colors.success
    },
    expense: {
      color: colors.danger
    },
    transactionDeleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface
    },
    transactionDeleteLabel: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600'
    },
    showAllButton: {
      alignSelf: 'flex-end',
      marginTop: 12
    },
    showAllLabel: {
      color: colors.primary,
      fontWeight: '600'
    },
    budgetList: {
      gap: 12
    },
    budgetCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12
    },
    budgetTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600'
    },
    budgetMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4
    },
    budgetStatus: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.textMuted
    },
    budgetStatusAlert: {
      color: colors.danger,
      fontWeight: '700'
    },
    cardActions: {
      alignItems: 'flex-end',
      gap: 8
    },
    cardDeleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface
    },
    cardDeleteLabel: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600'
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    progressLabel: {
      color: colors.text,
      fontWeight: '700'
    },
    progressMeta: {
      color: colors.textMuted,
      fontSize: 12
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface,
      overflow: 'hidden'
    },
    progressFillBudget: {
      height: 8,
      backgroundColor: colors.warning,
      width: '0%',
      alignSelf: 'flex-start'
    },
    progressFillAlert: {
      backgroundColor: colors.danger
    },
    progressFillGoal: {
      height: 8,
      backgroundColor: colors.primary,
      width: '0%',
      alignSelf: 'flex-start'
    },
    progressFillGoalDone: {
      backgroundColor: colors.success
    },
    progressPercentage: {
      marginTop: 6,
      color: colors.textMuted,
      fontSize: 12
    },
    goalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    goalCard: {
      flexBasis: '48%',
      flexGrow: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 8
    },
    goalName: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15
    },
    goalMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4
    },
    goalDeleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.mutedSurface
    },
    goalDeleteLabel: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600'
    }
  });
