"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createOrUpdateProductAction,
  toggleProductActiveAction,
  type ProductUpsertInput,
} from "@/app/(app)/actions/products";
import { queryKeys } from "@/lib/query/keys";

export function useProductUpsertMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductUpsertInput) => createOrUpdateProductAction(input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      toast.success("Producto guardado", {
        description: product?.name,
      });
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el producto");
    },
  });
}

export function useProductToggleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleProductActiveAction,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      toast.success(
        product?.is_active ? "Producto activado" : "Producto desactivado",
        {
          description: product?.name,
        }
      );
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado");
    },
  });
}
