'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@isp/shared';
import {
  listViewingPageChannels,
  setViewingChannelVisibility,
} from '@/features/live/client_live/api';
import type { ViewingPageChannelsResponse } from '@/features/live/client_live/types';
import { usePermissions } from '@/lib/usePermissions';
import {
  CardEnableToggle,
  TaskCard,
  notifyMutation,
  useToast,
} from '@/shared/ui';

function onlineLabel(online: 0 | 1 | 2 | null, active: boolean) {
  if (active || online === 1) return 'مباشر';
  if (online === 2) return 'متوقف';
  if (online === 0) return 'خطأ';
  return '—';
}

/** قنوات صفحة المشاهدة: تجميع حسب القسم + إظهار/إخفاء + رابط HLS */
export function ViewingChannelsCard() {
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.LIVE_VIEWING_PAGE_READ);
  const canToggle = can(PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE);
  const toast = useToast();
  const [data, setData] = useState<ViewingPageChannelsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await listViewingPageChannels();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب القنوات');
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void reload();
  }, [canRead, reload]);

  const toggleVisible = async (id: string, visible: boolean) => {
    if (!canToggle) return;
    setBusyId(id);
    try {
      await notifyMutation(
        toast,
        () => setViewingChannelVisibility(id, visible),
        {
          success: visible
            ? 'تم إظهار القناة للعملاء'
            : 'تم إخفاء القناة عن العملاء',
        },
      );
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            channels: section.channels.map((channel) =>
              channel.id === id ? { ...channel, visible } : channel,
            ),
          })),
        };
      });
    } catch {
      /* toast */
    } finally {
      setBusyId(null);
    }
  };

  if (!canRead) return null;

  return (
    <TaskCard title="قنوات صفحة المشاهدة">
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p className="muted">جاري التحميل…</p> : null}
      {data ? (
        <div className="viewing-channels">
          <p className="muted viewing-channels-base">
            قاعدة المشاهدة: <code>{data.httpBase}</code>
            {/127\.0\.0\.1|localhost/i.test(data.httpBase) ? (
              <span className="error">
                {' '}
                — عنوان محلي؛ المتصفح لن يصل للبث. عيّن MISTSERVER_HTTP_URL إلى
                IP/نطاق عام.
              </span>
            ) : null}
          </p>
          {data.sections.length === 0 ? (
            <p className="muted">لا توجد أقسام أو قنوات بعد</p>
          ) : null}
          {data.sections.map((section) => (
            <section key={section.id} className="viewing-channels-section">
              <h3>{section.label}</h3>
              {section.channels.length === 0 ? (
                <p className="muted">لا قنوات في هذا القسم</p>
              ) : (
                <div className="viewing-channels-list">
                  {section.channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={
                        channel.visible && channel.isActive
                          ? 'viewing-channels-row field-row'
                          : 'viewing-channels-row field-row is-disabled'
                      }
                    >
                      <div className="viewing-channels-meta">
                        <strong>{channel.label}</strong>
                        <small>
                          {channel.name} ·{' '}
                          {onlineLabel(channel.online, channel.active)}
                          {!channel.isActive ? ' · غير مفعّلة' : ''}
                        </small>
                        <code className="viewing-channels-url" title={channel.playback.hlsUrl}>
                          {channel.playback.hlsUrl}
                        </code>
                      </div>
                      {canToggle ? (
                        <CardEnableToggle
                          enabled={channel.visible}
                          busy={busyId === channel.id}
                          onToggle={() =>
                            void toggleVisible(channel.id, !channel.visible)
                          }
                        />
                      ) : (
                        <span className="muted">
                          {channel.visible ? 'ظاهرة' : 'مخفية'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
          {!canToggle ? (
            <p className="muted">عرض فقط — لا صلاحية تعديل</p>
          ) : null}
        </div>
      ) : null}
    </TaskCard>
  );
}
