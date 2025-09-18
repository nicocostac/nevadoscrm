"use client";

import { useEffect, useState } from "react";

import { useOpportunityUpdateMutation } from "@/hooks/use-opportunities";
import { OpportunityForm, type OpportunityFormValues } from "@/components/opportunities/opportunity-form";
import type { OpportunityProductFormValues } from "@/components/opportunities/opportunity-product-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Opportunity, OpportunityProductRecord } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function mapOpportunityToFormValues(opportunity: Opportunity, products: OpportunityFormValues["products"]): OpportunityFormValues {
  return {
    id: opportunity.id,
    name: opportunity.name,
    accountId: opportunity.account_id ?? "",
    ownerId: opportunity.owner_id ?? "",
    stage: opportunity.stage,
    amount: opportunity.amount ?? 0,
    probability: Number(opportunity.probability ?? 0),
    closeDate: opportunity.close_date ?? "",
    leadId: opportunity.lead_id ?? "none",
    contractTerm:
      opportunity.has_contract && opportunity.contract_term_months
        ? String(opportunity.contract_term_months as number)
        : "sin_contrato",
    products,
  };
}

function mapProducts(records: OpportunityProductRecord[]): OpportunityFormValues["products"] {
  if (!records) return [];
  return records.map((item) => ({
    productId: item.product_id ?? "custom",
    name: item.name ?? "",
    category: item.category ?? "",
    quantity: Number(item.quantity ?? 1),
    pricingMode: item.pricing_mode ?? "venta",
    monthlyRevenue: Number(item.monthly_revenue ?? 0),
    notes: item.notes ?? "",
    unitPrice: item.unit_price ?? null,
    benefits: item.benefits ?? null,
    extraCharges: item.extra_charges ?? null,
    appliedRuleIds: item.applied_rule_ids ?? null,
    ruleSnapshot: item.rule_snapshot ?? null,
  }));
}

type EditOpportunityDialogProps = {
  open: boolean;
  opportunity: Opportunity | null;
  onOpenChange: (open: boolean) => void;
};

export function EditOpportunityDialog({ open, opportunity, onOpenChange }: EditOpportunityDialogProps) {
  const supabase = useSupabaseClient();
  const updateMutation = useOpportunityUpdateMutation();
  const [initialValues, setInitialValues] = useState<OpportunityFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !opportunity) {
      setInitialValues(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("opportunity_products")
          .select("product_id, name, category, quantity, pricing_mode, monthly_revenue, notes, unit_price, extra_charges, applied_rule_ids, rule_snapshot")
          .eq("opportunity_id", opportunity.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const products = mapProducts((data as OpportunityProductRecord[]) ?? []);
        const values = mapOpportunityToFormValues(opportunity, products.length > 0 ? products : createFallbackProducts());
        setInitialValues(values);
      } catch (err) {
        console.error(err);
        setError("No pudimos cargar la oportunidad");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDetail();
  }, [open, opportunity, supabase]);

  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const handleSubmit = async (values: OpportunityFormValues) => {
    const contractTerm = values.contractTerm === "sin_contrato" ? null : Number(values.contractTerm);

    await updateMutation.mutateAsync({
      id: values.id!,
      name: values.name,
      accountId: values.accountId,
      ownerId: values.ownerId,
      stage: values.stage,
      amount: values.amount,
      probability: values.probability,
      closeDate: values.closeDate || null,
      leadId: values.leadId && values.leadId !== "none" ? values.leadId : null,
      hasContract: contractTerm !== null,
      contractTermMonths: contractTerm,
      coverageZone: null,
      serviceType: null,
      products: values.products,
    });
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar oportunidad</DialogTitle>
          <DialogDescription>Ajusta la propuesta y los términos comerciales.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading || !initialValues ? (
          <SkeletonPlaceholder />
        ) : (
          <OpportunityForm
            mode="edit"
            defaultValues={initialValues}
            submitLabel="Guardar cambios"
            isSubmitting={updateMutation.isPending}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SkeletonPlaceholder() {
  return <Skeleton className="h-80 w-full rounded-3xl" />;
}

function createFallbackProducts(): OpportunityProductFormValues[] {
  return [
    {
      productId: "custom",
      name: "",
      category: "",
      quantity: 1,
      pricingMode: "venta",
      monthlyRevenue: 0,
      notes: "",
      unitPrice: null,
      benefits: null,
      extraCharges: null,
      appliedRuleIds: null,
      ruleSnapshot: null,
    },
  ];
}
