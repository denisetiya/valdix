export const typeOf = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

export const hasOwn = <TKey extends string | number | symbol>(
  obj: Record<string, unknown>,
  key: TKey
): key is TKey => Object.prototype.hasOwnProperty.call(obj, key);
