/**
 * يمرّر حاوية الجدول حتى يكون عنصر المباراة في منتصف المنطقة المرئية.
 * يعيد false إذا لم يكن التمرير ممكناً بعد (أبعاد غير جاهزة).
 */
export function scrollScheduleToNearest(
  container: HTMLElement,
  target: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  const viewH = container.clientHeight;
  const maxTop = Math.max(0, container.scrollHeight - viewH);
  if (viewH <= 0 || maxTop <= 0) return false;
  if (target.offsetHeight <= 0) return false;

  // موقع الهدف نسبةً للحاوية + scrollTop الحالي (مستقر أثناء الرسوم المتحركة)
  const cRect = container.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const targetOffset =
    tRect.top - cRect.top + container.scrollTop;
  const top = Math.min(
    Math.max(0, targetOffset - viewH / 2 + tRect.height / 2),
    maxTop,
  );

  if (behavior === 'smooth') {
    container.scrollTo({ top, behavior: 'smooth' });
  } else {
    container.scrollTop = top;
  }
  return true;
}
