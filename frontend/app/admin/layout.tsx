import DashboardShell from "@/components/layout/DashboardShell";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <RoleGuard allowedRoles={["ADMIN"]}>{children}</RoleGuard>
    </DashboardShell>
  );
}
