/** أنواع مشغّل صفحة المشاهدة — الترتيب: TS ثم HLS */
export const VIEWING_PLAYER_IDS = ['ts', 'hls'] as const;

export type ViewingPlayerId = (typeof VIEWING_PLAYER_IDS)[number];

export const VIEWING_PLAYER_LABELS: Record<ViewingPlayerId, string> = {
  ts: 'TS',
  hls: 'HLS',
};

/** قائمة المشغّلات المفعّلة بالترتيب (أول عنصر = الافتراضي) */
export function resolveEnabledPlayers(opts: {
  playerTsEnabled: boolean;
  playerHlsEnabled: boolean;
}): ViewingPlayerId[] {
  const list: ViewingPlayerId[] = [];
  if (opts.playerTsEnabled) list.push('ts');
  if (opts.playerHlsEnabled) list.push('hls');
  // ضمان مشغّل واحد على الأقل
  return list.length ? list : ['hls'];
}
