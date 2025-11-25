import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, StyleProp, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CalendarMark, Goal, PlannerNote, ScheduleEvent, ScheduleEventKind } from '@/types/planner';
import type { Task, TaskSubtask } from '@/types/task';
import { CalendarPanel } from '@/components/CalendarPanel';
import { EmptyState } from '@/components/EmptyState';
import { EventComposer } from '@/components/EventComposer';
import { FilterBar } from '@/components/FilterBar';
import { FloatingButton } from '@/components/FloatingButton';
import { GoalCard } from '@/components/GoalCard';
import { GoalComposer } from '@/components/GoalComposer';
import { NoteCard } from '@/components/NoteCard';
import { NoteComposer } from '@/components/NoteComposer';
import { MarkComposer } from '@/components/MarkComposer';
import { SectionTabs } from '@/components/SectionTabs';
import { SectionMenu } from '@/components/SectionMenu';
import { StatsStrip } from '@/components/StatsStrip';
import { TaskCard } from '@/components/TaskCard';
import { TaskComposer } from '@/components/TaskComposer';
import { InsightsPanel } from '@/components/InsightsPanel';
import { usePlannerStore } from '@/state/usePlannerStore';
import { useInsights } from '@/state/useInsights';
import { useAuth } from '@/state/AuthContext';
import type { Palette } from '@/theme/colors';
import { useColors, useThemeMode } from '@/theme/ThemeProvider';
import type { PlannerSnapshot } from '@/storage/plannerStorage';
import { extractDayKey } from '@/utils/plannerUtils';
import { normalizeDateInput } from '@/utils/dateUtils';
import { makeSubtask } from '@/utils/taskUtils';

