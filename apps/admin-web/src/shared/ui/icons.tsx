import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function IconToggle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="9" cy="12" r="3" />
    </svg>
  );
}

export function IconAlwaysOn(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.9 4.9l2.8 2.8" />
      <path d="M16.3 16.3l2.8 2.8" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.9 19.1l2.8-2.8" />
      <path d="M16.3 7.7l2.8-2.8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

/** عين — إظهار في الـ API */
export function IconEye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** عين مغلقة — إخفاء من الـ API */
export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1" />
      <path d="M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** رفع / استعراض ملف */
export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V7" />
      <path d="M8.5 10.5 12 7l3.5 3.5" />
      <path d="M5 19h14" />
    </svg>
  );
}

/** إيقاف الجلسات (Stop sessions) */
export function IconStopSessions(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

/** إيقاف قسري للقناة (Nuke stream) — مختلف عن أيقونة التشغيل الدائم */
export function IconNukeStream(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.2 3h9.6L21 7.2v9.6L16.8 21H7.2L3 16.8V7.2Z" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  );
}

/** تمرير مباشر — المصدر كما هو */
export function IconSourcePassthrough(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** تمرير عبر ffmpeg — نسخ بدون ترميز */
export function IconSourceFFpass(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3V9Z" />
    </svg>
  );
}

/** ترميز CPU */
export function IconSourceCpu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  );
}

/** ترميز GPU */
export function IconSourceGpu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h4M7 14h2" />
      <circle cx="16" cy="12" r="2" />
    </svg>
  );
}
