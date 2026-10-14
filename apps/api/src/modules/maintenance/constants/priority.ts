export const WORK_PRIORITIES = ['p1', 'p2', 'p3', 'p4'] as const;

export type WorkPriority = (typeof WORK_PRIORITIES)[number];

export const WORK_PRIORITY_LABELS: Record<WorkPriority, string> = {
  p1: 'حرج (P1)',
  p2: 'عالٍ (P2)',
  p3: 'عادي (P3)',
  p4: 'منخفض (P4)',
};

/** ساعات حتى respondBy / resolveBy من لحظة الاعتماد */
export const WORK_PRIORITY_SLA_HOURS: Record<
  WorkPriority,
  { respondHours: number; resolveHours: number }
> = {
  p1: { respondHours: 1, resolveHours: 4 },
  p2: { respondHours: 4, resolveHours: 24 },
  p3: { respondHours: 24, resolveHours: 72 },
  p4: { respondHours: 72, resolveHours: 168 },
};

export function computeSlaDates(priority: WorkPriority, from = new Date()) {
  const sla = WORK_PRIORITY_SLA_HOURS[priority];
  return {
    respondBy: new Date(from.getTime() + sla.respondHours * 3600_000),
    resolveBy: new Date(from.getTime() + sla.resolveHours * 3600_000),
  };
}
