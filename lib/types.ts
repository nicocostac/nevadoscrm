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

export type Product = ProductRecord;

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
