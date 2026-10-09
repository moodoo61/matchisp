/**
 * تشغيل HTMLVideo بصوت — بدون فرض الكتم.
 * إن رفض المتصفح التشغيل تبقى الحالة متوقفة جاهزة لنقرة المستخدم.
 */
export function tryHtmlVideoAutoplay(
  video: HTMLVideoElement,
  onUpdate: (next: { playing: boolean; muted: boolean; buffering: boolean }) => void,
): void {
  video.muted = false;
  onUpdate({ playing: false, muted: false, buffering: true });
  void video.play().then(
    () => {
      onUpdate({
        playing: !video.paused,
        muted: video.muted,
        buffering: false,
      });
    },
    () => {
      onUpdate({ playing: false, muted: false, buffering: false });
    },
  );
}
