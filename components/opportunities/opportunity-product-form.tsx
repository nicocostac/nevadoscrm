"use client";

import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";

import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { evaluateProductRules } from "@/lib/rules/apply-product-rules";
import type { PricingMode, Product, ProductRule } from "@/lib/types";

export const opportunityProductRowSchema = z.object({
  productId: z.string().optional().or(z.literal("custom")),
  name: z.string().min(2, "Producto requerido"),
  category: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(1, "Cantidad inválida"),
  pricingMode: z.enum(["concesión", "alquiler", "venta"]),
  monthlyRevenue: z.coerce.number().min(0, "Revenue inválido"),
  notes: z.string().optional().or(z.literal("")),
  unitPrice: z.number().nullable().optional(),
  benefits: z.array(z.string()).nullable().optional(),
  extraCharges: z.number().nullable().optional(),
  appliedRuleIds: z.array(z.string()).nullable().optional(),
  ruleSnapshot: z.unknown().nullable().optional(),
});

export type OpportunityProductFormValues = z.infer<typeof opportunityProductRowSchema>;

type ProductFieldErrors = Partial<Record<keyof OpportunityProductFormValues, { message?: string }>>;

const PRICING_MODES: PricingMode[] = ["venta", "alquiler", "concesión"];

function allowedModesForProduct(product?: Product) {
  if (!product) {
    return {
      venta: true,
      alquiler: true,
      concesión: true,
    } satisfies Record<PricingMode, boolean>;
  }
  return {
    venta: product.allow_sale,
    alquiler: product.allow_rental,
    concesión: product.allow_concession,
  } satisfies Record<PricingMode, boolean>;
}

