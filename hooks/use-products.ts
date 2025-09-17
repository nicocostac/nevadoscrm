"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProducts } from "@/app/(app)/actions/opportunity-products";
import { queryKeys } from "@/lib/query/keys";
import type { Product } from "@/lib/types";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: async (): Promise<Product[]> => fetchProducts(),
  });
}
