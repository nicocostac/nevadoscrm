export const queryKeys = {
  owners: ["owners"] as const,
  leads: {
    all: ["leads"] as const,
    detail: (id: string) => ["leads", id] as const,
  },
  opportunities: {
    all: ["opportunities"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
  },
  contacts: {
    all: ["contacts"] as const,
  },
  products: {
    all: ["products"] as const,
  },
  activities: {
    all: ["activities"] as const,
    byLead: (leadId: string) => ["activities", "lead", leadId] as const,
  },
  attachments: {
    byLead: (leadId: string) => ["attachments", "lead", leadId] as const,
  },
  dashboard: {
    overview: ["dashboard", "overview"] as const,
  },
} as const;
