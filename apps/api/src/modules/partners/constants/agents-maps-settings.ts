export const AGENTS_MAPS_SETTINGS_META_KEY = 'agents.maps.settings';

export type AgentsMapsSettings = {
  /** مفتاح Google Maps JavaScript API — لاختيار الموقع على الخريطة */
  googleMapsApiKey: string;
};

export const DEFAULT_AGENTS_MAPS_SETTINGS: AgentsMapsSettings = {
  googleMapsApiKey: '',
};
