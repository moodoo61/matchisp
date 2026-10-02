'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  actions?: ReactNode;
  /** إجراءات أسفل البطاقة (مثل حفظ) */
  footer?: ReactNode;
  children: ReactNode;
  /** عند false تظهر البطاقة باهتة (معطّلة على مستوى القسم) */
  enabled?: boolean;
};

/** بطاقة مهمة موحّدة: هدر (عنوان + إجراءات) ثم محتوى ثم ذيل اختياري */
export function TaskCard({
  title,
  actions,
  footer,
  children,
  enabled = true,
}: Props) {
  return (
    <section className={`task-card${enabled ? '' : ' is-disabled'}`}>
      <header className="task-card-head">
        <h2>{title}</h2>
        {actions ? <div className="task-card-actions">{actions}</div> : null}
      </header>
      <div className="task-card-body">{children}</div>
      {footer ? <footer className="task-card-footer">{footer}</footer> : null}
    </section>
  );
}
