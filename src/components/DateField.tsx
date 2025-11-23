import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '@/theme/colors';
import { useColors } from '@/theme/ThemeProvider';

interface Props {
  value?: string;
  placeholder: string;
  mode: 'date' | 'time';
  onChange(value: string): void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  minimumDate?: Date;
}

const formatDisplay = (value: string | undefined, mode: Props['mode']) => {
  if (!value) return null;
  if (mode === 'time') return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, 'dd/MM/yyyy');
};

const parseInitial = (value: string | undefined, mode: Props['mode']) => {
  if (value) {
    if (mode === 'time') {
      const [hour, minute] = value.split(':').map((part) => Number(part));
      const base = new Date();
      if (!Number.isNaN(hour)) base.setHours(hour);
      if (!Number.isNaN(minute)) base.setMinutes(minute);
      base.setSeconds(0);
      base.setMilliseconds(0);
      return base;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

export const DateField = ({ value, placeholder, mode, onChange, label, style, minimumDate }: Props) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const isWeb = Platform.OS === 'web';
  const webInputStyle = useMemo(() => buildWebInputStyle(colors), [colors]);

  const displayValue = formatDisplay(value, mode);
  const showPicker = () => {
    if (isWeb) {
      return;
    }
    setVisible(true);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (isWeb) return;
    if (Platform.OS !== 'ios') {
      setVisible(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    const nextValue = mode === 'time' ? format(selected, 'HH:mm') : format(selected, 'yyyy-MM-dd');
    onChange(nextValue);
    if (Platform.OS === 'ios') {
      setVisible(false);
    }
  };

  if (isWeb) {
    const webValue = value ? (mode === 'time' ? value : value.slice(0, 10)) : '';
    const minValue = minimumDate && mode === 'date' ? format(minimumDate, 'yyyy-MM-dd') : undefined;

    return (
      <View style={[styles.field, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <input
          type={mode === 'time' ? 'time' : 'date'}
          value={webValue}
          min={minValue}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={webInputStyle}
        />
      </View>
    );
  }

  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={showPicker}>
        <Text style={displayValue ? styles.value : styles.placeholder}>{displayValue ?? placeholder}</Text>
      </Pressable>
      {visible ? (
        <DateTimePicker
          value={parseInitial(value, mode)}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    field: {
      width: '100%',
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '100%'
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 4,
      textTransform: 'uppercase'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      width: '100%'
    },
    placeholder: {
      color: colors.textMuted
    },
    value: {
      color: colors.text,
      fontWeight: '600'
    }
  });

const buildWebInputStyle = (colors: Palette): CSSProperties => ({
  width: '100%',
  minWidth: 0,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: colors.border,
  borderRadius: 16,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 600,
  color: colors.text,
  backgroundColor: 'transparent',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  cursor: 'pointer'
});
