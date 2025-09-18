import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  GaugeCircle,
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  Settings2,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    description: "Resumen rápido del pipeline y tareas críticas.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    description: "Gestiona leads, filtros y notas en segundos.",
    href: "/leads",
    icon: UsersRound,
  },
  {
    title: "Oportunidades",
    description: "Visualiza el pipeline por etapas con arrastrar y soltar.",
    href: "/opportunities",
    icon: BriefcaseBusiness,
  },
  {
    title: "Productos",
    description: "Gestiona catálogo y reglas por modalidad.",
    href: "/products",
    icon: Package,
  },
  {
    title: "Reglas",
    description: "Configura precios y beneficios automáticos.",
    href: "/products/rules",
    icon: SlidersHorizontal,
  },
  {
    title: "Cuentas",
    description: "Consulta cuentas clave y últimos movimientos.",
    href: "/accounts",
    icon: GaugeCircle,
  },
  {
    title: "Contactos",
    description: "Directorio de contactos y dueños de relación.",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Calendario",
    description: "Agenda y actividades próximas por ejecutar.",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Admin",
    description: "Configura usuarios, roles y permisos de prueba.",
    href: "/admin",
    icon: Settings2,
  },
];

export const activityNavItem: NavItem = {
  title: "Actividades",
  description: "Timeline de llamadas, correos y tareas.",
  href: "/leads",
  icon: Activity,
};
