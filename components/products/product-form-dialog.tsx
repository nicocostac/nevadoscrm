"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useProductUpsertMutation } from "@/hooks/use-product-mutations";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { PricingMode, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
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

const pricingModes: PricingMode[] = ["venta", "alquiler", "concesión"];

const categoryOptions = PRODUCT_CATEGORIES as readonly string[];

const numericOptional = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") return Number(value);
    return value;
  },
  z
    .number({ invalid_type_error: "Número inválido" })
    .min(0, "Debe ser mayor o igual a 0")
    .optional()
);

const productFormSchema = z
  .object({
    name: z.string().min(2, "Ingresa un nombre"),
    category: z.string().min(2, "Ingresa una categoría"),
    pricingMode: z.enum(pricingModes, { required_error: "Selecciona modalidad principal" }),
    baseUnitPrice: z.preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) return 0;
        if (typeof value === "string") return Number(value);
        return value;
      },
      z.number({ invalid_type_error: "Precio inválido" }).min(0, "Precio inválido")
    ),
    allowSale: z.boolean(),
    allowRental: z.boolean(),
    allowConcession: z.boolean(),
    minConcessionUnits: numericOptional,
    rentalMonthlyFee: numericOptional,
    notes: z.string().max(500, "Máximo 500 caracteres").optional(),
    isActive: z.boolean(),
  })
  .refine((data) => data.allowSale || data.allowRental || data.allowConcession, {
    message: "Selecciona al menos una modalidad permitida",
    path: ["allowedModalities"],
  })
  .refine((data) => data.pricingMode !== "concesión" || data.allowConcession, {
    message: "Activa concesión como modalidad permitida",
    path: ["allowConcession"],
  })
  .refine((data) => data.pricingMode !== "alquiler" || data.allowRental, {
    message: "Activa alquiler como modalidad permitida",
    path: ["allowRental"],
  })
  .refine((data) => !data.allowConcession || data.minConcessionUnits !== undefined, {
    message: "Define el mínimo para conceder",
    path: ["minConcessionUnits"],
  })
  .refine((data) => !data.allowRental || data.rentalMonthlyFee !== undefined, {
    message: "Ingresa el fee mensual de alquiler",
    path: ["rentalMonthlyFee"],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

type DialogMode = "create" | "edit" | "duplicate";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode: DialogMode;
};

export function ProductFormDialog({ open, onOpenChange, product, mode }: ProductFormDialogProps) {
  const mutation = useProductUpsertMutation();

  const defaultValues = useMemo<ProductFormValues>(() => {
    if (!product) {
      return {
        name: "",
        category: categoryOptions[0] ?? "Recargas",
        pricingMode: "venta",
        baseUnitPrice: 0,
        allowSale: true,
        allowRental: false,
        allowConcession: false,
        minConcessionUnits: undefined,
        rentalMonthlyFee: undefined,
        notes: "",
        isActive: true,
      } satisfies ProductFormValues;
    }

    return {
      name: mode === "duplicate" ? `${product.name} (copia)` : product.name,
      category: product.category,
      pricingMode: product.pricing_mode,
      baseUnitPrice: product.base_unit_price ?? 0,
      allowSale: product.allow_sale,
      allowRental: product.allow_rental,
      allowConcession: product.allow_concession,
      minConcessionUnits: product.min_concession_units ?? undefined,
      rentalMonthlyFee: product.rental_monthly_fee ?? undefined,
      notes: product.notes ?? "",
      isActive: mode === "duplicate" ? true : product.is_active,
    } satisfies ProductFormValues;
  }, [mode, product]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        id: mode === "edit" ? product?.id : undefined,
        name: values.name,
        category: values.category,
        pricingMode: values.pricingMode,
        baseUnitPrice: values.baseUnitPrice,
        allowSale: values.allowSale,
        allowRental: values.allowRental,
        allowConcession: values.allowConcession,
        minConcessionUnits: values.allowConcession ? values.minConcessionUnits ?? null : null,
        rentalMonthlyFee: values.allowRental ? values.rentalMonthlyFee ?? null : null,
        notes: values.notes ?? null,
        isActive: values.isActive,
        pricingRules: [],
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  });

  const allowedModalitiesError = (form.formState.errors as Record<string, { message?: string }>)["allowedModalities"]?.message;
  const allowSale = form.watch("allowSale");
  const allowRental = form.watch("allowRental");
  const allowConcession = form.watch("allowConcession");
  const selectedCategory = form.watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Nuevo producto"}
            {mode === "edit" && "Editar producto"}
            {mode === "duplicate" && "Duplicar producto"}
          </DialogTitle>
          <DialogDescription>
            Define las modalidades permitidas y el precio base para usarlo en oportunidades.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="product-name" {...form.register("name")} />
              <FormError message={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryOptions.includes(selectedCategory) ? selectedCategory : "custom"}
                onValueChange={(value) => {
                  if (value === "custom") {
                    form.setValue("category", "", { shouldDirty: true });
                    return;
                  }
                  form.setValue("category", value, { shouldDirty: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Otra categoría…</SelectItem>
                </SelectContent>
              </Select>
              {!categoryOptions.includes(selectedCategory) ? (
                <div className="pt-2">
                  <Input
                    placeholder="Describe la categoría"
                    value={selectedCategory}
                    onChange={(event) => form.setValue("category", event.target.value, { shouldDirty: true })}
                  />
                </div>
              ) : null}
              <FormError message={form.formState.errors.category?.message} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Modalidad principal <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("pricingMode")}
                onValueChange={(value) => form.setValue("pricingMode", value as PricingMode, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode === "venta" ? "Venta" : mode === "alquiler" ? "Alquiler" : "Concesión"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={form.formState.errors.pricingMode?.message} />
            </div>
            <div className="space-y-2">
              <Label>
                Precio base por unidad ($) <span className="text-destructive">*</span>
              </Label>
              <Input type="number" min={0} step={100} {...form.register("baseUnitPrice")} />
              <FormError message={form.formState.errors.baseUnitPrice?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modalidades permitidas</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={allowSale ? "default" : "outline"}
                size="sm"
                onClick={() => form.setValue("allowSale", !allowSale, { shouldDirty: true })}
              >
                Venta
              </Button>
              <Button
                type="button"
                variant={allowRental ? "default" : "outline"}
                size="sm"
                onClick={() => form.setValue("allowRental", !allowRental, { shouldDirty: true })}
              >
                Alquiler
              </Button>
              <Button
                type="button"
                variant={allowConcession ? "default" : "outline"}
                size="sm"
                onClick={() => form.setValue("allowConcession", !allowConcession, { shouldDirty: true })}
              >
                Concesión
              </Button>
            </div>
            <FormError message={allowedModalitiesError} />
          </div>

          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
            Para definir tramos de precio, comodatos o condiciones especiales usa la vista de
            <Button variant="link" size="sm" className="px-1" asChild>
              <Link href="/products/rules">Reglas comerciales</Link>
            </Button>
            . Aquí sólo definimos el precio base y disponibilizamos el producto en el catálogo.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Min. unidades para concesión</Label>
              <Input
                type="number"
                min={0}
                step={1}
                disabled={!form.watch("allowConcession")}
                {...form.register("minConcessionUnits", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
              <FormError message={form.formState.errors.minConcessionUnits?.message} />
            </div>
            <div className="space-y-2">
              <Label>Fee mensual de alquiler</Label>
              <Input
                type="number"
                min={0}
                step={500}
                disabled={!form.watch("allowRental")}
                {...form.register("rentalMonthlyFee", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
              <FormError message={form.formState.errors.rentalMonthlyFee?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea rows={3} {...form.register("notes")} placeholder="Tips o reglas específicas" />
            <FormError message={form.formState.errors.notes?.message} />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/60 p-3">
            <input
              id="product-active"
              type="checkbox"
              className="h-4 w-4"
              checked={form.watch("isActive")}
              onChange={(event) => form.setValue("isActive", event.target.checked, { shouldDirty: true })}
            />
            <Label htmlFor="product-active" className="text-sm font-medium">
              Disponible en el catálogo
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