function fallbackPricingMode(product: Product): PricingMode {
  const allowed = allowedModesForProduct(product);
  if (allowed[product.pricing_mode]) {
    return product.pricing_mode;
  }
  for (const mode of PRICING_MODES) {
    if (allowed[mode]) {
      return mode;
    }
  }
  return "venta";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

type OpportunityProductFormProps<FormValues extends { products: OpportunityProductFormValues[] }> = {
  form: UseFormReturn<FormValues>;
  rules: ProductRule[];
  contractTermMonths?: number | null;
  isSubmitting?: boolean;
};

export function OpportunityProductForm<FormValues extends { products: OpportunityProductFormValues[] }>({
  form,
  rules,
  contractTermMonths,
  isSubmitting,
}: OpportunityProductFormProps<FormValues>) {
  const productsQuery = useProducts();
  const productOptions = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: "products" as const });

  useEffect(() => {
    if (!productOptions.length) return;
    fields.forEach((field, index) => {
      const currentId = getValues(`products.${index}.productId` as const);
      if (!currentId || currentId === "custom") {
        const firstProduct = productOptions[0];
        if (firstProduct) {
          initializeFromProduct(index, firstProduct);
        }
      } else {
        const product = productOptions.find((item) => item.id === currentId);
        if (product) {
          const currentMode = getValues(`products.${index}.pricingMode` as const) as PricingMode;
          const quantity = getValues(`products.${index}.quantity` as const) || 1;
          applyRules(index, product, quantity, currentMode);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productOptions]);

  if (productsQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (productsQuery.isError) {
    return <p className="text-sm text-destructive">No pudimos cargar el catálogo de productos.</p>;
  }

  const contractHasTerm = Boolean(contractTermMonths && contractTermMonths > 0);

  function getOtherRowsTotal(index: number) {
    const items = getValues("products");
    return items.reduce((sum, item, idx) => {
      if (idx === index) return sum;
      return sum + (Number(item.monthlyRevenue) || 0);
    }, 0);
  }

  function initializeFromProduct(index: number, product: Product) {
    setValue(`products.${index}.productId` as const, product.id, { shouldDirty: true });
    setValue(`products.${index}.name` as const, product.name, { shouldDirty: true });
    setValue(`products.${index}.category` as const, product.category, { shouldDirty: true });
    const mode = fallbackPricingMode(product);
    setValue(`products.${index}.pricingMode` as const, mode, { shouldDirty: true });
    applyRules(index, product, getValues(`products.${index}.quantity` as const) || 1, mode);
  }

  function applyRules(index: number, product: Product, quantity: number, mode: PricingMode) {
    if (!product) return;
    const otherRowsTotal = getOtherRowsTotal(index);

    const baseEvaluation = evaluateProductRules(rules, {
      product,
      quantity,
      pricingMode: mode,
      hasContract: contractHasTerm,
      contractTermMonths: contractTermMonths ?? null,
      coverageZone: null,
      serviceType: null,
      orderTotal: otherRowsTotal,
    });

    const baseUnit = baseEvaluation.unitPrice === "solo_agua_consumida"
      ? 0
      : isNumber(baseEvaluation.unitPrice)
        ? baseEvaluation.unitPrice
        : product.base_unit_price ?? 0;
    const baseTotal = (baseEvaluation.total ?? baseUnit * quantity) + (baseEvaluation.extraCharge ?? 0);

    const finalEvaluation = evaluateProductRules(rules, {
      product,
      quantity,
      pricingMode: mode,
      hasContract: contractHasTerm,
      contractTermMonths: contractTermMonths ?? null,
      coverageZone: null,
      serviceType: null,
      orderTotal: otherRowsTotal + baseTotal,
    });

    const finalUnit = finalEvaluation.unitPrice === "solo_agua_consumida"
      ? 0
      : isNumber(finalEvaluation.unitPrice)
        ? finalEvaluation.unitPrice
        : product.base_unit_price ?? 0;

    let finalTotal = finalEvaluation.total ?? finalUnit * quantity;
    if (finalEvaluation.unitPrice === "solo_agua_consumida") {
      finalTotal = 0;
    }
    if (finalEvaluation.extraCharge) {
      finalTotal += finalEvaluation.extraCharge;
    }

    setValue(`products.${index}.unitPrice` as const, finalEvaluation.unitPrice === "solo_agua_consumida" ? null : finalUnit, {
      shouldDirty: false,
    });
    setValue(`products.${index}.monthlyRevenue` as const, Number.isFinite(finalTotal) ? finalTotal : 0, {
      shouldDirty: false,
    });
    setValue(`products.${index}.benefits` as const, finalEvaluation.benefits.length ? finalEvaluation.benefits : null, {
      shouldDirty: false,
    });
    setValue(`products.${index}.extraCharges` as const, finalEvaluation.extraCharge ?? null, { shouldDirty: false });
    setValue(
      `products.${index}.appliedRuleIds` as const,
      finalEvaluation.appliedRuleIds.length ? finalEvaluation.appliedRuleIds : null,
      { shouldDirty: false }
    );
    setValue(`products.${index}.ruleSnapshot` as const, finalEvaluation.ruleSnapshot ?? null, { shouldDirty: false });
  }

  function handleProductChange(index: number, productId: string) {
    if (productId === "custom") {
      setValue(`products.${index}.productId` as const, "custom", { shouldDirty: true });
      setValue(`products.${index}.name` as const, "", { shouldDirty: true });
      setValue(`products.${index}.category` as const, "", { shouldDirty: true });
      return;
    }
    const product = productOptions.find((item) => item.id === productId);
    if (!product) return;
    initializeFromProduct(index, product);
  }

  function handleQuantityChange(index: number, value: number) {
    setValue(`products.${index}.quantity` as const, value, { shouldDirty: true });
    const currentId = getValues(`products.${index}.productId` as const);
    if (!currentId || currentId === "custom") return;
    const product = productOptions.find((item) => item.id === currentId);
    if (!product) return;
    applyRules(index, product, value, getValues(`products.${index}.pricingMode` as const));
  }

  function handlePricingModeChange(index: number, mode: PricingMode) {
    setValue(`products.${index}.pricingMode` as const, mode, { shouldDirty: true });
    const currentId = getValues(`products.${index}.productId` as const);
    if (!currentId || currentId === "custom") return;
    const product = productOptions.find((item) => item.id === currentId);
    if (!product) return;
    applyRules(index, product, getValues(`products.${index}.quantity` as const) || 1, mode);
  }

  function addProductRow() {
    const firstProduct = productOptions[0];
    const fallbackMode = firstProduct ? fallbackPricingMode(firstProduct) : "venta";
    append({
      productId: firstProduct ? firstProduct.id : "custom",
      name: firstProduct ? firstProduct.name : "",
      category: firstProduct ? firstProduct.category : "",
      quantity: 1,
      pricingMode: fallbackMode,
      monthlyRevenue: firstProduct?.base_unit_price ?? 0,
      notes: "",
      unitPrice: firstProduct?.base_unit_price ?? null,
      benefits: null,
      extraCharges: null,
      appliedRuleIds: null,
      ruleSnapshot: null,
    });
    const newIndex = fields.length;
    if (firstProduct) {
      setTimeout(() => {
        applyRules(newIndex, firstProduct, 1, fallbackMode);
      }, 0);
    }
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const productsErrors = errors?.products as unknown as ProductFieldErrors[] | undefined;
        const fieldErrors: ProductFieldErrors = productsErrors?.[index] ?? {};
        const productId = getValues(`products.${index}.productId` as const);
        const selectedProduct =
          productId && productId !== "custom"
            ? productOptions.find((item) => item.id === productId)
            : undefined;
        const allowed = allowedModesForProduct(selectedProduct);

        return (
          <div key={field.id} className="space-y-3 rounded-xl border border-border/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Catálogo</Label>
                <Select
                  value={productId ?? "custom"}
                  onValueChange={(value) => handleProductChange(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Producto del catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Producto manual</SelectItem>
                    {productOptions.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {productId === "custom" ? (
                  <div className="space-y-2">
                    <Label>Nombre del producto</Label>
                    <Input {...register(`products.${index}.name` as const)} />
                    <FormError message={fieldErrors?.name?.message} />
                  </div>
                ) : null}
                <FormError message={fieldErrors?.productId?.message} />
              </div>
              <div className="space-y-2">
                <Label>
                  Modalidad <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={getValues(`products.${index}.pricingMode` as const)}
                  onValueChange={(value) => handlePricingModeChange(index, value as PricingMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta" disabled={!allowed.venta}>
                      Venta
                    </SelectItem>
                    <SelectItem value="alquiler" disabled={!allowed.alquiler}>
                      Alquiler
                    </SelectItem>
                    <SelectItem value="concesión" disabled={!allowed.concesión}>
                      Concesión
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormError message={fieldErrors?.pricingMode?.message} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  {...register(`products.${index}.quantity` as const, {
                    valueAsNumber: true,
                    onChange: (event) => handleQuantityChange(index, Number(event.target.value)),
                  })}
                />
                <FormError message={fieldErrors?.quantity?.message} />
              </div>
              <div className="space-y-2">
                <Label>
                  Monto mensual ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  {...register(`products.${index}.monthlyRevenue` as const, { valueAsNumber: true })}
                />
                <FormError message={fieldErrors?.monthlyRevenue?.message} />
              </div>
            </div>
            <RuleSummary
              unitPrice={getValues(`products.${index}.unitPrice` as const)}
              benefits={getValues(`products.${index}.benefits` as const) ?? []}
              extraCharges={getValues(`products.${index}.extraCharges` as const)}
              ruleSnapshot={getValues(`products.${index}.ruleSnapshot` as const)}
            />
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={2} {...register(`products.${index}.notes` as const)} placeholder="Observaciones sobre la propuesta" />
            </div>
            {fields.length > 1 ? (
              <Button type="button" variant="outline" onClick={() => remove(index)}>
                Quitar producto
              </Button>
            ) : null}
          </div>
        );
      })}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={addProductRow} disabled={isSubmitting}>
          Agregar otro producto
        </Button>
      </div>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

type RuleSummaryProps = {
  unitPrice?: number | null;
  benefits: string[];
  extraCharges?: number | null;
  ruleSnapshot?: ProductRule | null;
};

function RuleSummary({ unitPrice, benefits, extraCharges, ruleSnapshot }: RuleSummaryProps) {
  if (!ruleSnapshot && !benefits?.length && !unitPrice && !extraCharges) {
    return null;
  }

  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted/30 p-3 text-xs text-muted-foreground">
      {ruleSnapshot ? <p className="font-medium text-foreground">Regla aplicada: {ruleSnapshot.name}</p> : null}
      {isNumber(unitPrice) ? <p>Precio sugerido por unidad: ${unitPrice.toLocaleString("es-CL")}</p> : null}
      {extraCharges ? <p>Cargo adicional: ${extraCharges.toLocaleString("es-CL")}</p> : null}
      {benefits && benefits.length > 0 ? <p>Beneficios: {benefits.join(", ")}</p> : null}
      {ruleSnapshot?.effects?.notes ? <p>{ruleSnapshot.effects.notes}</p> : null}
    </div>
  );
}
