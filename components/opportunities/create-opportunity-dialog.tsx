"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAccounts } from "@/hooks/use-accounts";
import { useLeads } from "@/hooks/use-leads";
import { useOpportunityCreateMutation } from "@/hooks/use-opportunities";
import { OpportunityProductForm, type OpportunityProductFormValues } from "@/components/opportunities/opportunity-product-form";
import { useOwners } from "@/hooks/use-owners";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2, "Ingresa un nombre"),
  accountId: z.string().min(1, "Selecciona una cuenta"),
  ownerId: z.string().min(1, "Selecciona owner"),
  stage: z.enum(OPPORTUNITY_STAGES as [Opportunity["stage"], ...Opportunity["stage"][]]),
  amount: z.coerce.number().min(0, "Monto inválido"),
  probability: z.coerce.number().min(0).max(100),
  closeDate: z.string().optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("none")),
  products: z
    .array(
      z.object({
        productId: z.string().optional().or(z.literal("custom")),
        name: z.string().min(2, "Producto requerido"),
        category: z.string().optional().or(z.literal("")),
        quantity: z.coerce.number().min(1, "Cantidad inválida"),
        pricingMode: z.enum(["concesión", "alquiler", "venta"]),
        monthlyRevenue: z.coerce.number().min(0, "Revenue inválido"),
        notes: z.string().optional().or(z.literal("")),
      })
    )
    .min(1, "Agrega al menos un producto"),
});

const NO_LEAD_VALUE = "none";

export function CreateOpportunityDialog() {
  const [open, setOpen] = useState(false);
  const ownersQuery = useOwners();
  const accountsQuery = useAccounts();
  const leadsQuery = useLeads();
  const createMutation = useOpportunityCreateMutation();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      accountId: "",
      ownerId: "",
      stage: OPPORTUNITY_STAGES[0],
      amount: 0,
      probability: 50,
      closeDate: "",
      leadId: NO_LEAD_VALUE,
      products: [
        {
          productId: "custom",
          name: "Recargas",
          category: "Recarga",
          quantity: 1,
          pricingMode: "venta",
          monthlyRevenue: 0,
          notes: "",
        },
      ],
    },
  });

  useEffect(() => {
    if (!form.getValues("ownerId") && ownersQuery.data && ownersQuery.data.length > 0) {
      form.setValue("ownerId", ownersQuery.data[0].id, { shouldDirty: false });
    }
  }, [form, ownersQuery.data]);

  useEffect(() => {
    if (!form.getValues("accountId") && accountsQuery.data && accountsQuery.data.length > 0) {
      form.setValue("accountId", accountsQuery.data[0].id, { shouldDirty: false });
    }
  }, [accountsQuery.data, form]);

  const leadsOptions = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        accountId: values.accountId,
        ownerId: values.ownerId,
        stage: values.stage,
        amount: values.amount,
        probability: values.probability,
        closeDate: values.closeDate || null,
        leadId: values.leadId && values.leadId !== NO_LEAD_VALUE ? values.leadId : null,
        products: values.products,
      });
      setOpen(false);
      form.reset({
        name: "",
        accountId: accountsQuery.data?.[0]?.id ?? "",
        ownerId: ownersQuery.data?.[0]?.id ?? "",
        stage: OPPORTUNITY_STAGES[0],
        amount: 0,
        probability: 50,
        closeDate: "",
        leadId: NO_LEAD_VALUE,
        products: [
          {
            productId: "custom",
            name: "Recargas",
            category: "Recarga",
            quantity: 1,
            pricingMode: "venta",
            monthlyRevenue: 0,
            notes: "",
          },
        ],
      });
    } catch (error) {
      console.error(error);
    }
  });

  const loading = ownersQuery.isLoading || accountsQuery.isLoading || leadsQuery.isLoading;
  const hasOwners = (ownersQuery.data?.length ?? 0) > 0;
  const hasAccounts = (accountsQuery.data?.length ?? 0) > 0;
  const disabled = loading || !hasOwners || !hasAccounts;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          Nueva oportunidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear oportunidad</DialogTitle>
        </DialogHeader>
        {ownersQuery.isError || accountsQuery.isError || leadsQuery.isError ? (
          <p className="text-sm text-destructive">No se pudieron cargar catálogos. Intenta nuevamente.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando información…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="opportunity-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="opportunity-name" required aria-required {...form.register("name")} />
              <FormError message={form.formState.errors.name?.message} />
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
                    {accountsQuery.data?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={form.formState.errors.accountId?.message} />
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
                    {ownersQuery.data?.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.full_name ?? owner.email ?? "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={form.formState.errors.ownerId?.message} />
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
                <FormError message={form.formState.errors.stage?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">
                  Probabilidad (%) <span className="text-destructive">*</span>
                </Label>
                <Input id="probability" type="number" min={0} max={100} required aria-required {...form.register("probability")} />
                <FormError message={form.formState.errors.probability?.message} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Monto estimado ($) <span className="text-destructive">*</span>
                </Label>
                <Input id="amount" type="number" min={0} step={1000} required aria-required {...form.register("amount")} />
                <FormError message={form.formState.errors.amount?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeDate">Cierre esperado</Label>
                <Input id="closeDate" type="date" {...form.register("closeDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lead asociado</Label>
              <Select
                value={form.watch("leadId") ?? NO_LEAD_VALUE}
                onValueChange={(value) => form.setValue("leadId", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LEAD_VALUE}>Sin lead</SelectItem>
                  {leadsOptions.map((lead) => (
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
                initialProducts={form.watch("products")}
                onSubmit={(values: OpportunityProductFormValues) => {
                  form.setValue("products", values.products, { shouldDirty: true });
                }}
              />
              <FormError message={form.formState.errors.products?.message as string} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || disabled}>
                Guardar oportunidad
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
