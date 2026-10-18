'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  createWorkOrderComment,
  listWorkOrderComments,
} from '@/features/maintenance/api';
import type { WorkOrderComment } from '@/features/maintenance/types';
import { formatDt } from '@/features/maintenance/types';
import { getAuthUser } from '@/lib/authSession';
import { useToast } from '@/shared/ui';
import '@/features/maintenance/styles/thread.css';

type Props = {
  workOrderId: string;
};

export function WorkOrderThread({ workOrderId }: Props) {
  const toast = useToast();
  const me = getAuthUser();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<WorkOrderComment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setItems(await listWorkOrderComments(workOrderId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الحوار');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [workOrderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items.length]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await createWorkOrderComment(workOrderId, text);
      setItems((prev) => [...prev, created]);
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الإرسال');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="wo-thread">
      {error ? <p className="error">{error}</p> : null}
      <div className="wo-thread-messages" role="log" aria-live="polite">
        {loading ? (
          <p className="wo-thread-empty">جاري التحميل…</p>
        ) : items.length ? (
          items.map((msg) => {
            const mine = Boolean(me?.id && msg.author?.id === me.id);
            return (
              <article
                key={msg.id}
                className={`wo-thread-bubble ${mine ? 'is-mine' : 'is-other'}`}
              >
                <header className="wo-thread-meta">
                  <span className="wo-thread-author">
                    {msg.author?.name ?? 'عضو'}
                  </span>
                  <span className="wo-thread-party">{msg.party}</span>
                  <span>{formatDt(msg.createdAt)}</span>
                </header>
                <p className="wo-thread-body">{msg.body}</p>
              </article>
            );
          })
        ) : (
          <p className="wo-thread-empty">
            لا تعليقات بعد — ابدأ الحوار بملاحظة للأطراف الأخرى
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="wo-thread-compose form" onSubmit={onSubmit}>
        <label>
          ملاحظة / تعليق
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب ملاحظة تظهر لجميع أطراف أمر العمل…"
            maxLength={4000}
            disabled={sending}
            required
          />
        </label>
        <div className="wo-thread-compose-actions">
          <button
            type="submit"
            className="btn"
            disabled={sending || !body.trim()}
          >
            {sending ? 'جاري الإرسال…' : 'إرسال'}
          </button>
        </div>
      </form>
    </div>
  );
}
