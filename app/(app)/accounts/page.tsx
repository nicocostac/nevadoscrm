import { AccountsTable } from "@/components/accounts/accounts-table";

export const metadata = {
  title: "Cuentas · Nevados CRM",
};

export default function AccountsPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Cuentas</h1>
        <p className="text-sm text-muted-foreground">
          Visión rápida de la salud de cuentas estratégicas.
        </p>
      </header>
      <AccountsTable />
    </div>
  );
}
