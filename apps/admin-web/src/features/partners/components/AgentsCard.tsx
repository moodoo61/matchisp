'use client';

import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import { listAgents } from '@/features/partners/api';
import type { Agent } from '@/features/partners/types';
import { usePermissions } from '@/lib/usePermissions';
import { IconButton, IconPlus, TaskCard } from '@/shared/ui';
import { AgentModal, type AgentModalState } from './AgentModal';
import { AgentsTable } from './AgentsTable';

export function AgentsCard() {
  const [items, setItems] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<AgentModalState>(null);
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.PARTNERS_READ);
  const canCreate = can(PERMISSIONS.PARTNERS_CREATE);
  const canUpdate = can(PERMISSIONS.PARTNERS_UPDATE);
  const canDelete = can(PERMISSIONS.PARTNERS_DELETE);

  async function reload() {
    try {
      setItems(await listAgents());
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
        title="الوكلاء"
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
          <AgentsTable
            agents={items}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={setModal}
            onChanged={reload}
          />
        ) : (
          <p className="muted">لا يوجد وكلاء بعد.</p>
        )}
      </TaskCard>
      {canCreate || canUpdate ? (
        <AgentModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
