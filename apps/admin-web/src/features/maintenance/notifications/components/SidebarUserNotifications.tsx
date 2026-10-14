'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMaintenanceNotificationsUnreadCount,
  listMaintenanceNotifications,
  markAllMaintenanceNotificationsRead,
  markMaintenanceNotificationRead,
} from '@/features/maintenance/api';
import {
  AUTH_USER_CHANGED_EVENT,
  getAuthUser,
} from '@/lib/authSession';
import { IconBell, IconButton } from '@/shared/ui';

const POLL_MS = 12_000;

type NotifItem = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  href: string;
};

export function SidebarUserNotifications() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [userName, setUserName] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUser = useCallback(() => {
    const user = getAuthUser();
    setUserName(user?.name?.trim() || user?.username || 'عضو');
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const maint = await getMaintenanceNotificationsUnreadCount().catch(
        () => ({ count: 0 }),
      );
      setUnread(maint.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإشعارات');
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const maint = await listMaintenanceNotifications().catch(() => []);
      const mapped: NotifItem[] = maint
        .map((m) => ({
          id: m.id,
          title: m.title,
          body: m.body,
          readAt: m.readAt,
          createdAt: m.createdAt,
          href: m.workOrderId
            ? `/maintenance/work-orders/${m.workOrderId}`
            : '/maintenance/review',
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      setItems(mapped.slice(0, 40));
      setUnread(mapped.filter((r) => !r.readAt).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب الإشعارات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncUser();
    void refreshUnread();
    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncUser);
    const timer = window.setInterval(() => {
      void refreshUnread();
    }, POLL_MS);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncUser);
    };
  }, [syncUser, refreshUnread]);

  useEffect(() => {
    if (!open) return;
    void loadList();
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, loadList]);

  return (
    <div className="sidebar-user" ref={panelRef}>
      <span className="sidebar-user-name">{userName || '…'}</span>
      <div className="sidebar-bell-wrap">
        <IconButton label="الإشعارات" onClick={() => setOpen((v) => !v)}>
          <IconBell />
        </IconButton>
        {unread > 0 ? (
          <span className="sidebar-bell-badge">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="sidebar-notifications">
          <div className="sidebar-notifications-head">
            <span>الإشعارات</span>
            {unread > 0 ? (
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      await markAllMaintenanceNotificationsRead().catch(
                        () => null,
                      );
                      await loadList();
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : 'خطأ',
                      );
                    }
                  })();
                }}
              >
                قراءة الكل
              </button>
            ) : null}
          </div>
          {error ? <p className="error">{error}</p> : null}
          {loading ? <p className="muted">جاري التحميل…</p> : null}
          {!loading && !items.length ? (
            <p className="muted">لا توجد إشعارات.</p>
          ) : null}
          <ul className="sidebar-notifications-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-notification-item ${
                    item.readAt ? '' : 'unread'
                  }`}
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!item.readAt) {
                          await markMaintenanceNotificationRead(item.id);
                        }
                        setOpen(false);
                        router.push(item.href);
                        await refreshUnread();
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : 'خطأ',
                        );
                      }
                    })();
                  }}
                >
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                  <time>
                    {new Date(item.createdAt).toLocaleString('ar-IQ')}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
