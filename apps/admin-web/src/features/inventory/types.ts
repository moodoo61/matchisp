export type UserBrief = {
  id: string;
  name: string;
  username: string;
};

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  kind: string;
  unit: string;
  minQty: number;
  notes: string;
  active: boolean;
  quantity: number;
  devicesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DeviceUnit = {
  id: string;
  itemId: string;
  serial: string;
  status: string;
  holderUserId: string | null;
  workOrderId: string | null;
  installedAssetId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  item: { id: string; code: string; name: string; kind: string };
  holder: UserBrief | null;
};

export type StockDocumentLine = {
  id: string;
  itemId: string;
  quantity: number;
  deviceUnitId: string | null;
  serial: string | null;
  note: string;
  item: InventoryItem | { id: string; code: string; name: string; kind: string };
  deviceUnit: { id: string; serial: string; status: string } | null;
};

export type StockDocument = {
  id: string;
  number: number;
  type: string;
  status: string;
  note: string;
  issuedToUserId: string | null;
  workOrderId: string | null;
  partsRequestId: string | null;
  postedAt: string | null;
  createdAt: string;
  lines: StockDocumentLine[];
  createdBy: UserBrief | null;
  postedBy: UserBrief | null;
  issuedTo: UserBrief | null;
};

export type StockMovement = {
  id: string;
  type: string;
  delta: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  item: { id: string; code: string; name: string; kind: string };
  deviceUnit: { id: string; serial: string; status: string } | null;
  document: { id: string; number: number; type: string; status: string } | null;
  actor: UserBrief | null;
};

export type InventorySummary = {
  warehouse: { id: string; name: string };
  activeItems: number;
  totalQuantity: number;
  devicesInStock: number;
  devicesIssued: number;
  devicesInstalled: number;
  lowStockCount: number;
  lowStock: Array<{
    itemId: string;
    code: string;
    name: string;
    quantity: number;
    minQty: number;
  }>;
  recentDocuments: Array<{
    id: string;
    number: number;
    type: string;
    status: string;
    createdAt: string;
    postedAt: string | null;
  }>;
};

export const ITEM_KIND_LABELS: Record<string, string> = {
  consumable: 'استهلاكي',
  serialized: 'جهاز متسلسل',
};

export const DEVICE_STATUS_LABELS: Record<string, string> = {
  in_stock: 'في المخزن',
  issued: 'مصروف',
  installed: 'مركّب',
  faulty: 'تالف',
  scrapped: 'مستبعد',
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  receipt: 'توريد',
  issue: 'صرف',
  return: 'إرجاع',
  adjustment: 'تعديل',
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  posted: 'معتمد',
  cancelled: 'ملغى',
};

export function formatDt(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ar-IQ');
}
