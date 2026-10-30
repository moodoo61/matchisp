import type { Agent } from '@/features/partners/types';
import {
  normalizeAgentPhone,
  normalizeAgentText,
} from '@/features/partners/types';

export type AgentDuplicateHints = {
  name: string | null;
  shopName: string | null;
  phone: string | null;
};

export function findAgentDuplicates(
  agents: Agent[],
  form: { name: string; shopName: string; phone: string },
  excludeId?: string,
): AgentDuplicateHints {
  const others = agents.filter((a) => a.id !== excludeId);
  const nameNorm = normalizeAgentText(form.name);
  const shopNorm = normalizeAgentText(form.shopName);
  const phoneNorm = normalizeAgentPhone(form.phone);

  const byName =
    nameNorm.length >= 2
      ? others.find((a) => normalizeAgentText(a.name) === nameNorm)
      : undefined;
  const byShop =
    shopNorm.length >= 2
      ? others.find((a) => normalizeAgentText(a.shopName) === shopNorm)
      : undefined;
  const byPhone =
    phoneNorm.length >= 5
      ? others.find((a) => normalizeAgentPhone(a.phone) === phoneNorm)
      : undefined;

  return {
    name: byName ? `يوجد وكيل بنفس الاسم: «${byName.name}»` : null,
    shopName: byShop
      ? `يوجد محل بنفس الاسم: «${byShop.shopName}» (${byShop.name})`
      : null,
    phone: byPhone
      ? `رقم الهاتف مستخدم لدى: «${byPhone.name}»`
      : null,
  };
}
