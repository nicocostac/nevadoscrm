"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProducts } from "@/app/(app)/actions/opportunity-products";
import { queryKeys } from "@/lib/query/keys";
import type { Product, ProductFilters } from "@/lib/types";

export function useProducts(filters?: ProductFilters) {
  const filterKey = filters
    ? JSON.stringify({
        search: filters.search ?? "",
        category: filters.category ?? "",
        pricingMode: filters.pricingMode ?? "",
        includeInactive: filters.includeInactive ?? false,
      })
    : "default";

  return useQuery({
    queryKey: [...queryKeys.products.all, filterKey],
    queryFn: async (): Promise<Product[]> => fetchProducts(filters ?? {}),
  });
}
