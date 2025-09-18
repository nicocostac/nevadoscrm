"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  DragOverlay,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, CircleDollarSign, MoveHorizontal } from "lucide-react";

import { useAccounts } from "@/hooks/use-accounts";
import { useOpportunities, useOpportunityStageMutation } from "@/hooks/use-opportunities";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import { EditOpportunityDialog } from "@/components/opportunities/edit-opportunity-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STAGE_ACCENTS: Record<string, string> = {
  Prospección: "border-sky-200 bg-sky-50",
  Descubrimiento: "border-purple-200 bg-purple-50",
  Propuesta: "border-amber-200 bg-amber-50",
  Negociación: "border-emerald-200 bg-emerald-50",
  "Cerrado Ganado": "border-green-200 bg-green-50",
  "Cerrado Perdido": "border-rose-200 bg-rose-50",
};

export function OpportunitiesBoard() {
  const { data, isLoading, isError } = useOpportunities();
  const accountsQuery = useAccounts();
  const mutation = useOpportunityStageMutation();
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accountsQuery.data?.forEach((account) => map.set(account.id, account.name));
    return map;
  }, [accountsQuery.data]);

  const grouped = useMemo(() => {
    const initial: Record<string, Opportunity[]> = {};
    for (const stage of OPPORTUNITY_STAGES) {
      initial[stage] = [];
    }
    (data ?? []).forEach((opportunity) => {
      if (!initial[opportunity.stage]) {
        initial[opportunity.stage] = [];
      }
      initial[opportunity.stage].push(opportunity);
    });
    return initial;
  }, [data]);

  const handleDragStart = (event: DragStartEvent) => {
    const opportunity: Opportunity | undefined = event.active.data.current?.opportunity;
    setActiveOpportunity(opportunity ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const targetStage = over.id as Opportunity["stage"];
    const opportunity: Opportunity | undefined = active.data.current?.opportunity;
    if (!opportunity || opportunity.stage === targetStage) return;
    mutation.mutate({ id: opportunity.id, stage: targetStage });
    setActiveOpportunity(null);
  };

  const handleDragCancel = () => {
    setActiveOpportunity(null);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setIsEditOpen(true);
  };

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar oportunidades</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {OPPORTUNITY_STAGES.map((stage) => (
          <Card key={stage} className="h-80">
            <CardHeader className="space-y-1">
              <CardTitle>{stage}</CardTitle>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {OPPORTUNITY_STAGES.map((stage) => (
            <OpportunityColumn
              key={stage}
              id={stage}
              title={stage}
              opportunities={grouped[stage] ?? []}
              accountNameMap={accountNameMap}
              onEdit={handleEditOpportunity}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOpportunity ? (
            <OpportunityCardPreview
              opportunity={activeOpportunity}
              accountName={
                activeOpportunity.account?.name ??
                accountNameMap.get(activeOpportunity.account_id ?? "") ??
                ""
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <EditOpportunityDialog
        open={isEditOpen}
        opportunity={editingOpportunity}
        onOpenChange={(value) => {
          setIsEditOpen(value);
          if (!value) {
            setEditingOpportunity(null);
          }
        }}
      />
    </>
  );
}

type OpportunityColumnProps = {
  id: string;
  title: string;
  opportunities: Opportunity[];
  accountNameMap: Map<string, string>;
  onEdit: (opportunity: Opportunity) => void;
};

function OpportunityColumn({ id, title, opportunities, accountNameMap, onEdit }: OpportunityColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}>
      <Card
        data-stage={id}
        className={`flex h-full min-h-[22rem] flex-col gap-3 border-dashed p-3 transition ${
          isOver ? "border-primary/70 bg-primary/5" : "border-border/60"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Badge variant="outline">{opportunities.length}</Badge>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-y-auto pb-2">
          <SortableContext
            items={opportunities.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {opportunities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                Arrastra oportunidades aquí
              </div>
            ) : (
              opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  accountName={
                    opportunity.account?.name ?? accountNameMap.get(opportunity.account_id ?? "") ?? ""
                  }
                  onEdit={onEdit}
                />
              ))
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

type OpportunityCardProps = {
  opportunity: Opportunity;
  accountName?: string;
  onEdit: (opportunity: Opportunity) => void;
};

function OpportunityCard({ opportunity, accountName, onEdit }: OpportunityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: { opportunity },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(opportunity)}
      className={`space-y-3 rounded-2xl border-2 p-4 shadow-sm transition ${
        STAGE_ACCENTS[opportunity.stage] ?? "border-border bg-card"
      } ${isDragging ? "scale-[1.02] ring-2 ring-primary/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{opportunity.name}</h3>
          <p className="text-xs text-muted-foreground">
            {accountName ?? opportunity.account_id ?? "Sin cuenta"}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Prob. {Math.round(opportunity.probability ?? 0)}%
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <CircleDollarSign className="h-4 w-4" aria-hidden />
        {'$' + Intl.NumberFormat("es-CL").format(opportunity.amount ?? 0)}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4" aria-hidden /> Cierra {" "}
        {opportunity.close_date
          ? format(new Date(opportunity.close_date), "dd MMM", { locale: es })
          : "Sin fecha"}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          {opportunity.owner?.full_name ?? opportunity.owner?.email ?? "Sin owner"}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground"
          aria-label="Mover"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        >
          <MoveHorizontal className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function OpportunityCardPreview({ opportunity, accountName }: { opportunity: Opportunity; accountName?: string }) {
  return (
    <div className={`space-y-3 rounded-2xl border-2 p-4 shadow-lg ${STAGE_ACCENTS[opportunity.stage] ?? "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{opportunity.name}</h3>
          <p className="text-xs text-muted-foreground">{accountName ?? ""}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Prob. {Math.round(opportunity.probability ?? 0)}%
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <CircleDollarSign className="h-4 w-4" aria-hidden />
        {'$' + Intl.NumberFormat("es-CL").format(opportunity.amount ?? 0)}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4" aria-hidden /> Cierra {" "}
        {opportunity.close_date
          ? format(new Date(opportunity.close_date), "dd MMM", { locale: es })
          : "Sin fecha"}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          {opportunity.owner?.full_name ?? opportunity.owner?.email ?? "Sin owner"}
        </span>
      </div>
    </div>
  );
}
