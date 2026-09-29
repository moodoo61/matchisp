/** إعدادات ظهور قنوات صفحة المشاهدة */
export const VIEWING_CHANNELS_META_KEY = 'client_live.viewing_channels';

export type ViewingChannelsVisibility = {
  /** معرّفات القنوات المخفية عن صفحة العميل */
  hiddenChannelIds: string[];
};

export const DEFAULT_VIEWING_CHANNELS_VISIBILITY: ViewingChannelsVisibility = {
  hiddenChannelIds: [],
};
