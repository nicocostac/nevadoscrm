"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  Mail,
  PencilLine,
  Phone,
  Target,
  TimerReset,
} from "lucide-react";

import { useSessionContext } from "@/lib/auth/session-context";
import { useLeadSheetStore } from "@/lib/stores/lead-sheet-store";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STAGE_VARIANTS: Record<Lead["stage"], string> = {
  Nuevo: "bg-sky-100 text-sky-700",
  Contactado: "bg-purple-100 text-purple-700",
  Calificado: "bg-emerald-100 text-emerald-700",
  "En Negociación": "bg-amber-100 text-amber-700",
  Cerrado: "bg-slate-200 text-slate-700",
};

const SOURCE_VARIANTS: Record<Lead["source"], string> = {
  Web: "bg-primary/10 text-primary",
  Evento: "bg-orange-100 text-orange-700",
  Referencia: "bg-emerald-100 text-emerald-700",
  Campaña: "bg-indigo-100 text-indigo-700",
  Inbound: "bg-pink-100 text-pink-700",
};

type LeadCardProps = {
  lead: Lead;
};

export function LeadCard({ lead }: LeadCardProps) {
  const openEdit = useLeadSheetStore((state) => state.openEdit);
  const { profile } = useSessionContext();
  const canEdit = profile?.role === "admin" || profile?.id === lead.owner_id;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="group rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {lead.company ?? "Sin empresa"}
            </p>
            <h3 className="text-lg font-bold leading-tight">{lead.name}</h3>
            <p className="text-sm text-muted-foreground">{lead.title ?? "Sin cargo"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("text-xs", STAGE_VARIANTS[lead.stage])}>{lead.stage}</Badge>
            <Badge variant="outline" className={cn("text-xs", SOURCE_VARIANTS[lead.source])}>
              {lead.source}
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Valor estimado</p>
            <p className="font-semibold">
              {'$' + Intl.NumberFormat("es-CL").format(lead.value ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Última actividad</p>
            <p className="font-semibold">
              {lead.last_activity_at
                ? formatDistanceToNow(new Date(lead.last_activity_at), {
                    addSuffix: true,
                    locale: es,
                  })
                : "Sin actividad"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Target className="h-4 w-4" aria-hidden /> Owner: {lead.owner?.full_name ?? "Sin asignar"}
          </span>
          <span className="inline-flex items-center gap-2">
            <TimerReset className="h-4 w-4" aria-hidden /> Creado el {" "}
            {format(new Date(lead.created_at), "dd MMM", { locale: es })}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${lead.phone ?? ""}`} aria-label="Llamar al lead">
              <Phone className="mr-2 h-4 w-4" aria-hidden /> Llamar
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`mailto:${lead.email ?? ""}`} aria-label="Enviar correo">
              <Mail className="mr-2 h-4 w-4" aria-hidden /> Correo
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(lead.id)}
            aria-label="Editar lead"
            disabled={!canEdit}
          >
            <PencilLine className="mr-2 h-4 w-4" aria-hidden /> Editar
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="ml-auto" asChild>
                <Link href={`/leads/${lead.id}`} aria-label="Abrir detalle">
                  Ver detalle <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Timeline y actividades</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
