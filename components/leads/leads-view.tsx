"use client";

import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { Plus } from "lucide-react";

import { useLeads } from "@/hooks/use-leads";
import { useLeadFiltersStore } from "@/lib/stores/leads-filters-store";
import { useLeadSheetStore } from "@/lib/stores/lead-sheet-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { LeadCard } from "@/components/leads/lead-card";

export function LeadsView() {
  const { data, isLoading, isError } = useLeads();
  const openCreate = useLeadSheetStore((state) => state.openCreate);
  const filters = useLeadFiltersStore();

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    return data.filter((lead) => {
      const haystack = `${lead.name} ${lead.company ?? ""} ${lead.email ?? ""} ${lead.owner?.full_name ?? ""}`.toLowerCase();
      const matchesSearch = filters.search
        ? haystack.includes(filters.search.toLowerCase())
        : true;
      const matchesOwner = filters.owner === "todos" || lead.owner?.id === filters.owner;
      const matchesStage = filters.stage === "todas" || lead.stage === filters.stage;
      const matchesSource = filters.source === "todas" || lead.source === filters.source;
      const matchesActivity = (() => {
        if (filters.lastActivity === "todas") return true;
        const days = Number(filters.lastActivity);
        if (!lead.last_activity_at) return false;
        return differenceInDays(new Date(), new Date(lead.last_activity_at)) <= days;
      })();

      return (
        matchesSearch &&
        matchesOwner &&
        matchesStage &&
        matchesSource &&
        matchesActivity
      );
    });
  }, [data, filters]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona leads, notas y actividades en segundos. Puedes crear, editar o cerrar oportunidades sin abandonar este flujo.
        </p>
      </header>

      <LeadsFilters />

      {isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Ocurrió un error al cargar los leads. Intenta refrescar.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <p className="text-base font-semibold">Sin leads con estos filtros</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Ajusta la búsqueda o crea un nuevo lead. Con la hoja rápida lo haces en menos de 15 segundos.
          </p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Nuevo lead
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      <Button
        size="lg"
        className="fixed bottom-28 right-6 flex h-12 w-12 items-center justify-center rounded-full shadow-xl sm:hidden"
        onClick={openCreate}
        aria-label="Crear lead"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </Button>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
        Los datos se sincronizan en tiempo real desde Supabase. Ajusta los permisos o esquemas ejecutando las migraciones en `/supabase/migrations`.
      </div>
    </div>
  );
}
