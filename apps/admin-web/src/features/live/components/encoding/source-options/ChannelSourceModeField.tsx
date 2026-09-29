'use client';

import type { ReactNode } from 'react';
import type {
  EncodingSourceMode,
  EncodingSourceOptionsResponse,
} from '@/features/live/types';
import {
  IconSourceCpu,
  IconSourceFFpass,
  IconSourceGpu,
  IconSourcePassthrough,
} from '@/shared/ui';

type Props = {
  options: EncodingSourceOptionsResponse['options'];
  value: EncodingSourceMode;
  disabled?: boolean;
  onChange: (value: EncodingSourceMode) => void;
};

const SOURCE_ICONS: Record<EncodingSourceMode, ReactNode> = {
  passthrough: <IconSourcePassthrough />,
  passthrough_ffmpeg: <IconSourceFFpass />,
  encode_cpu: <IconSourceCpu />,
  encode_gpu: <IconSourceGpu />,
};

/** خيار المصدر: أيقونة + نص بجانبها (بدون شروحات) */
export function ChannelSourceModeField({
  options,
  value,
  disabled,
  onChange,
}: Props) {
  if (!options.length) return null;

  return (
    <div
      className="channel-source-mode-icons"
      role="radiogroup"
      aria-label="خيار المصدر"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.label}
            disabled={!option.available || disabled}
            className={
              selected
                ? 'channel-source-mode-chip is-selected'
                : 'channel-source-mode-chip'
            }
            onClick={() => onChange(option.value)}
          >
            {SOURCE_ICONS[option.value]}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
