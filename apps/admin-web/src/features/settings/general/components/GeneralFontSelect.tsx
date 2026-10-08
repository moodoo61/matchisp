'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  downloadGeneralFont,
  listGeneralFonts,
} from '@/features/settings/general/api';
import { applyUiFont } from '@/features/settings/general/lib/apply-ui-font';
import type { GeneralUiFontOption } from '@/features/settings/general/types';
import { notifyMutation, useToast } from '@/shared/ui';

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (fontId: string) => void;
  onLocalReadyChange?: (fontId: string, ready: boolean) => void;
};

export function GeneralFontSelect({
  value,
  disabled,
  onChange,
  onLocalReadyChange,
}: Props) {
  const toast = useToast();
  const [fonts, setFonts] = useState<GeneralUiFontOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listGeneralFonts();
      setFonts(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب قائمة الخطوط');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = fonts.find((f) => f.id === value);
  const localReady = selected?.localReady ?? false;

  async function onDownload() {
    if (!value || downloading) return;
    setDownloading(true);
    try {
      const result = await notifyMutation(
        toast,
        () => downloadGeneralFont(value),
        {
          success: 'تم تنزيل الخط وتخزينه محلياً',
          error: 'تعذر تنزيل الخط',
        },
      );
      applyUiFont({ family: result.family, faces: result.faces });
      onLocalReadyChange?.(result.id, result.localReady);
      await reload();
    } catch {
      // أُبلِغ عبر toast
    } finally {
      setDownloading(false);
    }
  }

  function onSelectChange(fontId: string) {
    onChange(fontId);
    const font = fonts.find((f) => f.id === fontId);
    if (!font?.localReady) return;
    // معاينة فورية من الملفات المحلية (قبل الحفظ)
    applyUiFont({
      family: font.family,
      faces: font.weights.map((weight) => ({
        weight,
        url: `/api/uploads/general-fonts/${font.id}/${weight}.woff2`,
      })),
    });
  }

  return (
    <div className="general-font-select">
      <div className="general-font-select-row">
        <select
          value={value}
          disabled={disabled || loading || downloading}
          onChange={(e) => onSelectChange(e.target.value)}
        >
          {loading && !fonts.length ? (
            <option value={value}>جاري التحميل…</option>
          ) : null}
          {fonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
              {font.localReady ? '' : ' — غير منزّل'}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn secondary"
          disabled={disabled || downloading || loading || !value || localReady}
          onClick={() => void onDownload()}
          title={
            localReady
              ? 'الخط مخزَّن محلياً'
              : 'تنزيل الخط وتخزينه على الخادم'
          }
        >
          {downloading ? 'جاري التنزيل…' : localReady ? 'محلي' : 'تنزيل'}
        </button>
      </div>
      {selected ? (
        <p
          className="general-font-preview"
          style={{
            fontFamily: localReady
              ? `"${selected.family}", "Segoe UI", Tahoma, sans-serif`
              : undefined,
          }}
        >
          معاينة: مرحباً بكم في نظام الإدارة — Abc 123
        </p>
      ) : null}
      <p className="muted general-font-hint">
        {localReady
          ? 'الخط مخزَّن محلياً. اختره ثم احفظ لتطبيقه على الواجهة.'
          : 'اختر خطاً ثم اضغط «تنزيل» لتخزينه محلياً، ثم احفظ.'}
      </p>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
