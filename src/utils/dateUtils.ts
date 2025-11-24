const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseDateParts = (value: string) => {
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

/**
 * Receives either a full ISO string or a date-only value (yyyy-MM-dd)
 * and returns a safe ISO string that preserves the chosen day regardless
 * of the device timezone. When only the day is provided we normalize it
 * to the device's midday (12:00 local time) before converting to ISO.
 */
export const normalizeDateInput = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_REGEX.test(trimmed)) {
    const parts = parseDateParts(trimmed);
    if (!parts) return null;
    const safeDate = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
    if (Number.isNaN(safeDate.getTime())) return null;
    return safeDate.toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export const isDateOnlyString = (value: string): boolean => DATE_ONLY_REGEX.test(value);
