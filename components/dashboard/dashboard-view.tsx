"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ActivitySquare,
  ArrowRight,
  CircleDollarSign,
  Flame,
  PlusCircle,
} from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useDashboardOverview } from "@/hooks/use-dashboard";
import { useLeads } from "@/hooks/use-leads";
import { useOpportunities } from "@/hooks/use-opportunities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardView() {
  const overviewQuery = useDashboardOverview();
  const { data: leads } = useLeads();
  const { data: activities } = useActivities();
  const { data: opportunities } = useOpportunities();

  const pipelineByStage =
    opportunities?.reduce<Record<string, number>>((acc, opportunity) => {
      acc[opportunity.stage] = (acc[opportunity.stage] ?? 0) + (opportunity.amount ?? 0);
      return acc;
    }, {}) ?? {};

  const totalPipeline = Object.values(pipelineByStage).reduce(
    (sum, value) => sum + value,
    0
  );

  const pendingActivities = activities
    ?.filter((activity) => activity.status !== "completada")
    .slice(0, 5);

  const recentLeads = leads?.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen móvil del pipeline, actividades críticas y últimos leads creados.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Leads nuevos"
          description="últimos 7 días"
          icon={<PlusCircle className="h-5 w-5" aria-hidden />}
          value={overviewQuery.data?.newLeads ?? 0}
          loading={overviewQuery.isLoading}
        />
        <StatsCard
          title="Valor pipeline"
          description="oportunidades abiertas"
          icon={<CircleDollarSign className="h-5 w-5" aria-hidden />}
          value={`$ ${Intl.NumberFormat("es-CL").format(overviewQuery.data?.pipelineValue ?? 0)}`}
          loading={overviewQuery.isLoading}
        />
        <StatsCard
          title="Tareas atrasadas"
          description="requieren acción"
          icon={<Flame className="h-5 w-5" aria-hidden />}
          value={overviewQuery.data?.overdueActivities ?? 0}
          variant="warning"
          loading={overviewQuery.isLoading}
        />
        <StatsCard
          title="Ganado mes"
          description={`desde ${format(new Date(), "MMM", { locale: es })}`}
          icon={<ActivitySquare className="h-5 w-5" aria-hidden />}
          value={`$ ${Intl.NumberFormat("es-CL").format(overviewQuery.data?.wonThisMonth ?? 0)}`}
          loading={overviewQuery.isLoading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pipeline por etapa</CardTitle>
            <Badge variant="secondary">Arrastra en Oportunidades</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(pipelineByStage).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin oportunidades activas.</p>
            ) : (
              Object.entries(pipelineByStage).map(([stage, value]) => (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage}</span>
                    <span className="text-muted-foreground">
                      {'$' + Intl.NumberFormat("es-CL").format(value)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      (value / Math.max(1, totalPipeline)) * 100
                    )}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividades pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActivities && pendingActivities.length > 0 ? (
              pendingActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.due_date
                        ? `Due ${format(new Date(activity.due_date), "dd MMM", { locale: es })}`
                        : "Sin fecha"}
                      {activity.owner?.full_name ? ` · ${activity.owner.full_name}` : ""}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" asChild>
                    <Link href={`/leads/${activity.lead_id ?? ""}`}>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin tareas pendientes. ¡Buen trabajo!
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads && recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company ?? ""}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(lead.created_at), "dd MMM", { locale: es })}</span>
                    <Badge variant="outline">{lead.stage}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay leads registrados.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Siguientes pasos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Prioriza tareas atrasadas con el botón de completar en el timeline.</p>
            <p>2. Usa el tablero Kanban para mover oportunidades y mantener forecast preciso.</p>
            <p>3. Crea leads desde el FAB para no perder oportunidades de campo.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type StatsCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  value: string | number;
  loading?: boolean;
  variant?: "default" | "warning";
};

function StatsCard({ title, description, icon, value, loading, variant = "default" }: StatsCardProps) {
  return (
    <Card className="rounded-3xl border-border/60 bg-card/60 shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full", 
              variant === "warning" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-xl font-bold">{value}</p>}
      </CardContent>
    </Card>
  );
}
