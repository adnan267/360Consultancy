import { ChangePasswordForm } from "@/components/AdminClient";

export const metadata = { title: "Change password" };

export default function PasswordPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-navy-900">Change password</h1>
      <p className="mt-2 text-sm text-navy-700">Use at least 12 characters. Don’t reuse a password from another site.</p>
      <div className="mt-6"><ChangePasswordForm /></div>
    </div>
  );
}
