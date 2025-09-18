"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { PricingMode, Product } from "@/lib/types";

export type ProductUpsertInput = {
  id?: string;
  name: string;
  category: string;
  pricingMode: PricingMode;
  baseUnitPrice: number;
  allowSale: boolean;
  allowRental: boolean;
  allowConcession: boolean;
  minConcessionUnits?: number | null;
  rentalMonthlyFee?: number | null;
  pricingRules?: ProductPricingRuleInput[];
  notes?: string | null;
  isActive: boolean;
};

export type ProductPricingRuleInput = {
  id?: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
};

type ToggleProductStatusInput = {
  id: string;
  isActive: boolean;
};

function normalizeNumber(value?: number | null) {
  if (value === undefined || value === null) return null;
  return Number.isFinite(value) ? value : null;
}

function normalizeText(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertAllowedModalities(input: ProductUpsertInput) {
  if (!input.allowSale && !input.allowRental && !input.allowConcession) {
    throw new Error("Selecciona al menos una modalidad permitida");
  }
  if (input.pricingMode === "concesión" && !input.allowConcession) {
    throw new Error("La modalidad principal debe estar habilitada en las opciones permitidas");
  }
  if (input.pricingMode === "alquiler" && !input.allowRental) {
    throw new Error("Activa alquiler dentro de las modalidades permitidas");
  }
  if (input.pricingMode === "venta" && !input.allowSale) {
    throw new Error("Activa venta dentro de las modalidades permitidas");
  }
}

export async function createOrUpdateProductAction(input: ProductUpsertInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);
  
  assertAllowedModalities(input);

  const payload = {
    org_id: orgId,
    name: input.name.trim(),
    category: input.category.trim(),
    pricing_mode: input.pricingMode,
    base_unit_price: normalizeNumber(input.baseUnitPrice) ?? 0,
    allow_sale: input.allowSale,
    allow_rental: input.allowRental,
    allow_concession: input.allowConcession,
    min_concession_units: input.allowConcession ? normalizeNumber(input.minConcessionUnits ?? null) : null,
    rental_monthly_fee: input.allowRental ? normalizeNumber(input.rentalMonthlyFee ?? null) : null,
    notes: normalizeText(input.notes ?? null),
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  try {
    let data: Product | null = null;
    let productId: string | null = input.id ?? null;

    if (input.id) {
      const response = await supabase
        .from("products")
        .update(payload)
        .eq("id", input.id)
        .eq("org_id", orgId)
        .select("*")
        .single();

      if (response.error) throw response.error;
      data = (response.data as Product) ?? null;
      productId = data?.id ?? input.id;
    } else {
      const response = await supabase
        .from("products")
        .insert({ ...payload })
        .select("*")
        .single();

      if (response.error) throw response.error;
      data = (response.data as Product) ?? null;
      productId = data?.id ?? null;
    }

    if (productId) {
      await replaceProductPricingRules(supabase, productId, orgId, input.pricingRules ?? []);
    }

    revalidatePath("/products");
    revalidatePath("/opportunities");

    return data;
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error("La tabla de productos no existe en la base de datos local. Ejecuta las migraciones de Supabase.");
    }
    throw error;
  }
}

export async function toggleProductActiveAction({ id, isActive }: ToggleProductStatusInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  try {
    const { error, data } = await supabase
      .from("products")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", orgId)
      .select("*")
      .single();

    if (error) throw error;

    revalidatePath("/products");
    revalidatePath("/opportunities");

    return data as Product;
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error("La tabla de productos no existe en la base de datos local. Ejecuta las migraciones de Supabase.");
    }
    throw error;
  }
}

async function replaceProductPricingRules(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>["supabase"],
  productId: string,
  orgId: string,
  rules: ProductPricingRuleInput[]
) {
  const sorted = [...rules].sort((a, b) => a.minQuantity - b.minQuantity);

  const { error: deleteError } = await supabase
    .from("product_pricing_rules")
    .delete()
    .eq("product_id", productId)
    .eq("org_id", orgId);

  if (deleteError && !isMissingTableError(deleteError)) {
    throw deleteError;
  }

  if (sorted.length === 0) {
    return;
  }

  const records = sorted.map((rule) => ({
    product_id: productId,
    org_id: orgId,
    min_quantity: rule.minQuantity,
    max_quantity: rule.maxQuantity ?? null,
    price: rule.price,
  }));

  const { error } = await supabase.from("product_pricing_rules").insert(records);

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}
