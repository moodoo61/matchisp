'use client';

import { useEffect, useMemo, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  deleteChannelSection,
  listChannelSections,
  listChannels,
} from '@/features/live/api';
import type { Channel, ChannelSection } from '@/features/live/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  IconButton,
  IconEdit,
  IconPlus,
  IconTrash,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';
import { ChannelModal } from './ChannelModal';
import {
  ChannelSectionModal,
  type ChannelSectionModalState,
} from './ChannelSectionModal';
import { ChannelsTable } from './ChannelsTable';

type SectionGroup = {
  section: ChannelSection;
  channels: Channel[];
};

export function ChannelSectionsCard() {
  const toast = useToast();
  const [sections, setSections] = useState<ChannelSection[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sectionModal, setSectionModal] =
    useState<ChannelSectionModalState>(null);
  const [channelModal, setChannelModal] = useState<Channel | 'new' | null>(
    null,
  );
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_CHANNELS_READ);
  const canCreate = can(PERMISSIONS.LIVE_CHANNELS_CREATE);
  const canUpdate = can(PERMISSIONS.LIVE_CHANNELS_UPDATE);
  const canToggle = can(PERMISSIONS.LIVE_CHANNELS_TOGGLE);
  const canControl = can(PERMISSIONS.LIVE_CHANNELS_CONTROL);
  const canDelete = can(PERMISSIONS.LIVE_CHANNELS_DELETE);

  async function reload() {
    try {
      const [nextSections, nextChannels] = await Promise.all([
        listChannelSections(),
        listChannels(),
      ]);
      setSections(nextSections);
      setChannels(nextChannels);
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

  const groups = useMemo<SectionGroup[]>(() => {
    const byId = new Map(sections.map((s) => [s.id, s]));
    const grouped = new Map<string, Channel[]>();
    for (const channel of channels) {
      const list = grouped.get(channel.sectionId) ?? [];
      list.push(channel);
      grouped.set(channel.sectionId, list);
    }

    const ordered: SectionGroup[] = sections.map((section) => ({
      section,
      channels: grouped.get(section.id) ?? [],
    }));

    // أقسام ظهرت في القنوات فقط (إن وُجدت بيانات يتيمة)
    for (const [sectionId, list] of grouped) {
      if (byId.has(sectionId)) continue;
      const fallback = list[0]?.section;
      ordered.push({
        section: {
          id: sectionId,
          name: fallback?.name ?? sectionId,
          label: fallback?.label ?? 'قسم غير معروف',
          sortOrder: 9999,
          createdAt: '',
          updatedAt: '',
          _count: { channels: list.length },
        },
        channels: list,
      });
    }
    return ordered;
  }, [sections, channels]);

  if (!canRead) return null;

  return (
    <>
      <TaskCard
        title="الأقسام"
        actions={
          <>
            <IconButton label="تحديث" onClick={() => void reload()}>
              ↻
            </IconButton>
            {canCreate ? (
              <IconButton label="إضافة قسم" onClick={() => setSectionModal('new')}>
                <IconPlus />
              </IconButton>
            ) : null}
          </>
        }
      >
        {error ? <p className="error">{error}</p> : null}
        {!groups.length ? (
          <p className="muted">لا توجد أقسام بعد. أضف قسماً للبدء.</p>
        ) : (
          <div className="task-stack">
            {groups.map(({ section, channels: sectionChannels }) => (
              <TaskCard
                key={section.id}
                title={`${section.label} (${section.name})`}
                actions={
                  canUpdate || canDelete ? (
                    <>
                      {canUpdate ? (
                        <IconButton
                          label="تعديل القسم"
                          onClick={() => setSectionModal(section)}
                        >
                          <IconEdit />
                        </IconButton>
                      ) : null}
                      {canDelete ? (
                        <IconButton
                          label="حذف القسم"
                          tone="danger"
                          onClick={async () => {
                            if (
                              !confirm(
                                `حذف القسم «${section.label}»؟\nيجب أن يكون فارغاً من القنوات.`,
                              )
                            ) {
                              return;
                            }
                            try {
                              await notifyMutation(
                                toast,
                                () => deleteChannelSection(section.id),
                                { success: 'تم حذف القسم بنجاح' },
                              );
                              await reload();
                            } catch {
                              // الإشعار عُرض عبر notifyMutation
                            }
                          }}
                        >
                          <IconTrash />
                        </IconButton>
                      ) : null}
                    </>
                  ) : null
                }
              >
                <p className="muted" style={{ marginBottom: '0.75rem' }}>
                  {sectionChannels.length} قناة
                </p>
                <ChannelsTable
                  channels={sectionChannels}
                  canUpdate={canUpdate}
                  canToggle={canToggle}
                  canControl={canControl}
                  canDelete={canDelete}
                  showSection={false}
                  onEdit={setChannelModal}
                  onChanged={reload}
                />
              </TaskCard>
            ))}
          </div>
        )}
      </TaskCard>

      {canCreate || canUpdate ? (
        <ChannelSectionModal
          state={sectionModal}
          onClose={() => setSectionModal(null)}
          onSaved={reload}
        />
      ) : null}
      {canCreate || canUpdate ? (
        <ChannelModal
          state={channelModal}
          onClose={() => setChannelModal(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
