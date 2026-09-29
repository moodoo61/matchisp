import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m8 5 11 7-11 7V5Z" />
    </IconBase>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 5v14M15 5v14" />
    </IconBase>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" />
      <path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
    </IconBase>
  );
}

export function MutedIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" />
      <path d="m16 10 5 5M21 10l-5 5" />
    </IconBase>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </IconBase>
  );
}

export function ChannelsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m9 2 3 3 3-3" />
    </IconBase>
  );
}
