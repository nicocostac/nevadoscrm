"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { ProductRule, ProductRuleCondition, ProductRuleEffect } from "@/lib/types";

export type ProductRuleInput = {
  id?: string;
  name: string;
  description?: string | null;
  productId?: string | null;
  productCategory?: string | null;
  serviceType?: string | null;
  coverageZone?: string | null;
  priority?: number;
  isActive?: boolean;
  conditions: ProductRuleCondition;
  effects: ProductRuleEffect;
};

export type ProductRuleFilters = {
  productId?: string;
  isActive?: boolean;
  serviceType?: string;
};

function normalizeText(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchProductRules(filters: ProductRuleFilters = {}) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  try {
    let query = supabase
      .from("product_rules")
      .select("*")
      .eq("org_id", orgId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });

    if (filters.productId) {
      query = query.eq("product_id", filters.productId);
    }

    if (filters.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    if (filters.serviceType) {
      query = query.eq("service_type", filters.serviceType);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) {
        console.warn("product_rules table missing; returning empty list");
        return [] as ProductRule[];
      }
      throw error;
    }

    return (data ?? []).map(deserializeRule) as ProductRule[];
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn("product_rules table missing; returning empty list");
      return [] as ProductRule[];
    }
    throw error;
  }
}

export async function upsertProductRuleAction(input: ProductRuleInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    name: input.name.trim(),
    description: normalizeText(input.description ?? null),
    product_id: input.productId ?? null,
    product_category: normalizeText(input.productCategory ?? null),
    service_type: normalizeText(input.serviceType ?? null),
    coverage_zone: normalizeText(input.coverageZone ?? null),
    priority: input.priority ?? 100,
    is_active: input.isActive ?? true,
    conditions: input.conditions,
    effects: input.effects,
    updated_at: new Date().toISOString(),
  };

  try {
    const query = supabase
      .from("product_rules")
      .upsert(
        input.id
          ? [{ ...payload, id: input.id }]
          : [payload],
        { onConflict: "id" }
      )
      .eq("org_id", orgId)
      .select("*")
      .single();

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) {
        throw new Error("La tabla de reglas no existe. Ejecuta las migraciones de Supabase.");
      }
      throw error;
    }

    revalidatePath("/products");
    revalidatePath("/products/rules");
    revalidatePath("/opportunities");

    return deserializeRule(data) as ProductRule;
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error("La tabla de reglas no existe. Ejecuta las migraciones de Supabase.");
    }
    throw error;
  }
}

export async function deleteProductRuleAction(id: string) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  try {
    const { error } = await supabase
      .from("product_rules")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      if (isMissingTableError(error)) {
        return;
      }
      throw error;
    }

    revalidatePath("/products/rules");
    revalidatePath("/products");
    revalidatePath("/opportunities");
  } catch (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw error;
  }
}

function deserializeRule(rule: unknown): ProductRule {
  const record = rule as ProductRule;
  return {
    ...record,
    conditions: (record.conditions ?? {}) as ProductRuleCondition,
    effects: (record.effects ?? {}) as ProductRuleEffect,
  };
}
