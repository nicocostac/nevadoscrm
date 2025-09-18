"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, PackagePlus, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

import { useProducts } from "@/hooks/use-products";
import { useProductToggleMutation } from "@/hooks/use-product-mutations";
import type { PricingMode, Product } from "@/lib/types";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DialogMode = "create" | "edit" | "duplicate";

const PRICING_LABELS: Record<PricingMode, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  concesión: "Concesión",
};

export function ProductsView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [pricingMode, setPricingMode] = useState<"todos" | PricingMode>("todos");
  const [status, setStatus] = useState<"activos" | "todos">("activos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() ? search.trim() : undefined,
      category: category !== "todas" ? category : undefined,
      pricingMode: pricingMode === "todos" ? undefined : pricingMode,
      includeInactive: status === "todos",
    }),
    [category, pricingMode, search, status]
  );

  const { data, isLoading, isError } = useProducts(filters);
  const toggleMutation = useProductToggleMutation();

  const categories = useMemo(() => {
    if (!data) return [] as string[];
    const unique = new Set<string>();
    for (const product of data) {
      if (product.category) {
        unique.add(product.category);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const products = data ?? [];

  const openCreate = () => {
    setDialogMode("create");
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setDialogMode("edit");
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const openDuplicate = (product: Product) => {
    setDialogMode("duplicate");
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleToggleStatus = (product: Product) => {
    toggleMutation.mutate({ id: product.id, isActive: !product.is_active });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Administra el catálogo base para oportunidades: define modalidades permitidas, revenue mensual y reglas de concesión según tipo de cliente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="md:self-center">
            <Link href="/products/rules">
              <Settings2 className="mr-2 h-4 w-4" aria-hidden /> Reglas
            </Link>
          </Button>
          <Button onClick={openCreate} className="md:self-center">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Nuevo producto
          </Button>
        </div>
      </header>

      <section className="space-y-3 rounded-3xl border border-border/60 bg-card/50 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
                <Label htmlFor="product-search" className="sr-only">
                  Buscar
                </Label>
            <Input
              id="product-search"
              placeholder="Buscar por nombre o categoría"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Label className="sr-only" htmlFor="product-category-filter">
              Categoría
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="product-category-filter">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="sr-only" htmlFor="product-pricing-filter">
              Modalidad
            </Label>
            <Select value={pricingMode} onValueChange={(value) => setPricingMode(value as "todos" | PricingMode)}>
              <SelectTrigger id="product-pricing-filter">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las modalidades</SelectItem>
                {Object.entries(PRICING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">Estado:</span>
          <Button
            type="button"
            variant={status === "activos" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus("activos")}
          >
            Solo activos
          </Button>
          <Button
            type="button"
            variant={status === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus("todos")}
          >
            Incluir inactivos
          </Button>
        </div>
      </section>

      {isError ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Ocurrió un error al cargar el catálogo. Verifica las migraciones de Supabase e inténtalo de nuevo.
        </div>
      ) : isLoading ? (
        <div className="space-y-3 rounded-3xl border border-border/60 bg-card/30 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <PackagePlus className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="text-base font-semibold">No hay productos configurados</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ejecuta las migraciones de Supabase o crea el primer producto manualmente para comenzar a ofrecer reglas por cliente.
          </p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Crear producto
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/60 bg-card/50 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Modalidades permitidas</TableHead>
                <TableHead>Reglas de precio</TableHead>
                <TableHead className="text-right">Precio base</TableHead>
                <TableHead className="text-right">Min. concesión</TableHead>
                <TableHead className="text-right">Actualizado</TableHead>
                <TableHead className="w-12" aria-label="Acciones" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} data-state={product.is_active ? "active" : "inactive"}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {!product.is_active ? (
                        <span className="text-xs text-muted-foreground">Inactivo en el catálogo</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.allow_sale ? <Badge variant="secondary">Venta</Badge> : null}
                      {product.allow_rental ? <Badge variant="secondary">Alquiler</Badge> : null}
                      {product.allow_concession ? <Badge variant="secondary">Concesión</Badge> : null}
                      {!product.allow_sale && !product.allow_rental && !product.allow_concession ? (
                        <Badge variant="destructive">Configurar</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.pricing_rules && product.pricing_rules.length > 0 ? (
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {product.pricing_rules
                          .sort((a, b) => a.min_quantity - b.min_quantity)
                          .slice(0, 3)
                          .map((rule) => (
                            <span key={rule.id ?? `${product.id}-${rule.min_quantity}`}
                              className="rounded-full bg-muted px-2 py-0.5">
                              {`${rule.min_quantity}${rule.max_quantity ? `-${rule.max_quantity}` : "+"} u → $${rule.price.toLocaleString("es-CL")}`}
                            </span>
                          ))}
                        {product.pricing_rules.length > 3 ? (
                          <span className="rounded-full bg-muted px-2 py-0.5">+{product.pricing_rules.length - 3} reglas</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin reglas</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.base_unit_price !== null
                      ? `$${product.base_unit_price.toLocaleString("es-CL")}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.min_concession_units !== null
                      ? `${product.min_concession_units.toLocaleString("es-CL")}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(product.updated_at).toLocaleDateString("es-CL", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(product)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDuplicate(product)}>
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleToggleStatus(product)}>
                          {product.is_active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        mode={dialogMode}
      />
    </div>
  );
}
