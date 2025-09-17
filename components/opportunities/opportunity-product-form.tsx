"use client";

import { useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const productSchema = z.object({
  productId: z.string().optional().or(z.literal("custom")),
  name: z.string().min(2, "Ingresa un producto"),
  category: z.string().optional(),
  quantity: z.coerce.number().min(1, "Cantidad inválida"),
  pricingMode: z.enum(["concesión", "alquiler", "venta"], {
    required_error: "Selecciona modalidad",
  }),
  monthlyRevenue: z.coerce.number().min(0, "Revenue inválido"),
  notes: z.string().optional(),
});

const schema = z.object({
  products: z.array(productSchema).min(1, "Agrega al menos un producto"),
});

export type OpportunityProductFormValues = z.infer<typeof schema>;

type OpportunityProductFormProps = {
  initialProducts?: OpportunityProductFormValues["products"];
  onSubmit: (values: OpportunityProductFormValues) => void;
  isSubmitting?: boolean;
};

export function OpportunityProductForm({ initialProducts, onSubmit, isSubmitting }: OpportunityProductFormProps) {
  const productsQuery = useProducts();
  const form = useForm<OpportunityProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      products: initialProducts ?? [
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const productOptions = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  if (productsQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (productsQuery.isError) {
    return <p className="text-sm text-destructive">No pudimos cargar el catálogo de productos.</p>;
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-xl border border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={form.control}
              name={`products.${index}.productId`}
              render={({ field: controllerField }) => (
                <div className="space-y-2">
                  <Label>Catálogo</Label>
                  <Select
                    value={controllerField.value ?? "custom"}
                    onValueChange={(value) => {
                      controllerField.onChange(value);
                      if (value === "custom") {
                        return;
                      }
                      const product = productOptions.find((item) => item.id === value);
                      if (product) {
                        form.setValue(`products.${index}.name`, product.name, { shouldDirty: true });
                        form.setValue(`products.${index}.category`, product.category, { shouldDirty: true });
                        form.setValue(`products.${index}.pricingMode`, product.pricing_mode, { shouldDirty: true });
                        form.setValue(
                          `products.${index}.monthlyRevenue`,
                          product.base_monthly_revenue ?? 0,
                          { shouldDirty: true }
                        );
                      }
                    }}
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
                </div>
              )}
            />
            <div className="space-y-2">
              <Label>
                Modalidad <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch(`products.${index}.pricingMode`)}
                onValueChange={(value) => form.setValue(`products.${index}.pricingMode`, value as "concesión" | "alquiler" | "venta", { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="alquiler">Alquiler</SelectItem>
                  <SelectItem value="concesión">Concesión</SelectItem>
                </SelectContent>
              </Select>
              <FormError message={form.formState.errors.products?.[index]?.pricingMode?.message} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input {...form.register(`products.${index}.name` as const)} required aria-required />
              <FormError message={form.formState.errors.products?.[index]?.name?.message} />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input {...form.register(`products.${index}.category` as const)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input type="number" min={1} {...form.register(`products.${index}.quantity` as const)} />
              <FormError message={form.formState.errors.products?.[index]?.quantity?.message} />
            </div>
            <div className="space-y-2">
              <Label>
                Revenue mensual ($) <span className="text-destructive">*</span>
              </Label>
              <Input type="number" min={0} step={1000} {...form.register(`products.${index}.monthlyRevenue` as const)} />
              <FormError message={form.formState.errors.products?.[index]?.monthlyRevenue?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea rows={2} {...form.register(`products.${index}.notes` as const)} placeholder="Observaciones sobre la propuesta" />
          </div>
          {fields.length > 1 ? (
            <Button type="button" variant="outline" onClick={() => remove(index)}>
              Quitar producto
            </Button>
          ) : null}
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            append({
              productId: "custom",
              name: "",
              category: "",
              quantity: 1,
              pricingMode: "venta",
              monthlyRevenue: 0,
              notes: "",
            })
          }
        >
          Agregar otro producto
        </Button>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Guardar productos
      </Button>
    </form>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
