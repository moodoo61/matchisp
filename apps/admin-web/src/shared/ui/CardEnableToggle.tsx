'use client';

import { IconButton } from './IconButton';
import { IconToggle } from './icons';

type Props = {
  enabled: boolean;
  busy?: boolean;
  onToggle: () => void | Promise<void>;
};

/** زر تفعيل/تعطيل البطاقة بالكامل — مكوّن مشترك */
export function CardEnableToggle({ enabled, busy, onToggle }: Props) {
  return (
    <IconButton
      label={enabled ? 'تعطيل البطاقة' : 'تفعيل البطاقة'}
      tone={enabled ? 'accent' : 'default'}
      disabled={busy}
      className={enabled ? 'card-enable on' : 'card-enable off'}
      onClick={() => {
        void onToggle();
      }}
    >
      <IconToggle />
    </IconButton>
  );
}
