import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  WORK_ORDER_TRANSITIONS,
  type WorkOrderStatus,
} from '../constants/work-order-status';

export type TransitionRole =
  | 'triage'
  | 'dispatch'
  | 'execute'
  | 'parts'
  | 'supervise';

/** من ينفّذ كل انتقال (دور واحد على الأقل) */
const TRANSITION_ROLES: Partial<
  Record<`${WorkOrderStatus}->${WorkOrderStatus}`, TransitionRole[]>
> = {
  'draft->approved': ['triage', 'supervise'],
  'draft->cancelled': ['triage', 'supervise'],
  'approved->assigned': ['dispatch', 'supervise'],
  'approved->cancelled': ['triage', 'supervise'],
  'assigned->approved': ['execute', 'dispatch', 'supervise'], // رفض تعيين
  'assigned->accepted': ['execute'],
  'assigned->cancelled': ['supervise'],
  'accepted->approved': ['dispatch', 'supervise'],
  'accepted->assigned': ['dispatch', 'supervise'],
  'accepted->in_progress': ['execute'],
  'accepted->cancelled': ['supervise'],
  'in_progress->waiting_parts': ['execute'],
  'in_progress->waiting_access': ['execute'],
  'in_progress->done_field': ['execute'],
  'in_progress->cancelled': ['supervise'],
  'waiting_parts->in_progress': ['execute', 'parts', 'supervise'],
  'waiting_parts->cancelled': ['supervise'],
  'waiting_access->in_progress': ['execute'],
  'waiting_access->cancelled': ['supervise'],
  'done_field->rework': ['supervise'],
  'done_field->closed': ['supervise'],
  'rework->in_progress': ['execute'],
  'rework->waiting_parts': ['execute'],
  'rework->waiting_access': ['execute'],
  'rework->done_field': ['execute'],
  'rework->cancelled': ['supervise'],
};

export function assertWorkOrderTransition(
  from: string,
  to: string,
  roles: TransitionRole[],
) {
  const allowed =
    WORK_ORDER_TRANSITIONS[from as WorkOrderStatus] ?? [];
  if (!allowed.includes(to as WorkOrderStatus)) {
    throw new BadRequestException(
      `انتقال غير مسموح من «${from}» إلى «${to}»`,
    );
  }
  const key = `${from}->${to}` as keyof typeof TRANSITION_ROLES;
  const needed = TRANSITION_ROLES[key] ?? ['supervise'];
  if (!needed.some((r) => roles.includes(r))) {
    throw new ForbiddenException('لا تملك صلاحية هذا الانتقال');
  }
}
