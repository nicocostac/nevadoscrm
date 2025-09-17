"use client";

import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, CheckCircle2, Clock4 } from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function CalendarAgenda() {
  const { data, isLoading, isError } = useActivities();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const events = useMemo(() => {
    if (!data) return [];
    return data.filter((activity) =>
      isSameDay(new Date(activity.dueDate), selectedDate)
    );
  }, [data, selectedDate]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="order-2 lg:order-none">
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isError ? (
            <p className="text-sm text-destructive">No se pudo cargar la agenda.</p>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Nada planificado para {format(selectedDate, "dd MMM", { locale: es })}.
            </div>
          ) : (
            events.map((activity) => (
              <div
                key={activity.id}
                className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock4 className="h-4 w-4" aria-hidden />
                    {format(new Date(activity.dueDate), "HH:mm", { locale: es })}
                  </span>
                  <Badge variant="outline">{activity.owner}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">{activity.subject}</p>
                  <p className="text-sm text-muted-foreground">{activity.notes}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.status === "completada" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Completada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="order-1 lg:order-none">
        <CardHeader>
          <CardTitle>Selecciona un día</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={es}
            className="rounded-2xl border"
            initialFocus
          />
        </CardContent>
      </Card>
    </div>
  );
}
