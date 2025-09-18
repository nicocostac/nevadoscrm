"use client";

import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";

import { useProductRules } from "@/hooks/use-product-rules";
import { useProductRuleDeleteMutation } from "@/hooks/use-product-rule-mutations";
import { useProducts } from "@/hooks/use-products";
import type { ProductRule } from "@/lib/types";
import { ProductRuleFormDialog } from "@/components/product-rules/product-rule-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductRulesView() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProductRule | null>(null);

  const rulesQuery = useProductRules();
  const productsQuery = useProducts({ includeInactive: true });
  const deleteMutation = useProductRuleDeleteMutation();

  const productsById = new Map<string, string>();
  productsQuery.data?.forEach((product) => {
    productsById.set(product.id, product.name);
  });

  const openCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const openEdit = (rule: ProductRule) => {
    setSelected(rule);
    setOpen(true);
  };

  const handleDelete = async (rule: ProductRule) => {
    if (deleteMutation.isPending) return;
    await deleteMutation.mutateAsync(rule.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Reglas comerciales</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Automatiza precios, beneficios y condiciones según el volumen, el tipo de servicio y la zona. Se aplican al generar oportunidades y se pueden ajustar sin tocar código.
          </p>
        </div>
        <Button onClick={openCreate} className="md:self-center">
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Nueva regla
        </Button>
      </header>

      {rulesQuery.isError ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          No pudimos cargar las reglas. Ejecuta las migraciones y vuelve a intentarlo.
        </div>
      ) : rulesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : rulesQuery.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-base font-semibold">Aún no tienes reglas configuradas</p>
          <p className="max-w-sm text-sm text-muted-foreground">Define precios por tramo, beneficios de comodato y condiciones especiales de despacho para automatizar las propuestas.</p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Crear regla
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rulesQuery.data?.map((rule) => (
            <Card key={rule.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{rule.name}</h2>
                  {!rule.is_active ? <Badge variant="outline">Inactiva</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{rule.description ?? "Sin descripción"}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {rule.product_id ? (
                    <Badge variant="secondary">{productsById.get(rule.product_id) ?? "Producto"}</Badge>
                  ) : null}
                  {rule.product_category ? <Badge variant="secondary">{rule.product_category}</Badge> : null}
                  {rule.coverage_zone ? <Badge variant="secondary">Zona: {rule.coverage_zone}</Badge> : null}
                  {rule.service_type ? <Badge variant="secondary">Servicio: {rule.service_type}</Badge> : null}
                  <Badge variant="outline">Prioridad {rule.priority}</Badge>
                </div>
                <RuleDetails rule={rule} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(rule)}>
                  <Edit2 className="mr-2 h-4 w-4" aria-hidden /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(rule)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductRuleFormDialog open={open} onOpenChange={setOpen} rule={selected} />
    </div>
  );
}

function RuleDetails({ rule }: { rule: ProductRule }) {
  const conditions = rule.conditions ?? {};
  const effects = rule.effects ?? {};

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {conditions.quantity ? (
        <p>
          Cantidad: {conditions.quantity.min ?? 0} - {conditions.quantity.max ?? "+"}
        </p>
      ) : null}
      {conditions.contract ? <p>Requiere contrato</p> : null}
      {conditions.contractMonths ? <p>Contrato mínimo: {conditions.contractMonths} meses</p> : null}
      {conditions.orderTotal ? (
        <p>
          Pedido total: {conditions.orderTotal.min ?? 0} - {conditions.orderTotal.max ?? "+"}
        </p>
      ) : null}
      {typeof effects.unitPrice === "number" ? <p>Precio unitario: ${effects.unitPrice.toLocaleString("es-CL")}</p> : null}
      {effects.extraCharge ? <p>Cargo extra: ${effects.extraCharge.toLocaleString("es-CL")}</p> : null}
      {effects.benefits && effects.benefits.length > 0 ? (
        <p>Beneficios: {effects.benefits.join(", ")}</p>
      ) : null}
      {effects.notes ? <p>Notas: {effects.notes}</p> : null}
    </div>
  );
}
