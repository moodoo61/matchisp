'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  createRegion,
  deleteRegion,
  listRegions,
  updateRegion,
} from '@/features/partners/api';
import { LocationMapModal } from '@/features/partners/components/LocationMapModal';
import type { MapCoords } from '@/features/partners/components/MapLocationPicker';
import type { Region, RegionInput } from '@/features/partners/types';
import { agentMapsUrl } from '@/features/partners/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  DataTable,
  IconButton,
  IconEdit,
  IconPlus,
  IconTrash,
  Modal,
  TaskCard,
  notifyMutation,
  useToast,
  type Column,
} from '@/shared/ui';

type ModalState = Region | 'new' | null;

const EMPTY: RegionInput = {
  name: '',
  sortOrder: 0,
  latitude: null,
  longitude: null,
};

export function RegionsCard() {
  const toast = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PARTNERS_READ);
  const canCreate = can(PERMISSIONS.PARTNERS_CREATE);
  const canUpdate = can(PERMISSIONS.PARTNERS_UPDATE);
  const canDelete = can(PERMISSIONS.PARTNERS_DELETE);

  const [items, setItems] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<RegionInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  async function reload() {
    try {
      setItems(await listRegions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!modal) return;
    setFormError(null);
    setMapOpen(false);
    if (modal === 'new') {
      setForm({ ...EMPTY });
      return;
    }
    setForm({
      name: modal.name,
      sortOrder: modal.sortOrder,
      latitude: modal.latitude,
      longitude: modal.longitude,
    });
  }, [modal]);

  async function submit() {
    setBusy(true);
    setFormError(null);
    try {
      if (modal === 'new') {
        await notifyMutation(toast, () => createRegion(form), {
          success: 'تمت إضافة المنطقة',
        });
      } else if (modal) {
        await notifyMutation(
          toast,
          () => updateRegion(modal.id, form),
          { success: 'تم تعديل المنطقة' },
        );
      }
      setModal(null);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'خطأ');
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) return null;

  const hasFormLocation =
    typeof form.latitude === 'number' && typeof form.longitude === 'number';

  const formValue: MapCoords | null = hasFormLocation
    ? { latitude: form.latitude!, longitude: form.longitude! }
    : null;

  const columns: Column<Region>[] = [
    { key: 'name', header: 'المنطقة', render: (r) => r.name },
    {
      key: 'location',
      header: 'الموقع',
      render: (r) =>
        r.latitude != null && r.longitude != null ? (
          <a
            href={agentMapsUrl(r.latitude, r.longitude)}
            target="_blank"
            rel="noreferrer"
          >
            محدّد
          </a>
        ) : (
          <span className="muted">—</span>
        ),
    },
    { key: 'order', header: 'الترتيب', render: (r) => r.sortOrder },
  ];

  if (canUpdate || canDelete) {
    columns.push({
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="row-actions">
          {canUpdate ? (
            <IconButton label="تعديل" onClick={() => setModal(row)}>
              <IconEdit />
            </IconButton>
          ) : null}
          {canDelete && row.name !== 'أخرى' ? (
            <IconButton
              label="حذف"
              tone="danger"
              onClick={() => {
                if (
                  !confirm(
                    `حذف المنطقة «${row.name}»؟ سيتم نقل وكلائها إلى «أخرى».`,
                  )
                ) {
                  return;
                }
                void (async () => {
                  try {
                    await notifyMutation(
                      toast,
                      () => deleteRegion(row.id),
                      { success: 'تم حذف المنطقة' },
                    );
                    await reload();
                  } catch {
                    /* toast */
                  }
                })();
              }}
            >
              <IconTrash />
            </IconButton>
          ) : null}
        </div>
      ),
    });
  }

  return (
    <>
      <TaskCard
        title="المناطق"
        actions={
          canCreate ? (
            <IconButton label="إضافة" onClick={() => setModal('new')}>
              <IconPlus />
            </IconButton>
          ) : null
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {items.length ? (
          <DataTable columns={columns} rows={items} rowKey={(r) => r.id} />
        ) : (
          <p className="muted">لا توجد مناطق بعد.</p>
        )}
      </TaskCard>

      <Modal
        open={!!modal}
        title={modal === 'new' ? 'إضافة منطقة' : 'تعديل منطقة'}
        onClose={() => setModal(null)}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={() => setModal(null)}
            >
              إلغاء
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || !form.name.trim()}
              onClick={() => void submit()}
            >
              حفظ
            </button>
          </div>
        }
      >
        <div className="form">
          {formError ? <p className="error">{formError}</p> : null}
          <label>
            اسم المنطقة
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={1}
            />
          </label>
          <label>
            الترتيب
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  sortOrder: Number(e.target.value) || 0,
                })
              }
            />
          </label>

          <div className="form-field-block">
            <div className="toolbar" style={{ marginBottom: 0, gap: '0.5rem' }}>
              <span>الموقع الجغرافي</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => setMapOpen(true)}
                >
                  {hasFormLocation ? 'تعديل على الخريطة' : 'فتح الخريطة'}
                </button>
                {hasFormLocation ? (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        latitude: null,
                        longitude: null,
                      })
                    }
                  >
                    مسح الموقع
                  </button>
                ) : null}
              </div>
            </div>
            {hasFormLocation ? (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                {form.latitude!.toFixed(6)} ، {form.longitude!.toFixed(6)}
                {' · '}
                <a
                  href={agentMapsUrl(form.latitude!, form.longitude!)}
                  target="_blank"
                  rel="noreferrer"
                >
                  فتح في Google Maps
                </a>
              </p>
            ) : (
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                حدّد مركز المنطقة على الخريطة ليُستخدم عند اختيار مواقع
                الوكلاء.
              </p>
            )}
          </div>
        </div>
      </Modal>

      <LocationMapModal
        open={mapOpen}
        title={
          form.name.trim()
            ? `موقع المنطقة — ${form.name.trim()}`
            : 'تحديد موقع المنطقة'
        }
        center={formValue}
        value={formValue}
        onClose={() => setMapOpen(false)}
        onConfirm={(coords) =>
          setForm({
            ...form,
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        }
      />
    </>
  );
}
