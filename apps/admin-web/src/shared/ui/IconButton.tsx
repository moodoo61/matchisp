'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'danger' | 'accent';
  children: ReactNode;
};

export function IconButton({
  label,
  tone = 'default',
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`icon-btn tone-${tone}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
