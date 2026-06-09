export const CATEGORIES = [
  'Zelenina a ovocie',
  'Mliečne výrobky',
  'Mäso a údeniny',
  'Pekárenské výrobky',
  'Trvanlivé potraviny',
  'Nápoje',
  'Domácnosť',
  'Ostatné',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DEFAULT_CATEGORY: Category = 'Ostatné';

export function normalizeCategory(value?: string | null): Category {
  if (!value) return DEFAULT_CATEGORY;
  const match = CATEGORIES.find(
    (c) => c.toLowerCase() === value.toLowerCase() || c === value
  );
  return match ?? DEFAULT_CATEGORY;
}

export function sortCategories(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const order = CATEGORIES.indexOf(a as Category) - CATEGORIES.indexOf(b as Category);
    if (order !== 0) return order;
    return a.localeCompare(b, 'sk');
  });
}