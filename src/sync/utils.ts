export const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && asNumber.toString() === value.trim()) {
      const dateFromNumber = new Date(asNumber);
      return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = obj.dateTime ?? obj.time ?? obj.value ?? obj.iso ?? obj.startTime ?? obj.endTime;
    return parseDate(candidate);
  }

  return null;
};

export const toIsoDate = (value: unknown): string | null => {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
};

export const toEpochMs = (value: unknown): number | null => {
  const date = parseDate(value);
  return date ? date.getTime() : null;
};
