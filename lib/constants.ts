import type { ActivityPriority, ActivityType, LeadSource, LeadStage } from "@/lib/types";

export const ACCOUNT_INDUSTRIES = [
  "Agricultura",
  "Construcción",
  "Consumo Masivo",
  "Educación",
  "Energía",
  "Finanzas",
  "Gobierno",
  "Manufactura",
  "Minería",
  "Retail",
  "Salud",
  "Servicios Profesionales",
  "Tecnología",
  "Transporte",
  "Turismo",
  "Otro",
] as const;

export const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes y Antártica Chilena",
] as const;

export const LEAD_STAGES: LeadStage[] = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "En Negociación",
  "Cerrado",
];

export const LEAD_SOURCES: LeadSource[] = [
  "Web",
  "Evento",
  "Referencia",
  "Campaña",
  "Inbound",
];

export const ACTIVITY_TYPES: ActivityType[] = [
  "llamada",
  "reunión",
  "correo",
  "tarea",
];

export const ACTIVITY_PRIORITIES: ActivityPriority[] = [
  "alta",
  "media",
  "baja",
];

export const OPPORTUNITY_STAGES = [
  "Prospección",
  "Descubrimiento",
  "Propuesta",
  "Negociación",
  "Cerrado Ganado",
  "Cerrado Perdido",
] as const;
