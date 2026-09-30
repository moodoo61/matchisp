import { redirect } from 'next/navigation';

/** المسار القديم — يُوجَّه إلى صفحة الشبكة الرئيسية */
export default function NetworkInterfacesRedirectPage() {
  redirect('/settings/network');
}
