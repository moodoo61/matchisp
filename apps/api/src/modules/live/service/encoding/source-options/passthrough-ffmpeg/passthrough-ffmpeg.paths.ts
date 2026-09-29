import path from 'node:path';

function monorepoRoot() {
  // passthrough-ffmpeg → source-options → encoding → service → live → modules → src|dist → api → apps → root
  return path.resolve(__dirname, '../../../../../../../../..');
}

/** مسار سكربت التمرير عبر ffmpeg */
export function resolvePassthroughFfmpegScriptPath() {
  return (
    process.env.LIVE_FFPASS_SCRIPT?.trim() ||
    process.env.LIVE_PASSTHROUGH_FFMPEG_SCRIPT_PATH?.trim() ||
    path.join(monorepoRoot(), 'scripts/live/ffpass.sh')
  );
}
