import { redirect } from 'next/navigation';

// "Add User" now opens as a modal from the Users list — this route just forwards there.
export default function NewUserRedirectPage() {
  redirect('/admin/users?new=1');
}
