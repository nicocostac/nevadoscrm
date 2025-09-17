import { ContactsTable } from "@/components/contacts/contacts-table";

export const metadata = {
  title: "Contactos · Nevados CRM",
};

export default function ContactsPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <p className="text-sm text-muted-foreground">
          Directorio listo para llamadas o correos con un toque.
        </p>
      </header>
      <ContactsTable />
    </div>
  );
}
