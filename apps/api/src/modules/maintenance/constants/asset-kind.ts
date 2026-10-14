export const ASSET_KINDS = [
  'subscriber',
  'device',
  'site',
  'address',
  'other',
] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  subscriber: 'مشترك',
  device: 'جهاز',
  site: 'موقع',
  address: 'عنوان',
  other: 'أخرى',
};
