"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProductRules } from "@/app/(app)/actions/product-rules";
import { queryKeys } from "@/lib/query/keys";
import type { ProductRule, ProductRuleFilters } from "@/lib/types";

export function useProductRules(filters?: ProductRuleFilters) {
  const key = filters ? JSON.stringify(filters) : "all";
  return useQuery({
    queryKey: [...queryKeys.products.rules, key],
    queryFn: async (): Promise<ProductRule[]> => fetchProductRules(filters ?? {}),
  });
}
