export const toNumber = (value: unknown) => {
  const num = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(num)) return null;
  return num;
};

export const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);
