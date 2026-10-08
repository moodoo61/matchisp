'use client';

type Props = {
  live: boolean;
};

/** شارة مباشر / متوقف */
export function ProgramLiveBadge({ live }: Props) {
  return (
    <span className={live ? 'cl-program-state is-live' : 'cl-program-state'}>
      <i aria-hidden />
      {live ? 'مباشر' : 'متوقف'}
    </span>
  );
}
