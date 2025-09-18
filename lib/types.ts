import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type Organization = Tables<"organizations">;
export type Team = Tables<"teams">;
export type TeamMember = Tables<"team_members">;
export type AccountRecord = Tables<"accounts">;
export type Account = AccountRecord & {
  owner?: Pick<Profile, "id" | "full_name" | "email">;
};
export type ContactRecord = Tables<"contacts">;
export type Contact = ContactRecord & {
  owner?: Pick<Profile, "id" | "full_name" | "email">;
};
export type LeadRecord = Tables<"leads">;
export type OpportunityRecord = Tables<"opportunities">;
export type ProductRecord = Tables<"products">;
export type ProductPricingRuleRecord = Tables<"product_pricing_rules">;
export type ProductRuleRecord = Tables<"product_rules">;
export type OpportunityProductRecord = Tables<"opportunity_products">;
export type ActivityRecord = Tables<"activities">;
export type AttachmentRecord = Tables<"attachments">;

export type Lead = LeadRecord & {
  owner?: Pick<Profile, "id" | "full_name" | "role" | "email">;
  account?: Pick<AccountRecord, "id" | "name">;
  contact?: Pick<Contact, "id" | "name" | "email" | "phone">;
};

export type Opportunity = OpportunityRecord & {
  owner?: Pick<Profile, "id" | "full_name">;
  account?: Pick<AccountRecord, "id" | "name">;
  lead?: Pick<LeadRecord, "id" | "name">;
};

export type Product = ProductRecord & {
  pricing_rules?: ProductPricingRule[];
  product_rules?: ProductRule[];
};

export type ProductPricingRule = ProductPricingRuleRecord;

export type RuleBenefit =
  | "préstamo_bidones"
  | "bidones_comodato"
  | "dispensador_basico_comodato"
  | "dispensador_electrico_comodato"
  | "despacho_gratis"
  | "contrato_12m"
  | "precio_especial"
  | "otro";

export type ProductRuleCondition = {
  product?: string | null;
  productCategory?: string | null;
  quantity?: {
    min?: number | null;
    max?: number | null;
  } | null;
  contract?: boolean | null;
  contractMonths?: number | null;
  zone?: string | null;
  serviceType?: string | null;
  orderTotal?: {
    min?: number | null;
    max?: number | null;
  } | null;
};

export type ProductRuleEffect = {
  unitPrice?: number | "solo_agua_consumida" | null;
  minOrder?: number | null;
  benefits?: RuleBenefit[];
  extraCharge?: number | null;
  delivery?: "gratis" | "cobro" | null;
  pricingMode?: PricingMode | null;
  notes?: string | null;
  tags?: string[] | null;
};

export type ProductRule = ProductRuleRecord & {
  conditions: ProductRuleCondition;
  effects: ProductRuleEffect;
};

export type ProductRuleFilters = {
  productId?: string;
  isActive?: boolean;
  serviceType?: string;
};

export type ProductFilters = {
  search?: string;
  category?: string;
  pricingMode?: PricingMode;
  includeInactive?: boolean;
};

export type OpportunityProduct = OpportunityProductRecord;

export type PricingMode = OpportunityProduct["pricing_mode"];

export type OpportunityProductInputPayload = {
  productId?: string | null;
  name: string;
  category?: string | null;
  quantity: number;
  pricingMode: PricingMode;
  monthlyRevenue: number;
  notes?: string | null;
  unitPrice?: number | null;
  benefits?: string[] | null;
  extraCharges?: number | null;
  appliedRuleIds?: string[] | null;
  ruleSnapshot?: Record<string, unknown> | null;
};

export type Activity = ActivityRecord & {
  owner?: Pick<Profile, "id" | "full_name">;
  lead?: Pick<LeadRecord, "id" | "name">;
  opportunity?: Pick<OpportunityRecord, "id" | "name">;
};

export type Attachment = AttachmentRecord & {
  created_by?: Pick<Profile, "id" | "full_name" | "email">;
};

export type UserRole = Profile["role"];
