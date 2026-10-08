export type GeneralUiFontFace = {
  weight: number;
  url: string;
};

export type GeneralUiFontOption = {
  id: string;
  family: string;
  label: string;
  weights: number[];
  localReady: boolean;
};

export type GeneralUiTheme = {
  uiFontId: string;
  family: string;
  localReady: boolean;
  faces: GeneralUiFontFace[];
};

export type GeneralSettings = {
  id: string;
  systemName: string;
  logoUrl: string;
  logoAbsoluteUrl: string | null;
  brandName: string;
  brandLogoUrl: string;
  brandLogoAbsoluteUrl: string | null;
  uiFontId: string;
  uiFontFamily: string;
  uiFontLocalReady: boolean;
  uiFontFaces: GeneralUiFontFace[];
  updatedAt: string;
};
