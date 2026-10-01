/** بطاقة ALSA من /proc/asound/cards */
export type AlsaCard = {
  index: number;
  name: string;
};

/** بطاقات تشغيل/GPU ليست مصدر التقاط HDMI */
export function isNonCaptureAlsaCard(name: string): boolean {
  const n = name.toLowerCase();
  return (
    /nvidia/.test(n) ||
    /nouveau/.test(n) ||
    /sof-hda/.test(n) ||
    /sof-audio/.test(n) ||
    /intel.*pch/.test(n) ||
    /hda intel/.test(n) ||
    /hd-audio/.test(n) ||
    /hdmi.*audio/.test(n) ||
    /loopback/.test(n)
  );
}

/**
 * يختار بطاقات صوت الالتقاط فقط.
 * يفضّل HAudio1..N ثم يستبعد كروت النظام (مثل NVIDIA = hw:0,0).
 */
export function pickCaptureAlsaCards(cards: AlsaCard[]): AlsaCard[] {
  const withHaudio = cards
    .map((card) => {
      const match = card.name.match(/haudio\s*(\d+)/i);
      return match
        ? { card, haudioNum: Number(match[1]) }
        : null;
    })
    .filter((row): row is { card: AlsaCard; haudioNum: number } => Boolean(row))
    .sort((a, b) => a.haudioNum - b.haudioNum || a.card.index - b.card.index)
    .map((row) => row.card);

  if (withHaudio.length) return withHaudio;

  return cards
    .filter((card) => !isNonCaptureAlsaCard(card.name))
    .sort((a, b) => a.index - b.index);
}

/**
 * يربط /dev/videoN ببطاقة الالتقاط حسب الترتيب:
 * video0→HAudio1 (غالباً hw:1,0)، video1→HAudio2 (hw:2,0)، …
 */
export function pairVideoAudioPaths(
  videoPaths: string[],
  alsaCards: AlsaCard[],
): Array<{ videoPath: string; audioPaths: string[]; audioPath: string | null }> {
  const captureCards = pickCaptureAlsaCards(alsaCards);
  return videoPaths.map((videoPath, index) => {
    const card =
      captureCards.length === 0
        ? null
        : captureCards[Math.min(index, captureCards.length - 1)];
    const audioPaths = card
      ? [`hw:${card.index},0`, `plughw:${card.index},0`]
      : [];
    return {
      videoPath,
      audioPaths,
      audioPath: audioPaths[0] ?? null,
    };
  });
}
