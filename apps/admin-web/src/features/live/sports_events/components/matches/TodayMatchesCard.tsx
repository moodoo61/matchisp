'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { listTodayMatches } from '@/features/live/sports_events/api';
import type { SportMatch } from '@/features/live/sports_events/types';
import { usePermissions } from '@/lib/usePermissions';
import { IconButton, IconPlus, TaskCard } from '@/shared/ui';
import { MatchModal, type MatchModalState } from './MatchModal';
import { MatchesTable } from './MatchesTable';

export function TodayMatchesCard() {
  const [items, setItems] = useState<SportMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<MatchModalState>(null);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_SPORTS_EVENTS_READ);
  const canCreate = can(PERMISSIONS.LIVE_SPORTS_EVENTS_CREATE);
  const canUpdate = can(PERMISSIONS.LIVE_SPORTS_EVENTS_UPDATE);
  const canDelete = can(PERMISSIONS.LIVE_SPORTS_EVENTS_DELETE);

  async function reload() {
    try {
      setItems(await listTodayMatches());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (!canRead) return null;

  return (
    <>
      <TaskCard
        title="أحداث اليوم"
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
          <MatchesTable
            matches={items}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={setModal}
            onChanged={reload}
          />
        ) : (
          <p className="muted">لا توجد مباريات لهذا اليوم.</p>
        )}
      </TaskCard>
      {canCreate || canUpdate ? (
        <MatchModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
