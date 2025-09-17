"use server";

import { getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { OpportunityProduct, OpportunityProductInputPayload, Product } from "@/lib/types";

const OPPORTUNITY_PRODUCT_SELECT =
  "id, opportunity_id, product_id, name, category, quantity, pricing_mode, monthly_revenue, notes";

function normalize(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function replaceOpportunityProductsAction({
  opportunityId,
  products,
}: {
  opportunityId: string;
  products: OpportunityProductInputPayload[];
}) {
  const { supabase } = await getServerSupabaseClient();

  const { error: deleteError } = await supabase
    .from("opportunity_products")
    .delete()
    .eq("opportunity_id", opportunityId);
  if (deleteError) throw deleteError;

  if (products.length === 0) {
    return [] as OpportunityProduct[];
  }

  const records = products.map((item) => ({
    opportunity_id: opportunityId,
    product_id: item.productId ?? null,
    name: item.name,
    category: normalize(item.category ?? null),
    quantity: item.quantity,
    pricing_mode: item.pricingMode,
    monthly_revenue: item.monthlyRevenue,
    notes: normalize(item.notes ?? null),
  }));

  const { data, error } = await supabase
    .from("opportunity_products")
    .insert(records)
    .select(OPPORTUNITY_PRODUCT_SELECT);

  if (error) throw error;

  return (data ?? []) as OpportunityProduct[];
}

export async function fetchProducts() {
  const { supabase } = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Product[];
}
