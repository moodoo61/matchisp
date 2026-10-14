export const ITEM_KINDS = ['consumable', 'serialized'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  consumable: 'استهلاكي (كمية)',
  serialized: 'جهاز متسلسل',
};
