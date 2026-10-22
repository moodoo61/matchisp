'use client';

import { useEffect, useState } from 'react';
import { getPublicAndroidAppInfo } from '@/features/comms/api';

type Props = {
  className?: string;
  /** نص الزر */
  label?: string;
};

/**
 * زر تحميل APK — يظهر فقط إن كان مفعّلاً من الضبط والملف موجود.
 * يعمل في لوحة الاتصال وصفحة /call العامة.
 */
export function AndroidAppDownloadLink({
  className,
  label = 'تحميل تطبيق الأندرويد',
}: Props) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPublicAndroidAppInfo().then((info) => {
      if (cancelled) return;
      if (info.showDownloadButton && info.available) {
        setHref(info.downloadPath);
      } else {
        setHref(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!href) return null;

  return (
    <a className={className ?? 'btn secondary'} href={href} download>
      {label}
    </a>
  );
}
