"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCODING_SOURCE_MODE_META = exports.DEFAULT_ENCODING_SOURCE_MODE = exports.ENCODING_SOURCE_MODES = void 0;
exports.isEncodingSourceMode = isEncodingSourceMode;
exports.ENCODING_SOURCE_MODES = [
    'passthrough',
    'passthrough_ffmpeg',
    'encode_cpu',
    'encode_gpu',
];
exports.DEFAULT_ENCODING_SOURCE_MODE = 'passthrough';
exports.ENCODING_SOURCE_MODE_META = {
    passthrough: {
        label: 'مباشر',
        description: 'بدون إعادة ترميز — التدفق يُمرَّر كما هو',
    },
    passthrough_ffmpeg: {
        label: 'مباشر ffmpeg',
        description: 'نسخ التدفقات عبر سكربت ffmpeg بدون إعادة ترميز',
    },
    encode_cpu: {
        label: 'ترميز CPU',
        description: 'إعادة ترميز برمجي على المعالج',
    },
    encode_gpu: {
        label: 'ترميز GPU',
        description: 'إعادة ترميز عتادي NVENC بسلم جودات قابل للضبط من خيارات الجودة',
    },
};
function isEncodingSourceMode(value) {
    return (typeof value === 'string' &&
        exports.ENCODING_SOURCE_MODES.includes(value));
}
//# sourceMappingURL=encoding-source.js.map