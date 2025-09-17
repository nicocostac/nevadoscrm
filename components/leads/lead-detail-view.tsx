"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Repeat2,
} from "lucide-react";

import { useActivityMutations, useActivities } from "@/hooks/use-activities";
import { useLead, useLeadMutations } from "@/hooks/use-leads";
import { useOwners } from "@/hooks/use-owners";
import { useSessionContext } from "@/lib/auth/session-context";
import { useLeadSheetStore } from "@/lib/stores/lead-sheet-store";
import { cn } from "@/lib/utils";
import { ActivityForm, type ActivityFormValues } from "@/components/activities/activity-form";
import { LeadAttachments } from "@/components/attachments/lead-attachments";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_BADGE = {
  pendiente: "bg-amber-100 text-amber-700",
  completada: "bg-emerald-100 text-emerald-700",
} as const;

type LeadDetailViewProps = {
  leadId: string;
};

type ActivityFilter = "todas" | "pendientes" | "completadas";

export function LeadDetailView({ leadId }: LeadDetailViewProps) {
  const router = useRouter();
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todas");

  const leadQuery = useLead(leadId);
  const ownersQuery = useOwners();
  const activitiesQuery = useActivities(leadId);
  const { create, toggleStatus } = useActivityMutations(leadId);
  const { remove } = useLeadMutations();
  const openEdit = useLeadSheetStore((state) => state.openEdit);
  const { profile } = useSessionContext();

  const lead = leadQuery.data;
  const activities = useMemo(() => {
    const all = activitiesQuery.data ?? [];
    if (activityFilter === "todas") return all;
    if (activityFilter === "pendientes") {
      return all.filter((activity) => activity.status !== "completada");
    }
    return all.filter((activity) => activity.status === "completada");
  }, [activitiesQuery.data, activityFilter]);

  const isLoading = leadQuery.isLoading;

  const handleCreateActivity = (values: ActivityFormValues) => {
    create.mutate(
      {
        leadId,
        type: values.type,
        subject: values.subject,
        dueDate: values.dueDate,
        ownerId: values.ownerId,
        notes: values.notes,
        priority: values.priority,
      },
      {
        onSuccess: () => {
          setActivityDialogOpen(false);
          create.reset();
        },
      }
    );
  };

  if (leadQuery.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> Volver
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Error cargando lead</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No pudimos obtener la información. Revisa la conexión o regresa al listado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead && !isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> Volver
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Lead no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tal vez fue eliminado. Regresa al listado para continuar trabajando.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManageLead = Boolean(profile && lead && (profile.role === "admin" || lead.owner_id === profile.id));

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lead?.name ?? "Cargando..."}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isLoading || !lead ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <Card className="rounded-3xl border-border/60 bg-card/60 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {lead.company ?? "Sin empresa"}
              </p>
              <CardTitle className="text-2xl">{lead.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{lead.title ?? "Sin cargo"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{lead.stage}</Badge>
              <Badge variant="outline">{lead.source}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoPill
                label="Owner"
                value={lead.owner?.full_name ?? lead.owner?.email ?? "Sin asignar"}
                icon={<PencilLine className="h-4 w-4" aria-hidden />}
              />
              <InfoPill
                label="Valor estimado"
                value={`$ ${Intl.NumberFormat("es-CL").format(lead.value ?? 0)}`}
                icon={<CalendarCheck className="h-4 w-4" aria-hidden />} />
              <InfoPill
                label="Última actividad"
                value={
                  lead.last_activity_at
                    ? formatDistanceToNow(new Date(lead.last_activity_at), {
                        addSuffix: true,
                        locale: es,
                      })
                    : "Sin actividad"
                }
                icon={<Clock3 className="h-4 w-4" aria-hidden />} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${lead.phone ?? ""}`}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden /> Llamar
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${lead.email ?? ""}`}>
                  <Mail className="mr-2 h-4 w-4" aria-hidden /> Correo
                </a>
              </Button>
              <Button size="sm" onClick={() => openEdit(lead.id)} disabled={!canManageLead}>
                <PencilLine className="mr-2 h-4 w-4" aria-hidden /> Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (confirm("¿Eliminar lead?")) {
                    remove.mutate(lead.id, {
                      onSuccess: () => router.push("/leads"),
                    });
                  }
                }}
                disabled={remove.isPending || !canManageLead}
              >
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Timeline de actividades</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={activityFilter}
              onValueChange={(value) => setActivityFilter(value as ActivityFilter)}
            >
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="completadas">Completadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={create.isPending}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden /> Registrar actividad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva actividad</DialogTitle>
                </DialogHeader>
                {ownersQuery.isError ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    No fue posible cargar los owners. Intenta nuevamente.
                  </div>
                ) : ownersQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <ActivityForm
                    owners={ownersQuery.data ?? []}
                    defaultOwnerId={lead?.owner_id ?? undefined}
                    isSubmitting={create.isPending}
                    onSubmit={handleCreateActivity}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {activitiesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            Sin actividades registradas. Comienza agregando una tarea o llamada.
          </div>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
              >
                <div className="flex h-full w-10 flex-col items-center">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      activity.status === "completada"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {activity.type[0]?.toUpperCase()}
                  </span>
                  <div className="mt-1 w-px flex-1 bg-border/60" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.due_date
                          ? format(new Date(activity.due_date), "dd MMM yyyy", { locale: es })
                          : "Sin fecha"}
                        {activity.owner?.full_name ? ` · ${activity.owner.full_name}` : ""}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", STATUS_BADGE[activity.status])}>
                      {activity.status === "completada" ? "Completada" : "Pendiente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.notes ?? "Sin notas"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {activity.due_date ? (
                      <span>
                        Registrado {formatDistanceToNow(new Date(activity.due_date), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    ) : null}
                    {activity.completed_at ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Cerrado {formatDistanceToNow(new Date(activity.completed_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus.mutate(activity.id)}
                      disabled={toggleStatus.isPending}
                    >
                      {activity.status === "completada" ? (
                        <>
                          <Repeat2 className="mr-2 h-4 w-4" aria-hidden /> Reabrir
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden /> Completar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LeadAttachments leadId={leadId} />
    </div>
  );
}

type InfoPillProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function InfoPill({ label, value, icon }: InfoPillProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
