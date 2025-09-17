import { CalendarAgenda } from "@/components/calendar/calendar-agenda";

export const metadata = {
  title: "Calendario · Nevados CRM",
};

export default function CalendarPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          Visualiza actividades por día y completa pendientes al instante.
        </p>
      </header>
      <CalendarAgenda />
    </div>
  );
}
