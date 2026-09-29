import type { Metadata } from 'next';
import { ClientLivePublicView } from '@/features/live/client_live/components/ClientLivePublicView';

export const metadata: Metadata = {
  title: 'البث المباشر | ISP Live',
  description: 'مشاهدة قنوات البث المباشر بتجربة سينمائية فاخرة',
};

/** صفحة عامة — بدون تسجيل دخول إلى لوحة التحكم */
export default function ClientLivePublicPage() {
  return <ClientLivePublicView />;
}
