import { redirect } from 'next/navigation';

/** المسار القديم تحت /live يوجّه للصفحة العامة */
export default function ClientLiveAdminAliasPage() {
  redirect('/client-live');
}
