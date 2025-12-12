const randomChunk = () => Math.random().toString(36).slice(2, 10);

type MaybeCrypto = {
  randomUUID?: () => string;
};

export const generateFinanceId = (prefix: string): string => {
  const nativeCrypto: MaybeCrypto | undefined =
    typeof globalThis !== 'undefined' && typeof (globalThis as { crypto?: MaybeCrypto }).crypto !== 'undefined'
      ? ((globalThis as { crypto?: MaybeCrypto }).crypto as MaybeCrypto)
      : undefined;
  if (nativeCrypto?.randomUUID) {
    try {
      return `${prefix}-${nativeCrypto.randomUUID()}`;
    } catch (error) {
      // Fallback abaixo
    }
  }
  return `${prefix}-${Date.now().toString(36)}-${randomChunk()}`;
};

export const toIsoDateTime = (value: Date): string => value.toISOString();
