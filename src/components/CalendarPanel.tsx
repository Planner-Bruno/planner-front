import { addMonths, format, subMonths } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { CalendarMark, ScheduleEvent } from '@/types/planner';
import type { CalendarDay, AgendaBucket } from '@/utils/plannerUtils';
import { extractDayKey } from '@/utils/plannerUtils';
import type { Palette } from '@/theme/colors';
import { useThemedStyles } from '@/theme/useThemedStyles';

interface Props {
  matrix: CalendarDay[][];
  selected: string;
  agenda: AgendaBucket;
  onSelect(dateIso: string): void;
  onDoublePress(dateIso: string): void;
  onAddReminder(dateIso: string): void;
  onAddMark(dateIso: string): void;
  onEditEvent(entry: ScheduleEvent): void;
  onDeleteEvent(entry: ScheduleEvent): void;
  onEditMark(mark: CalendarMark): void;
  onDeleteMark(mark: CalendarMark): void;
}

export const CalendarPanel = ({
  matrix,
  selected,
  agenda,
  onSelect,
  onDoublePress,
  onAddReminder,
  onAddMark,
  onEditEvent,
  onDeleteEvent,
  onEditMark,
  onDeleteMark
}: Props) => {
  const styles = useThemedStyles((palette: Palette) => createStyles(palette));
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1180;
  const normalizedSelected = extractDayKey(selected);
  const dayLabelDate = new Date(`${normalizedSelected}T12:00:00`);
  const dayLabel = format(dayLabelDate, "dd 'de' MMMM", { locale: ptBR });
  const monthCursor = dayLabelDate;
  const tapState = useRef({ time: 0, date: '' });
  const DOUBLE_TAP_DELAY = 350;

  const handlePress = (dayKey: string) => {
    const now = Date.now();
    if (tapState.current.date === dayKey && now - tapState.current.time < DOUBLE_TAP_DELAY) {
      onDoublePress(dayKey);
    } else {
      onSelect(dayKey);
    }
    tapState.current = { time: now, date: dayKey };
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const nextDate = direction === 'prev' ? subMonths(monthCursor, 1) : addMonths(monthCursor, 1);
    const nextKey = format(nextDate, 'yyyy-MM-dd');
    onSelect(nextKey);
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarHeader}>
        <View>
          <Text style={styles.monthEyebrow}>calendário</Text>
          <Text style={styles.monthTitle}>{format(monthCursor, "MMMM yyyy", { locale: ptBR })}</Text>
        </View>
        <View style={styles.monthActions}>
          <Pressable style={styles.monthButton} onPress={() => handleMonthChange('prev')}>
            <Text style={styles.monthButtonLabel}>{'<'}</Text>
          </Pressable>
          <Pressable style={styles.monthButton} onPress={() => handleMonthChange('next')}>
            <Text style={styles.monthButtonLabel}>{'>'}</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.calendarBody, isWideLayout && styles.calendarBodyWide]}>
        <View style={[styles.gridWrapper, isWideLayout && styles.gridWrapperWide]}>
          <View style={styles.grid}>
            {matrix.map((week, index) => (
              <View key={`week-${index}`} style={styles.weekRow}>
            {week.map((day) => {
              const dayKey = format(day.date, 'yyyy-MM-dd');
              const isSelected = selected === dayKey;
              const isVisible = day.isCurrentMonth;
              if (!isVisible) {
                return <View key={`placeholder-${dayKey}`} style={styles.dayPlaceholder} />;
              }
              return (
                <Pressable
                  key={dayKey}
                  style={[styles.dayCell, !day.isCurrentMonth && styles.dayMuted, isSelected && styles.daySelected]}
                  onPress={() => handlePress(dayKey)}
                  onLongPress={() => onAddMark(dayKey)}
                >
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{day.label}</Text>
                    {day.marks.length ? <View style={[styles.markBadge, { backgroundColor: day.marks[0].color }]} /> : null}
                  </View>
                  <View style={styles.dotRow}>
                    {day.events.slice(0, 2).map((event) => (
                      <View key={event.id} style={[styles.dot, { backgroundColor: event.color }]} />
                    ))}
                    {day.reminders.slice(0, 1).map((reminder) => (
                      <View key={reminder.id} style={[styles.dot, { backgroundColor: reminder.color }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.scheduleCard, isWideLayout && styles.scheduleCardWide]}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>Agenda de {dayLabel}</Text>
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionChip} onPress={() => onAddMark(selected)}>
              <Text style={styles.actionLabel}>Marcar dia</Text>
            </Pressable>
            <Pressable style={[styles.actionChip, styles.primaryAction]} onPress={() => onAddReminder(selected)}>
              <Text style={styles.primaryLabel}>Novo lembrete</Text>
            </Pressable>
          </View>
          </View>
          <ScrollView style={[styles.eventsScroll, isWideLayout && styles.eventsScrollClamped]}>
          {agenda.events.length ? (
            agenda.events.map((event) => (
              <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}> 
                <View>
                  <View style={styles.eventTitleRow}>
                    <View style={[styles.eventColorDot, { backgroundColor: event.color }]} />
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                  {event.description ? <Text style={styles.eventDescription}>{event.description}</Text> : null}
                </View>
                <View>
                  <Text style={styles.eventTime}>{event.start ? `${event.start}${event.end ? ` · ${event.end}` : ''}` : 'dia inteiro'}</Text>
                  <View style={styles.entryActions}>
                    <Pressable style={styles.entryChip} onPress={() => onEditEvent(event)}>
                      <Text style={styles.entryLabel}>Editar</Text>
                    </Pressable>
                    <Pressable style={[styles.entryChip, styles.entryDelete]} onPress={() => onDeleteEvent(event)}>
                      <Text style={[styles.entryLabel, styles.entryDeleteLabel]}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Nenhum compromisso fixo</Text>
          )}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Lembretes</Text>
          </View>
          {agenda.reminders.length ? (
            agenda.reminders.map((reminder) => (
              <View key={reminder.id} style={[styles.reminderCard, { borderLeftColor: reminder.color }]}> 
                <View>
                  <View style={styles.reminderTitleRow}>
                    <View style={[styles.reminderColorDot, { backgroundColor: reminder.color }]} />
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  </View>
                  {reminder.reminderNote ? <Text style={styles.reminderDescription}>{reminder.reminderNote}</Text> : null}
                </View>
                <View>
                  <Text style={styles.reminderTime}>{reminder.start ?? 'livre'}</Text>
                  <View style={styles.entryActions}>
                    <Pressable style={styles.entryChip} onPress={() => onEditEvent(reminder)}>
                      <Text style={styles.entryLabel}>Editar</Text>
                    </Pressable>
                    <Pressable style={[styles.entryChip, styles.entryDelete]} onPress={() => onDeleteEvent(reminder)}>
                      <Text style={[styles.entryLabel, styles.entryDeleteLabel]}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Sem lembretes para hoje</Text>
          )}
          {agenda.marks.length ? (
            <View style={styles.marksColumn}>
              <Text style={styles.sectionLabel}>Marcações</Text>
              {agenda.marks.map((mark) => (
                <View key={mark.id} style={[styles.markCard, { borderColor: mark.color }]}> 
                  <View style={styles.markHeader}>
                    <View style={[styles.markDot, { backgroundColor: mark.color }]} />
                    <Text style={styles.markLabel}>{mark.label}</Text>
                  </View>
                  <View style={styles.entryActions}>
                    <Pressable style={styles.entryChip} onPress={() => onEditMark(mark)}>
                      <Text style={styles.entryLabel}>Editar</Text>
                    </Pressable>
                    <Pressable style={[styles.entryChip, styles.entryDelete]} onPress={() => onDeleteMark(mark)}>
                      <Text style={[styles.entryLabel, styles.entryDeleteLabel]}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    monthEyebrow: {
      color: colors.textMuted,
      textTransform: 'uppercase',
      fontSize: 10,
      letterSpacing: 2
    },
    monthTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 20
    },
    monthActions: {
      flexDirection: 'row',
      gap: 8
    },
    monthButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    monthButtonLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700'
    },
    calendarBody: {
      flexDirection: 'column',
      gap: 24
    },
    calendarBodyWide: {
      flexDirection: 'row',
      alignItems: 'flex-start'
    },
    gridWrapper: {
      width: '100%'
    },
    gridWrapperWide: {
      flexBasis: 420,
      flexGrow: 0,
      maxWidth: 460
    },
    grid: {
      gap: 8
    },
    weekRow: {
      flexDirection: 'row',
      gap: 8,
      flex: 1
    },
    dayPlaceholder: {
      flex: 1,
      aspectRatio: 1,
      opacity: 0
    },
    dayCell: {
      flex: 1,
      aspectRatio: 0.85,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      justifyContent: 'space-between',
      overflow: 'hidden',
      minHeight: 68,
      backgroundColor: colors.background
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    markBadge: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    dayMuted: {
      opacity: 0.35
    },
    daySelected: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10
    },
    dayLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    dayLabelSelected: {
      color: colors.primary
    },
    dotRow: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap'
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    scheduleCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12
    },
    scheduleCardWide: {
      flex: 1,
      minWidth: 320
    },
    eventsHeader: {
      gap: 12
    },
    eventsScroll: {
      flexGrow: 1
    },
    eventsScrollClamped: {
      maxHeight: 260
    },
    eventsTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16
    },
    entryActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8
    },
    entryChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 4
    },
    entryLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    entryDelete: {
      borderColor: colors.danger
    },
    entryDeleteLabel: {
      color: colors.danger
    },
    actionChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 6
    },
    primaryAction: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    primaryLabel: {
      color: colors.background,
      fontWeight: '600'
    },
    actionLabel: {
      color: colors.text,
      fontWeight: '600'
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap'
    },
    eventCard: {
      backgroundColor: colors.mutedSurface,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      marginBottom: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12
    },
    eventTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    eventColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    eventTitle: {
      color: colors.text,
      fontWeight: '600'
    },
    eventDescription: {
      color: colors.textMuted,
      fontSize: 12
    },
    eventTime: {
      color: colors.textMuted,
      fontSize: 12
    },
    sectionDivider: {
      paddingVertical: 8
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase'
    },
    reminderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      padding: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 12
    },
    reminderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    reminderColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    reminderTitle: {
      color: colors.text,
      fontWeight: '600'
    },
    reminderDescription: {
      color: colors.textMuted,
      fontSize: 12
    },
    reminderTime: {
      color: colors.textMuted
    },
    marksColumn: {
      gap: 8,
      marginTop: 8
    },
    markCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
      gap: 8
    },
    markHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    markDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    markLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    empty: {
      color: colors.textMuted,
      marginBottom: 12
    }
  });
