import { OpportunitiesBoard } from "@/components/opportunities/opportunities-board";
import { CreateOpportunityDialog } from "@/components/opportunities/create-opportunity-dialog";

export const metadata = {
  title: "Oportunidades · Nevados CRM",
};

export default function OpportunitiesPage() {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            Arrastra tarjetas para actualizar el pipeline desde móvil o escritorio.
          </p>
        </div>
        <CreateOpportunityDialog />
      </header>
      <OpportunitiesBoard />
    </div>
  );
}
