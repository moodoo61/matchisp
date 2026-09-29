'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { listChannels } from '@/features/live/api';
import type { Channel } from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';
import { IconButton, IconPlus, TaskCard } from '@/shared/ui';
import { ChannelModal } from './ChannelModal';
import { ChannelsTable } from './ChannelsTable';

export function ChannelsCard() {
  const [items, setItems] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Channel | 'new' | null>(null);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_CHANNELS_READ);
  const canCreate = can(PERMISSIONS.LIVE_CHANNELS_CREATE);
  const canUpdate = can(PERMISSIONS.LIVE_CHANNELS_UPDATE);
  const canToggle = can(PERMISSIONS.LIVE_CHANNELS_TOGGLE);
  const canControl = can(PERMISSIONS.LIVE_CHANNELS_CONTROL);
  const canDelete = can(PERMISSIONS.LIVE_CHANNELS_DELETE);

  async function reload() {
    try {
      setItems(await listChannels());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 15000);
    return () => window.clearInterval(timer);
  }, []);

  if (!canRead) return null;

  return (
    <>
      <TaskCard
        title="القنوات"
        actions={
          <>
            <IconButton label="تحديث الحالة" onClick={() => void reload()}>
              ↻
            </IconButton>
            {canCreate ? (
              <IconButton label="إضافة" onClick={() => setModal('new')}>
                <IconPlus />
              </IconButton>
            ) : null}
          </>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {items.length ? (
          <ChannelsTable
            channels={items}
            canUpdate={canUpdate}
            canToggle={canToggle}
            canControl={canControl}
            canDelete={canDelete}
            showSection
            onEdit={setModal}
            onChanged={reload}
          />
        ) : (
          <p className="muted">لا توجد قنوات بعد.</p>
        )}
      </TaskCard>
      {canCreate || canUpdate ? (
        <ChannelModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