const readSnapshotFile = async (asset: DocumentPicker.DocumentPickerAsset): Promise<string> => {
  if (Platform.OS === 'web') {
    if (asset.file) {
      return asset.file.text();
    }
    if (asset.uri) {
      const response = await fetch(asset.uri);
      if (!response.ok) {
        throw new Error('Falha ao acessar o arquivo selecionado.');
      }
      return response.text();
    }
    throw new Error('Arquivo inválido.');
  }

  const uri = asset.uri ?? asset.fileCopyUri;
  if (!uri) {
    throw new Error('Arquivo temporário indisponível.');
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
};

type GoalFormPayload = {
  title: string;
  description: string;
  categoryName: string;
  categoryId?: string | null;
  categoryColor?: string | null;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  color: string;
};

type NoteFormPayload = {
  title: string;
  content: string;
  color?: string;
  tags?: string[];
  goalId?: string | null;
};

type TaskFormPayload = {
  title: string;
  description?: string;
  categoryName?: string;
  categoryId?: string | null;
  categoryColor?: string | null;
  priority?: Task['priority'];
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  goalId?: string | null;
  subtasks?: TaskSubtask[] | null;
};

type EventFormPayload = {
  kind: ScheduleEventKind;
  title: string;
  description?: string;
  date: string;
  start?: string;
  end?: string;
  color: string;
  reminderNote?: string;
  linkedGoalId?: string | null;
};

export const HomeScreen = () => {
  const colors = useColors();
  const { mode, toggleTheme } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isDesktopLayout = width >= 1200;
  const noteCellStyle = useMemo(() => {
    if (width >= 1280) return styles.noteCellDesktop;
    if (isWide) return styles.noteCellTablet;
    return styles.noteCellMobile;
  }, [isWide, styles, width]);
  const {
    ready,
    version,
    updatedAt,
    tasks,
    events,
    marks,
    activeSection,
    setSection,
    filteredTasks,
    filter,
    setFilter,
    taskInsights,
    goals,
    calendarMatrix,
    agendaByDate,
    notes,
    categories,
    categoryUsage,
    activeDate,
    setActiveDate,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    advanceTask,
    addGoal,
    updateGoal,
    deleteGoal,
    addEvent,
    updateEvent,
    deleteEvent,
    addMark,
    updateMark,
    removeMark,
    addNote,
    updateNote,
    deleteNote,
    hydrateSnapshot,
    addCategory,
    deleteCategory,
    syncStatus,
    syncNow
  } = usePlannerStore();
  const { user, logout } = useAuth();
  const { data: insightsOverview, loading: insightsLoading, error: insightsError, refresh: refreshInsights } = useInsights();

  const goalsById = useMemo(
    () =>
      goals.reduce<Record<string, Goal>>((acc, goal) => {
        acc[goal.id] = goal;
        return acc;
      }, {}),
    [goals]
  );

  const tasksByGoal = useMemo(
    () =>
      tasks.reduce<Record<string, Task[]>>((acc, task) => {
        const goalId = task.goalId;
        if (!goalId) return acc;
        if (!acc[goalId]) acc[goalId] = [];
        acc[goalId]!.push(task);
        return acc;
      }, {}),
    [tasks]
  );

  const eventsByGoal = useMemo(
    () =>
      events.reduce<Record<string, ScheduleEvent[]>>((acc, event) => {
        const goalId = event.linkedGoalId;
        if (!goalId) return acc;
        if (!acc[goalId]) acc[goalId] = [];
        acc[goalId]!.push(event);
        return acc;
      }, {}),
    [events]
  );

  const notesByGoal = useMemo(
    () =>
      notes.reduce<Record<string, PlannerNote[]>>((acc, note) => {
        const goalId = note.goalId;
        if (!goalId) return acc;
        if (!acc[goalId]) acc[goalId] = [];
        acc[goalId]!.push(note);
        return acc;
      }, {}),
    [notes]
  );

  const [taskComposerVisible, setTaskComposerVisible] = useState(false);
  const [goalComposerVisible, setGoalComposerVisible] = useState(false);
  const [eventComposerVisible, setEventComposerVisible] = useState(false);
  const [noteComposerVisible, setNoteComposerVisible] = useState(false);
  const [markComposerVisible, setMarkComposerVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [editingNote, setEditingNote] = useState<PlannerNote | null>(null);
  const [editingMark, setEditingMark] = useState<CalendarMark | null>(null);
  const [markDate, setMarkDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [eventKind, setEventKind] = useState<ScheduleEventKind>('event');
  const [eventDate, setEventDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const heading = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bom dia';
    if (hours < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const dayKey = extractDayKey(activeDate);
  const agendaForDay = agendaByDate[dayKey] ?? { events: [], reminders: [], marks: [] };

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingWrapper}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Preparando sua central...</Text>
      </SafeAreaView>
    );
  }

  const ensureDayKey = (value: string) => extractDayKey(value);

  const confirmRemoval = async (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const hasWindow = typeof globalThis.window !== 'undefined';
      return hasWindow ? globalThis.window.confirm(`${title}\n\n${message}`) : false;
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
  };

  const buildSnapshot = (): PlannerSnapshot => ({
    version,
    updatedAt,
    tasks,
    goals,
    events,
    marks,
    notes,
    categories
  });

  const isValidSnapshot = (payload: Partial<PlannerSnapshot>): payload is PlannerSnapshot =>
    (typeof payload.version === 'number' || payload.version === undefined) &&
    Array.isArray(payload.tasks) &&
    Array.isArray(payload.goals) &&
    Array.isArray(payload.events) &&
    Array.isArray(payload.marks) &&
    Array.isArray(payload.notes);

  const handleExportBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = JSON.stringify(buildSnapshot(), null, 2);
      const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `planner-backup-${timestamp}.json`;

      if (Platform.OS === 'web') {
        if (typeof document === 'undefined') {
          throw new Error('Ambiente web sem acesso ao documento para salvar.');
        }
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setTimeout(() => {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert('Backup salvo. Verifique sua pasta de downloads.');
          }
        }, 0);
        return;
      }

      if (!baseDir) throw new Error('Diretório local indisponível neste dispositivo.');
      const targetPath = `${baseDir}${fileName}`;
      await FileSystem.writeAsStringAsync(targetPath, payload, {
        encoding: FileSystem.EncodingType.UTF8
      });

      let shared = false;
      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(targetPath, {
            mimeType: 'application/json',
            dialogTitle: 'Compartilhar backup do planner'
          });
          shared = true;
        } catch (shareError) {
          console.warn('Compartilhamento cancelado ou indisponível', shareError);
        }
      }

      Alert.alert(
        'Backup salvo',
        shared
          ? 'Arquivo exportado e pronto para ser enviado para onde preferir.'
          : `Arquivo disponível localmente em:\n${targetPath}`
      );
    } catch (error) {
      Alert.alert('Erro ao salvar', error instanceof Error ? error.message : 'Não foi possível gerar o backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('Arquivo inválido.');
      const contents = await readSnapshotFile(asset);
      const parsed = JSON.parse(contents) as Partial<PlannerSnapshot>;
      if (!isValidSnapshot(parsed)) throw new Error('Formato de backup não reconhecido.');
      hydrateSnapshot(parsed);
      Alert.alert('Importação concluída', 'Seus dados foram restaurados com sucesso.');
    } catch (error) {
      if ((error as Error)?.message?.includes('canceled')) return;
      Alert.alert('Erro ao importar', error instanceof Error ? error.message : 'Não foi possível ler o arquivo selecionado.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleTaskSubmit = (payload: TaskFormPayload, editingId?: Task['id']) => {
    const categoryName = payload.categoryName || 'Sem categoria';
    if (editingId) {
      updateTask(editingId, {
        title: payload.title,
        description: payload.description,
        category: categoryName,
        categoryId: payload.categoryId ?? undefined,
        categoryColor: payload.categoryColor ?? undefined,
        priority: payload.priority,
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
        tags: payload.tags,
        goalId: payload.goalId ?? null,
        subtasks: payload.subtasks ?? null
      });
      setEditingTask(null);
    } else {
      addTask({
        title: payload.title,
        description: payload.description,
        category: categoryName,
        categoryId: payload.categoryId ?? undefined,
        categoryColor: payload.categoryColor ?? undefined,
        priority: payload.priority,
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
        tags: payload.tags ?? [],
        goalId: payload.goalId ?? null,
        subtasks: payload.subtasks ?? null
      });
    }
  };

  const openTaskEditor = (task: Task) => {
    setEditingTask(task);
    setTaskComposerVisible(true);
  };

  const requestDeleteTask = async (task: Task) => {
    if (await confirmRemoval('Excluir tarefa', `Deseja remover "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  const handleToggleSubtask = (taskId: Task['id'], subtaskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task?.subtasks) return;
    const subtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );
    updateTask(taskId, { subtasks });
  };

  const handleAddSubtask = (taskId: Task['id'], title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = tasks.find((item) => item.id === taskId);
    const next = [...(task?.subtasks ?? []), makeSubtask(trimmed)];
    updateTask(taskId, { subtasks: next });
  };

  const handleRemoveSubtask = (taskId: Task['id'], subtaskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task?.subtasks) return;
    const remaining = task.subtasks.filter((subtask) => subtask.id !== subtaskId);
    updateTask(taskId, { subtasks: remaining.length ? remaining : null });
  };

  const handleGoalSubmit = (payload: GoalFormPayload, editingId?: Goal['id']) => {
    const categoryName = payload.categoryName || 'Sem categoria';
    const normalizedStartDate = normalizeDateInput(payload.startDate) ?? undefined;
    const normalizedDueDate = normalizeDateInput(payload.dueDate) ?? undefined;
    if (editingId) {
      const goal = goals.find((item) => item.id === editingId);
      if (!goal) return;
      updateGoal({
        ...goal,
        title: payload.title,
        description: payload.description,
        category: categoryName,
        categoryId: payload.categoryId ?? undefined,
        categoryColor: payload.categoryColor ?? undefined,
        color: payload.color,
        startDate: normalizedStartDate,
        dueDate: normalizedDueDate,
        tags: payload.tags && payload.tags.length ? payload.tags : undefined
      });
      setEditingGoal(null);
    } else {
      addGoal({
        title: payload.title,
        description: payload.description,
        category: categoryName,
        categoryId: payload.categoryId ?? undefined,
        categoryColor: payload.categoryColor ?? undefined,
        color: payload.color,
        startDate: normalizedStartDate,
        dueDate: normalizedDueDate,
        tags: payload.tags
      });
    }
  };

  const requestDeleteGoal = async (goal: Goal) => {
    if (await confirmRemoval('Excluir objetivo', `Remover "${goal.title}" do planner?`)) {
      deleteGoal(goal.id);
    }
  };

  const handleNoteSubmit = (payload: NoteFormPayload, editingId?: PlannerNote['id']) => {
    if (editingId) {
      const note = notes.find((item) => item.id === editingId);
      if (!note) return;
      updateNote({
        ...note,
        title: payload.title,
        content: payload.content,
        color: payload.color ?? note.color,
        tags: payload.tags ?? note.tags,
        goalId: payload.goalId ?? undefined
      });
      setEditingNote(null);
    } else {
      addNote(payload);
    }
  };

  const requestDeleteNote = async (noteId: string) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    if (await confirmRemoval('Excluir anotação', `Deseja apagar "${note.title || 'Sem título'}"?`)) {
      deleteNote(noteId);
    }
  };

  const handleEventSubmit = (payload: EventFormPayload, editingId?: ScheduleEvent['id']) => {
    const normalizedPayload = { ...payload, linkedGoalId: payload.linkedGoalId ?? undefined };
    if (editingId) {
      const entry = events.find((item) => item.id === editingId);
      if (!entry) return;
      updateEvent({ ...entry, ...normalizedPayload });
      setEditingEvent(null);
    } else {
      addEvent(normalizedPayload);
    }
  };

  const openGoalEditor = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalComposerVisible(true);
  };

  const openNoteEditor = (note?: PlannerNote) => {
    setEditingNote(note ?? null);
    setNoteComposerVisible(true);
  };

  const openEventModal = (kind: ScheduleEventKind, date: string) => {
    setEditingEvent(null);
    setEventKind(kind);
    setEventDate(ensureDayKey(date));
    setEventComposerVisible(true);
  };

  const openEventEditor = (entry: ScheduleEvent) => {
    setEditingEvent(entry);
    setEventKind(entry.kind);
    setEventDate(entry.date.slice(0, 10));
    setEventComposerVisible(true);
  };

  const requestDeleteEvent = async (entry: ScheduleEvent) => {
    if (await confirmRemoval('Excluir registro', `Remover "${entry.title}" da sua agenda?`)) {
      deleteEvent(entry.id);
    }
  };

  const startMarkCreation = (date: string) => {
    setEditingMark(null);
    setMarkDate(ensureDayKey(date));
    setMarkComposerVisible(true);
  };

  const startMarkEdit = (mark: CalendarMark) => {
    setEditingMark(mark);
    setMarkDate(format(new Date(mark.date), 'yyyy-MM-dd'));
    setMarkComposerVisible(true);
  };

  const handleMarkSubmit = (payload: { label: string; color: string }, editingId?: CalendarMark['id']) => {
    if (editingId && editingMark) {
      updateMark({ ...editingMark, label: payload.label.trim(), color: payload.color });
      setEditingMark(null);
    } else {
      addMark({ date: `${markDate}T12:00:00`, ...payload });
    }
  };

  const requestDeleteMark = async (mark: CalendarMark) => {
    if (await confirmRemoval('Excluir marcação', `Remover o destaque "${mark.label}"?`)) {
      removeMark(mark.id);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'tasks':
        return (
          <View style={styles.sectionGap}>
            <StatsStrip insights={taskInsights} />
            <FilterBar filter={filter} onChange={setFilter} />
            <View style={styles.listWrapper}>
              {filteredTasks.length ? (
                filteredTasks.map((task) => {
                  const relatedGoal = task.goalId ? goalsById[task.goalId] : undefined;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id)}
                      onAdvance={() => advanceTask(task.id)}
                      onEdit={() => openTaskEditor(task)}
                      onDelete={() => requestDeleteTask(task)}
                      onToggleSubtask={(subtaskId) => handleToggleSubtask(task.id, subtaskId)}
                      onAddSubtask={(title) => handleAddSubtask(task.id, title)}
                      onRemoveSubtask={(subtaskId) => handleRemoveSubtask(task.id, subtaskId)}
                      goalMeta={relatedGoal ? { title: relatedGoal.title, color: relatedGoal.color } : undefined}
                    />
                  );
                })
              ) : (
                <EmptyState title="Tudo em dia" description="Use o botão neon abaixo para registrar sua próxima tarefa." />
              )}
            </View>
          </View>
        );
      case 'goals':
        return goals.length ? (
          <View style={styles.sectionGap}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                tasks={tasksByGoal[goal.id]}
                events={eventsByGoal[goal.id]}
                notes={notesByGoal[goal.id]}
                onEdit={openGoalEditor}
                onDelete={requestDeleteGoal}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Objetivos vazios"
            description="Construa metas ousadas e acompanhe o progresso em tempo real."
          />
        );
      case 'calendar':
        return (
          <CalendarPanel
            matrix={calendarMatrix}
            selected={dayKey}
            agenda={agendaForDay}
            onSelect={setActiveDate}
            onDoublePress={(iso) => openEventModal('event', iso)}
            onAddReminder={(iso) => openEventModal('reminder', iso)}
            onAddMark={startMarkCreation}
            onEditEvent={openEventEditor}
            onDeleteEvent={requestDeleteEvent}
            onEditMark={startMarkEdit}
            onDeleteMark={requestDeleteMark}
          />
        );
      case 'notes':
        return notes.length ? (
          <View style={styles.notesGrid}>
            {notes.map((note) => (
              <View key={note.id} style={[styles.noteCell, noteCellStyle]}>
                <NoteCard note={note} onEdit={openNoteEditor} onDelete={requestDeleteNote} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Sem anotações" description="Combine ideias, moodboards e insights rápidos nesta aba." />
        );
      case 'insights':
        return (
          <InsightsPanel
            overview={insightsOverview}
            loading={insightsLoading}
            error={insightsError}
            onRefresh={refreshInsights}
          />
        );
      default:
        return null;
    }
  };

  const renderSyncBanner = () => {
    if (!syncStatus) return null;
    const { isOnline, queueSize, syncing, lastSyncAt, lastSyncError, requiresAuth, canRetry } = syncStatus;
    const queueLabel = queueSize === 1 ? '1 alteração pendente' : `${queueSize} alterações pendentes`;
    const formatTimestamp = () => {
      if (!lastSyncAt) return 'Ainda não sincronizado nesta sessão.';
      try {
        return `Última sync ${format(new Date(lastSyncAt), 'dd/MM HH:mm')}`;
      } catch (error) {
        console.warn('Falha ao formatar horário de sync', error);
        return 'Última sync recente.';
      }
    };

    const handleManualSync = () => {
      if (!canRetry) return;
      void syncNow();
    };

    type BannerVariant = 'ghost' | 'accent';

    const renderAction = (label: string, intent: BannerVariant = 'ghost') => {
      if (!canRetry) return null;
      return (
        <Pressable
          accessibilityRole="button"
          style={[styles.syncBannerButton, intent === 'accent' ? styles.syncBannerButtonAccent : styles.syncBannerButtonGhost]}
          onPress={handleManualSync}
        >
          <Text style={[styles.syncBannerButtonText, intent === 'accent' && styles.syncBannerButtonTextAccent]}>{label}</Text>
        </Pressable>
      );
    };

    const buildBanner = (
      accentStyle: StyleProp<ViewStyle>,
      title: string,
      description: string,
      meta?: string,
      action?: { label: string; intent?: BannerVariant }
    ) => (
      <View style={[styles.syncBanner, accentStyle]}>
        <View style={styles.syncBannerRow}>
          <View style={styles.syncBannerBody}>
            <Text style={styles.syncBannerTitle}>{title}</Text>
            <Text style={styles.syncBannerText}>{description}</Text>
            {meta ? <Text style={styles.syncBannerMeta}>{meta}</Text> : null}
          </View>
          {action ? renderAction(action.label, action.intent) : null}
        </View>
      </View>
    );

    if (requiresAuth && queueSize > 0) {
      return buildBanner(
        styles.syncBannerWarning,
        'Entre para sincronizar',
        `Faça login para enviar ${queueLabel} ao servidor.`
      );
    }

    if (!isOnline) {
      return buildBanner(
        styles.syncBannerWarning,
        'Modo offline',
        queueSize ? `${queueLabel} serão enviados quando a conexão voltar.` : 'Suas edições ficam salvas localmente.'
      );
    }

    if (lastSyncError) {
      return buildBanner(
        styles.syncBannerDanger,
        'Sincronização pausada',
        lastSyncError,
        queueSize ? queueLabel : 'Nenhuma alteração pendente.',
        canRetry ? { label: 'Tentar novamente', intent: 'accent' } : undefined
      );
    }

    if (syncing || queueSize > 0) {
      return buildBanner(
        styles.syncBannerInfo,
        syncing ? 'Sincronizando...' : 'Fila pronta para enviar',
        syncing ? `${queueLabel} em processamento.` : `${queueLabel} serão sincronizadas nos próximos instantes.`,
        syncing ? undefined : formatTimestamp(),
        !syncing && canRetry ? { label: 'Sincronizar agora' } : undefined
      );
    }

    return buildBanner(styles.syncBannerSuccess, 'Tudo sincronizado', 'Nenhuma alteração pendente.', formatTimestamp());
  };

  const syncBanner = renderSyncBanner();

  const floatingConfig = {
    tasks: {
      label: 'Nova tarefa',
      action: () => {
        setEditingTask(null);
        setTaskComposerVisible(true);
      }
    },
    goals: { label: 'Novo objetivo', action: () => { setEditingGoal(null); setGoalComposerVisible(true); } },
    calendar: { label: 'Novo evento', action: () => openEventModal('event', dayKey) },
    insights: null,
    notes: { label: 'Nova anotação', action: () => openNoteEditor() }
  } as const;
  const renderActionButtons = (orientation: 'horizontal' | 'vertical') => {
    const isHorizontal = orientation === 'horizontal';
    const containerStyle = isHorizontal ? styles.headerControls : styles.sidebarActions;
    const baseButton = isHorizontal ? styles.themeChip : styles.sidebarButton;
    const secondaryButton = isHorizontal ? styles.secondaryChip : styles.sidebarSecondaryButton;
    const primaryButton = isHorizontal ? styles.primaryChip : styles.sidebarPrimaryButton;
    const disabledStyle = isHorizontal ? styles.themeChipDisabled : styles.sidebarButtonDisabled;

    return (
      <View style={containerStyle}>
        <Pressable style={baseButton} onPress={toggleTheme}>
          <Text style={styles.themeLabel}>{mode === 'dark' ? 'Modo claro' : 'Modo escuro'}</Text>
        </Pressable>
        <Pressable style={[baseButton, styles.logoutChip]} onPress={logout}>
          <Text style={[styles.themeLabel, styles.logoutLabel]}>Sair</Text>
        </Pressable>
        <Pressable
          style={[baseButton, secondaryButton, isImporting && disabledStyle]}
          onPress={handleImportBackup}
          disabled={isImporting}
        >
          <Text style={styles.themeLabel}>{isImporting ? 'Importando...' : 'Importar'}</Text>
        </Pressable>
        <Pressable
          style={[baseButton, primaryButton, isExporting && disabledStyle]}
          onPress={handleExportBackup}
          disabled={isExporting}
        >
          <Text style={[styles.themeLabel, styles.primaryChipLabel]}>{isExporting ? 'Salvando...' : 'Salvar'}</Text>
        </Pressable>
      </View>
    );
  };

  const header = (
    <View style={[styles.header, isDesktopLayout && styles.desktopHeader]}>
      <View style={styles.headerTextBlock}>
        <Text style={styles.eyebrow}>Planner inteligente</Text>
        <Text style={styles.title}>{heading},</Text>
        <Text style={styles.subtitle}>
          bem-vindo {user?.name ? `${user.name}` : ''} à sua central ousada de tarefas.
        </Text>
      </View>
      {!isDesktopLayout && renderActionButtons('horizontal')}
    </View>
  );

  const floatingButton = floatingConfig[activeSection] ? (
    <FloatingButton
      label={floatingConfig[activeSection]!.label}
      onPress={floatingConfig[activeSection]!.action}
    />
  ) : null;

  const modals = (
    <>
      <TaskComposer
        visible={taskComposerVisible}
        initialTask={editingTask ?? undefined}
        goals={goals}
        categories={categories}
        categoryUsage={categoryUsage}
        onCreateCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onClose={() => {
          setTaskComposerVisible(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
      />
      <GoalComposer
        visible={goalComposerVisible}
        onClose={() => {
          setGoalComposerVisible(false);
          setEditingGoal(null);
        }}
        onSubmit={handleGoalSubmit}
        initialGoal={editingGoal ?? undefined}
        categories={categories}
        categoryUsage={categoryUsage}
        onCreateCategory={addCategory}
        onDeleteCategory={deleteCategory}
      />
      <EventComposer
        visible={eventComposerVisible}
        onClose={() => {
          setEventComposerVisible(false);
          setEditingEvent(null);
        }}
        defaultKind={eventKind}
        defaultDate={eventDate}
        initialEvent={editingEvent ?? undefined}
        goals={goals}
        onSubmit={handleEventSubmit}
      />
      <NoteComposer
        visible={noteComposerVisible}
        onClose={() => {
          setNoteComposerVisible(false);
          setEditingNote(null);
        }}
        initialNote={editingNote ?? undefined}
        goals={goals}
        onSubmit={handleNoteSubmit}
      />
      <MarkComposer
        visible={markComposerVisible}
        date={editingMark ? editingMark.date : markDate}
        initialMark={editingMark ?? undefined}
        onClose={() => {
          setMarkComposerVisible(false);
          setEditingMark(null);
        }}
        onSubmit={handleMarkSubmit}
      />
    </>
  );

  if (isDesktopLayout) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.safeAreaDesktop]}>
        <View style={styles.desktopLayout}>
          <View style={styles.sidebar}>
            <View>
              <Text style={styles.sidebarEyebrow}>Planner</Text>
              <Text style={styles.sidebarTitle}>Central produtiva</Text>
              <Text style={styles.sidebarSubtitle}>Acesse tudo sem sair desta janela.</Text>
            </View>
            <SectionMenu value={activeSection} onChange={setSection} />
            {renderActionButtons('vertical')}
          </View>
          <ScrollView
            style={styles.desktopContent}
            contentContainerStyle={styles.desktopContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {header}
            {syncBanner}
            {renderSection()}
          </ScrollView>
        </View>
        {floatingButton}
        {modals}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]} showsVerticalScrollIndicator={false}>
        {header}
        {syncBanner}
        <SectionTabs value={activeSection} onChange={setSection} />
        {renderSection()}
      </ScrollView>

      {floatingButton}
      {modals}
    </SafeAreaView>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background
    },
    safeAreaDesktop: {
      paddingHorizontal: 0
    },
    container: {
      paddingHorizontal: 20,
      paddingBottom: 160
    },
    containerWide: {
      width: '100%',
      maxWidth: 980,
      alignSelf: 'center'
    },
    header: {
      paddingTop: 12,
      paddingBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16
    },
    syncBanner: {
      width: '100%',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.mutedSurface,
      marginBottom: 16
    },
    syncBannerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12
    },
    syncBannerBody: {
      flex: 1,
      gap: 2
    },
    syncBannerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4
    },
    syncBannerText: {
      fontSize: 13,
      color: colors.text
    },
    syncBannerMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6
    },
    syncBannerButton: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1
    },
    syncBannerButtonGhost: {
      borderColor: colors.border
    },
    syncBannerButtonAccent: {
      borderColor: colors.primary,
      backgroundColor: colors.primary
    },
    syncBannerButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text
    },
    syncBannerButtonTextAccent: {
      color: colors.background
    },
    syncBannerWarning: {
      borderColor: colors.warning
    },
    syncBannerDanger: {
      borderColor: colors.danger
    },
    syncBannerSuccess: {
      borderColor: colors.success
    },
    syncBannerInfo: {
      borderColor: colors.primary
    },
    desktopHeader: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 16
    },
    headerTextBlock: {
      flexShrink: 1,
      minWidth: 220,
      maxWidth: 640
    },
    headerControls: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'flex-start'
    },
    eyebrow: {
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 12,
      marginBottom: 8,
      flexShrink: 1
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '700',
      flexShrink: 1
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 4,
      flexShrink: 1,
      lineHeight: 22
    },
    themeChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8
    },
    logoutChip: {
      backgroundColor: 'transparent'
    },
    secondaryChip: {
      backgroundColor: colors.mutedSurface
    },
    primaryChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    themeChipDisabled: {
      opacity: 0.6
    },
    themeLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    primaryChipLabel: {
      color: colors.background
    },
    logoutLabel: {
      color: colors.textMuted
    },
    desktopLayout: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 24
    },
    sidebar: {
      width: 260,
      borderRadius: 24,
      padding: 24,
      backgroundColor: colors.mutedSurface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 20,
      marginTop: 12
    },
    sidebarEyebrow: {
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      marginBottom: 6
    },
    sidebarTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700'
    },
    sidebarSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18
    },
    sidebarActions: {
      marginTop: 'auto',
      gap: 10
    },
    sidebarButton: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      backgroundColor: colors.surface
    },
    sidebarSecondaryButton: {
      backgroundColor: colors.mutedSurface
    },
    sidebarPrimaryButton: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    sidebarButtonDisabled: {
      opacity: 0.5
    },
    desktopContent: {
      flex: 1
    },
    desktopContentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 200
    },
    listWrapper: {
      gap: 16
    },
    sectionGap: {
      gap: 18
    },
    notesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16
    },
    noteCell: {
      flexGrow: 1,
      flexShrink: 1,
      width: '100%'
    },
    noteCellMobile: {
      minWidth: '100%'
    },
    noteCellTablet: {
      flexBasis: '48%',
      minWidth: '48%',
      maxWidth: '48%'
    },
    noteCellDesktop: {
      flexBasis: '31%',
      minWidth: '31%',
      maxWidth: '31%'
    },
    loadingWrapper: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12
    },
    loadingText: {
      color: colors.text
    }
  });
