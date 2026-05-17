import { AdminShell } from "@/components/admin-shell";
import { AdminToastProvider } from "@/components/admin-toast";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AdminToastProvider>
      <AdminShell adminName={session.name}>{children}</AdminShell>
    </AdminToastProvider>
  );
}
