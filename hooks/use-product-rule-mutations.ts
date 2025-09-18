"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteProductRuleAction,
  upsertProductRuleAction,
  type ProductRuleInput,
} from "@/app/(app)/actions/product-rules";
import { queryKeys } from "@/lib/query/keys";

export function useProductRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductRuleInput) => upsertProductRuleAction(input),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.rules });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Regla guardada", {
        description: rule?.name,
      });
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No pudimos guardar la regla");
    },
  });
}

export function useProductRuleDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductRuleAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.rules });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Regla eliminada");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "No pudimos eliminar la regla");
    },
  });
}
