"use server";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import { isMissingRelationshipError, isMissingTableError } from "@/lib/supabase/errors";
import type { OpportunityProduct, OpportunityProductInputPayload, Product, ProductFilters } from "@/lib/types";

const OPPORTUNITY_PRODUCT_SELECT =
  "id, opportunity_id, product_id, name, category, quantity, pricing_mode, monthly_revenue, notes, unit_price, total_price, benefits, extra_charges, applied_rule_ids, rule_snapshot";

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
  if (deleteError) {
    if (isMissingTableError(deleteError)) {
      console.warn("opportunity_products table not found; skipping product sync");
      return [] as OpportunityProduct[];
    }
    throw deleteError;
  }

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
    unit_price: item.unitPrice ?? null,
    total_price: item.unitPrice ? item.unitPrice * item.quantity : item.monthlyRevenue,
    benefits: item.benefits ?? null,
    extra_charges: item.extraCharges ?? null,
    applied_rule_ids: item.appliedRuleIds ?? null,
    rule_snapshot: item.ruleSnapshot ?? null,
  }));

  const { data, error } = await supabase
    .from("opportunity_products")
    .insert(records)
    .select(OPPORTUNITY_PRODUCT_SELECT);

  if (error) {
    if (isMissingTableError(error)) {
      console.warn("opportunity_products table not found; skipping product sync");
      return [] as OpportunityProduct[];
    }
    throw error;
  }

  return (data ?? []) as OpportunityProduct[];
}

export async function fetchProducts(filters: ProductFilters = {}) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  try {
    const { search, category, pricingMode, includeInactive } = filters;

    let query = supabase
      .from("products")
      .select("*, pricing_rules:product_pricing_rules(*)")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    if (category && category !== "todos") {
      query = query.eq("category", category.trim());
    }

    if (pricingMode) {
      query = query.eq("pricing_mode", pricingMode);
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},category.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error) || isMissingRelationshipError(error)) {
        console.warn("products table not found; returning empty catalog");
        return [] as Product[];
      }
      throw error;
    }

    return (data ?? []).map((product) => ({
      ...product,
      pricing_rules: Array.isArray((product as Product).pricing_rules)
        ? ((product as Product).pricing_rules ?? []).sort((a, b) => (a.min_quantity ?? 0) - (b.min_quantity ?? 0))
        : [],
    })) as Product[];
  } catch (error) {
    if (isMissingTableError(error) || isMissingRelationshipError(error)) {
      console.warn("products table not found; returning empty catalog");
      return [] as Product[];
    }
    throw error;
  }
}
