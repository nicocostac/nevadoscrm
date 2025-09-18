"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useProducts } from "@/hooks/use-products";
import { useProductRuleMutation } from "@/hooks/use-product-rule-mutations";
import { COVERAGE_ZONES, PRODUCT_CATEGORIES, PRODUCT_RULE_BENEFITS, SERVICE_TYPES } from "@/lib/constants";
import type { ProductRule } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ANY_VALUE = "any";

const conditionSchema = z.object({
  name: z.string().min(2, "Ingresa un nombre"),
  description: z.string().optional(),
  productId: z.string().default(ANY_VALUE),
  productCategory: z.string().default(ANY_VALUE),
  serviceType: z.string().default(ANY_VALUE),
  coverageZone: z.string().default(ANY_VALUE),
  priority: z.coerce.number().min(0).default(100),
  isActive: z.boolean().default(true),
  quantityMin: z.coerce.number().optional().or(z.literal("")),
  quantityMax: z.coerce.number().optional().or(z.literal("")),
  contract: z.boolean().optional(),
  contractMonths: z.coerce.number().optional().or(z.literal("")),
  orderTotalMin: z.coerce.number().optional().or(z.literal("")),
  orderTotalMax: z.coerce.number().optional().or(z.literal("")),
  unitPrice: z.coerce.number().optional().or(z.literal("")),
  extraCharge: z.coerce.number().optional().or(z.literal("")),
  minOrder: z.coerce.number().optional().or(z.literal("")),
  benefits: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type ProductRuleFormValues = z.infer<typeof conditionSchema>;

type ProductRuleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ProductRule | null;
};

export function ProductRuleFormDialog({ open, onOpenChange, rule }: ProductRuleFormDialogProps) {
  const productsQuery = useProducts({ includeInactive: true });
  const mutation = useProductRuleMutation();

  const defaultValues = useMemo<ProductRuleFormValues>(() => {
    if (!rule) {
      return {
        name: "",
        description: "",
        productId: ANY_VALUE,
        productCategory: ANY_VALUE,
        serviceType: ANY_VALUE,
        coverageZone: ANY_VALUE,
        priority: 100,
        isActive: true,
        quantityMin: "",
        quantityMax: "",
        contract: false,
        contractMonths: "",
        orderTotalMin: "",
        orderTotalMax: "",
        unitPrice: "",
        extraCharge: "",
        minOrder: "",
        benefits: [],
        notes: "",
      } satisfies ProductRuleFormValues;
    }

    const quantity = rule.conditions.quantity ?? {};
    const orderTotal = rule.conditions.orderTotal ?? {};
    const contract = rule.conditions.contract ?? false;

    return {
      name: rule.name,
      description: rule.description ?? "",
      productId: rule.product_id ?? ANY_VALUE,
      productCategory: rule.product_category ?? ANY_VALUE,
      serviceType: rule.service_type ?? ANY_VALUE,
      coverageZone: rule.coverage_zone ?? ANY_VALUE,
      priority: rule.priority ?? 100,
      isActive: rule.is_active,
      quantityMin: quantity.min ?? "",
      quantityMax: quantity.max ?? "",
      contract: contract === true,
      contractMonths: rule.conditions.contractMonths ?? "",
      orderTotalMin: orderTotal.min ?? "",
      orderTotalMax: orderTotal.max ?? "",
      unitPrice: typeof rule.effects.unitPrice === "number" ? rule.effects.unitPrice : "",
      extraCharge: rule.effects.extraCharge ?? "",
      minOrder: rule.effects.minOrder ?? "",
      benefits: rule.effects.benefits ?? [],
      notes: rule.effects.notes ?? "",
    } satisfies ProductRuleFormValues;
  }, [rule]);

  const form = useForm<ProductRuleFormValues>({
    resolver: zodResolver(conditionSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const requiresContract = values.contract === true;
      await mutation.mutateAsync({
        id: rule?.id,
        name: values.name,
        description: values.description ?? null,
        productId: values.productId === ANY_VALUE ? null : values.productId,
        productCategory: values.productCategory === ANY_VALUE ? null : values.productCategory,
        serviceType: values.serviceType === ANY_VALUE ? null : values.serviceType,
        coverageZone: values.coverageZone === ANY_VALUE ? null : values.coverageZone,
        priority: values.priority,
        isActive: values.isActive,
        conditions: {
          product: values.productId === ANY_VALUE ? null : values.productId,
          productCategory: values.productCategory === ANY_VALUE ? null : values.productCategory,
          quantity:
            values.quantityMin || values.quantityMax
              ? {
                  min: values.quantityMin ? Number(values.quantityMin) : null,
                  max: values.quantityMax ? Number(values.quantityMax) : null,
                }
              : null,
          contract: requiresContract ? true : null,
          contractMonths: requiresContract
            ? values.contractMonths
              ? Number(values.contractMonths)
              : null
            : null,
          zone: values.coverageZone === ANY_VALUE ? null : values.coverageZone,
          serviceType: values.serviceType === ANY_VALUE ? null : values.serviceType,
          orderTotal:
            values.orderTotalMin || values.orderTotalMax
              ? {
                  min: values.orderTotalMin ? Number(values.orderTotalMin) : null,
                  max: values.orderTotalMax ? Number(values.orderTotalMax) : null,
                }
              : null,
        },
        effects: {
          unitPrice: values.unitPrice === "" ? null : Number(values.unitPrice),
          extraCharge: values.extraCharge === "" ? null : Number(values.extraCharge),
          minOrder: values.minOrder === "" ? null : Number(values.minOrder),
          benefits: values.benefits && values.benefits.length > 0 ? values.benefits : null,
          notes: values.notes ?? null,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar regla" : "Nueva regla"}</DialogTitle>
          <DialogDescription>
            Configura condiciones y beneficios para que se apliquen automáticamente al agregar productos en oportunidades.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Input type="number" min={0} {...form.register("priority", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select
                value={form.watch("productId") ?? ANY_VALUE}
                onValueChange={(value) => form.setValue("productId", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin vínculo específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Todos los productos</SelectItem>
                  {productsQuery.data?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.watch("productCategory") ?? ANY_VALUE}
                onValueChange={(value) => form.setValue("productCategory", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Todas</SelectItem>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select
                value={form.watch("coverageZone") ?? ANY_VALUE}
                onValueChange={(value) => form.setValue("coverageZone", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Cualquiera</SelectItem>
                  {COVERAGE_ZONES.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de servicio</Label>
              <Select
                value={form.watch("serviceType") ?? ANY_VALUE}
                onValueChange={(value) => form.setValue("serviceType", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Cualquiera</SelectItem>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Desde cantidad</Label>
              <Input type="number" min={0} {...form.register("quantityMin")} />
            </div>
            <div className="space-y-2">
              <Label>Hasta cantidad</Label>
              <Input type="number" min={0} {...form.register("quantityMax")} />
            </div>
            <div className="space-y-2">
              <Label>Mínimo pedido total</Label>
              <Input type="number" min={0} {...form.register("minOrder")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 p-3">
              <input
                id="rule-contract"
                type="checkbox"
                className="h-4 w-4"
                checked={form.watch("contract")}
                onChange={(event) => form.setValue("contract", event.target.checked, { shouldDirty: true })}
              />
              <Label htmlFor="rule-contract" className="text-sm font-medium">
                Requiere contrato
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Contrato (meses)</Label>
              <Input type="number" min={0} {...form.register("contractMonths")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pedido mínimo ($)</Label>
              <Input type="number" min={0} {...form.register("orderTotalMin")} />
            </div>
            <div className="space-y-2">
              <Label>Pedido máximo ($)</Label>
              <Input type="number" min={0} {...form.register("orderTotalMax")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Precio unitario sugerido ($)</Label>
              <Input type="number" min={0} {...form.register("unitPrice")} />
            </div>
            <div className="space-y-2">
              <Label>Cargo extra ($)</Label>
              <Input type="number" min={0} {...form.register("extraCharge")} />
            </div>
            <div className="space-y-2">
              <Label>Beneficios</Label>
              <div className="grid gap-1">
                {PRODUCT_RULE_BENEFITS.map((benefit) => {
                  const selected = form.watch("benefits") ?? [];
                  return (
                    <label key={benefit} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selected.includes(benefit)}
                        onChange={(event) => {
                          const current = new Set(selected);
                          if (event.target.checked) {
                            current.add(benefit);
                          } else {
                            current.delete(benefit);
                          }
                          form.setValue("benefits", Array.from(current), { shouldDirty: true });
                        }}
                      />
                      {benefit}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas automáticas</Label>
            <Textarea rows={2} {...form.register("notes")} />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/60 p-3">
            <input
              id="rule-active"
              type="checkbox"
              className="h-4 w-4"
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked, { shouldDirty: true })}
            />
            <Label htmlFor="rule-active" className="text-sm font-medium">
              Regla activa
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar regla"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
