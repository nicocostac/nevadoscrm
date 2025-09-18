"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAccounts } from "@/hooks/use-accounts";
import { useLeads } from "@/hooks/use-leads";
import { useOwners } from "@/hooks/use-owners";
import { useProductRules } from "@/hooks/use-product-rules";
import { OpportunityProductForm, opportunityProductRowSchema } from "@/components/opportunities/opportunity-product-form";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CONTRACT_TERM_OPTIONS = ["sin_contrato", "6", "12", "18", "24"] as const;

const opportunityFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresa un nombre"),
  accountId: z.string().min(1, "Selecciona una cuenta"),
  ownerId: z.string().min(1, "Selecciona owner"),
  stage: z.enum(OPPORTUNITY_STAGES as [Opportunity["stage"], ...Opportunity["stage"][]]),
  amount: z.coerce.number().min(0, "Monto inválido"),
  probability: z.coerce.number().min(0).max(100),
  closeDate: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("none")),
  contractTerm: z.enum(CONTRACT_TERM_OPTIONS),
  products: z.array(opportunityProductRowSchema).min(1, "Agrega al menos un producto"),
});

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

type OpportunityFormProps = {
  mode: "create" | "edit";
  defaultValues: OpportunityFormValues;
  onSubmit: (values: OpportunityFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function createEmptyOpportunityFormValues(): OpportunityFormValues {
  return {
    name: "",
    accountId: "",
    ownerId: "",
    stage: OPPORTUNITY_STAGES[0],
    amount: 0,
    probability: 50,
    closeDate: "",
    leadId: "none",
    contractTerm: "sin_contrato",
    products: [
      {
        productId: "custom",
        name: "Recargas",
        category: "Recarga",
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
    ],
  };
}

export function OpportunityForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
  onSuccess,
}: OpportunityFormProps) {
  const accountsQuery = useAccounts();
  const ownersQuery = useOwners();
  const leadsQuery = useLeads();
  const productRulesQuery = useProductRules({ isActive: true });

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);
  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const rules = useMemo(() => productRulesQuery.data ?? [], [productRulesQuery.data]);

  useEffect(() => {
    if (!form.getValues("accountId") && accounts.length > 0) {
      form.setValue("accountId", accounts[0].id, { shouldDirty: mode === "edit" });
    }
  }, [accounts, form, mode]);

  useEffect(() => {
    if (!form.getValues("ownerId") && owners.length > 0) {
      form.setValue("ownerId", owners[0].id, { shouldDirty: mode === "edit" });
    }
  }, [owners, form, mode]);

  const watchedProducts = useWatch({ control: form.control, name: "products" });
  useEffect(() => {
    const total = (watchedProducts ?? []).reduce((sum, product) => sum + (Number(product?.monthlyRevenue) || 0), 0);
    if (form.getValues("amount") !== total) {
      form.setValue("amount", total, { shouldDirty: true });
    }
  }, [form, watchedProducts]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    onSuccess?.();
  });

  const isLoading =
    accountsQuery.isLoading ||
    ownersQuery.isLoading ||
    leadsQuery.isLoading ||
    productRulesQuery.isLoading;

  const hasError =
    accountsQuery.isError || ownersQuery.isError || leadsQuery.isError || productRulesQuery.isError;

  if (hasError) {
    return <p className="text-sm text-destructive">No pudimos cargar los catálogos necesarios.</p>;
  }

  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-3xl" />;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input {...form.register("name")}/>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Cuenta <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("accountId")}
            onValueChange={(value) => form.setValue("accountId", value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Owner <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("ownerId")}
            onValueChange={(value) => form.setValue("ownerId", value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.full_name ?? owner.email ?? "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Etapa <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("stage")}
            onValueChange={(value) =>
              form.setValue("stage", value as (typeof OPPORTUNITY_STAGES)[number], { shouldDirty: true })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Probabilidad (%) <span className="text-destructive">*</span>
          </Label>
          <Input type="number" min={0} max={100} {...form.register("probability", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Contrato</Label>
        <Select
          value={form.watch("contractTerm")}
          onValueChange={(value) => form.setValue("contractTerm", value, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sin_contrato">Sin contrato</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
            <SelectItem value="18">18 meses</SelectItem>
            <SelectItem value="24">24 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Monto estimado ($) <span className="text-destructive">*</span>
          </Label>
          <Input type="number" min={0} step={100} {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label>Cierre esperado</Label>
          <Input type="date" {...form.register("closeDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lead asociado</Label>
        <Select
          value={form.watch("leadId") ?? "none"}
          onValueChange={(value) => form.setValue("leadId", value, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin lead</SelectItem>
            {leads.map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          Productos <span className="text-destructive">*</span>
        </Label>
        <OpportunityProductForm
          form={form}
          rules={rules}
          contractTermMonths={form.watch("contractTerm") === "sin_contrato" ? null : Number(form.watch("contractTerm"))}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { opportunityFormSchema };
