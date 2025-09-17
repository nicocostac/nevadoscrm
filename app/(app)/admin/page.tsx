import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata = {
  title: "Admin · Nevados CRM",
};

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Cambia roles y estados de usuarios demo.
        </p>
      </header>
      <AdminPanel />
    </div>
  );
}
