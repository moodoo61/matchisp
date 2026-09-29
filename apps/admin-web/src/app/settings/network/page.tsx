import { redirect } from 'next/navigation';

export default function NetworkIndexPage() {
  redirect('/settings/network/interfaces');
}
