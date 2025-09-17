"use client";

import { Search } from "lucide-react";

import { useOwners } from "@/hooks/use-owners";
import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import { useLeadFiltersStore } from "@/lib/stores/leads-filters-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LAST_ACTIVITY_OPTIONS = [
  { value: "todas" as const, label: "Todas" },
  { value: "7" as const, label: "7 días" },
  { value: "14" as const, label: "14 días" },
  { value: "30" as const, label: "30 días" },
];

export function LeadsFilters() {
  const ownersQuery = useOwners();
  const {
    search,
    setSearch,
    owner,
    setOwner,
    stage,
    setStage,
    source,
    setSource,
    lastActivity,
    setLastActivity,
    reset,
  } = useLeadFiltersStore();

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold">Filtrar leads</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          Limpiar filtros
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, empresa o email"
          aria-label="Buscar leads"
        />
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger aria-label="Filtrar por owner">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los owners</SelectItem>
            {ownersQuery.isLoading ? (
              <SelectItem value="loading" disabled>
                Cargando...
              </SelectItem>
            ) : (
              ownersQuery.data?.map((ownerOption) => (
                <SelectItem key={ownerOption.id} value={ownerOption.id}>
                  {ownerOption.full_name ?? ownerOption.email ?? "Sin nombre"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger aria-label="Filtrar por etapa">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las etapas</SelectItem>
            {LEAD_STAGES.map((stageOption) => (
              <SelectItem key={stageOption} value={stageOption}>
                {stageOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger aria-label="Filtrar por fuente">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las fuentes</SelectItem>
            {LEAD_SOURCES.map((sourceOption) => (
              <SelectItem key={sourceOption} value={sourceOption}>
                {sourceOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Última actividad
        </span>
        <Tabs value={lastActivity} onValueChange={(value) => setLastActivity(value as typeof lastActivity)}>
          <TabsList className="grid grid-cols-4">
            {LAST_ACTIVITY_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
