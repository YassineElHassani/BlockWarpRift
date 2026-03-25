import RoleGuard from "@/components/layout/RoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-[80vh] bg-muted/30 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
