export declare const ENCODING_SOURCE_MODES: readonly ["passthrough", "passthrough_ffmpeg", "encode_cpu", "encode_gpu"];
export type EncodingSourceMode = (typeof ENCODING_SOURCE_MODES)[number];
export declare const DEFAULT_ENCODING_SOURCE_MODE: EncodingSourceMode;
export declare const ENCODING_SOURCE_MODE_META: Record<EncodingSourceMode, {
    label: string;
    description: string;
}>;
export declare function isEncodingSourceMode(value: unknown): value is EncodingSourceMode;
