/** مقارنة تسميات مع أرقام طبيعية: القناة 2 قبل القناة 11 */
export function compareNaturalLabel(a: string, b: string): number {
  return a.localeCompare(b, 'ar', { numeric: true, sensitivity: 'base' });
}

type Sortable = { sortOrder: number; label: string };

/** ترتيب حسب sortOrder ثم التسمية رقمياً */
export function compareBySortOrderThenLabel(a: Sortable, b: Sortable): number {
  return a.sortOrder - b.sortOrder || compareNaturalLabel(a.label, b.label);
}
