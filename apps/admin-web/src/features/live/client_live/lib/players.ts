/** مشغّلات صفحة العميل — الترتيب: TS ثم HLS */

export const VIEWING_PLAYER_IDS = ['ts', 'hls'] as const;

export type ViewingPlayerId = (typeof VIEWING_PLAYER_IDS)[number];

export const VIEWING_PLAYER_LABELS: Record<ViewingPlayerId, string> = {
  ts: 'TS',
  hls: 'HLS',
};

export function resolveEnabledPlayers(opts: {
  playerTsEnabled?: boolean;
  playerHlsEnabled?: boolean;
}): ViewingPlayerId[] {
  const list: ViewingPlayerId[] = [];
  if (opts.playerTsEnabled !== false) list.push('ts');
  if (opts.playerHlsEnabled !== false) list.push('hls');
  return list.length ? list : ['hls'];
}
