export type EncodingQualityRung = {
    id: string;
    label: string;
    enabled: boolean;
    width: number;
    height: number;
    bitrateKbps: number;
    maxrateKbps: number;
    bufsizeKbps: number;
};
export type EncodingQualitySettings = {
    fps: number;
    gop: number;
    audioBitrateKbps: number;
    audioSampleRate: number;
    nvencPreset: string;
    rungs: EncodingQualityRung[];
};
export declare const DEFAULT_ENCODING_QUALITY: EncodingQualitySettings;
export declare function normalizeEncodingQuality(input: {
    rungs?: Array<Partial<EncodingQualityRung> & {
        id?: string;
    }>;
} | null | undefined): EncodingQualitySettings;
export declare function enabledEncodingRungs(settings: EncodingQualitySettings): EncodingQualityRung[];
