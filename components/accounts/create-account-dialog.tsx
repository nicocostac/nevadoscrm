"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAccountMutations } from "@/hooks/use-accounts";
import { useOwners } from "@/hooks/use-owners";
import { ACCOUNT_INDUSTRIES, CHILE_REGIONS } from "@/lib/constants";
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

const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

const schema = z.object({
  name: z.string().min(2, "Ingresa un nombre"),
  ownerId: z.string().min(1, "Selecciona un owner"),
  industry: z.enum(ACCOUNT_INDUSTRIES, { required_error: "Selecciona una industria" }),
  region: z.enum(CHILE_REGIONS, { required_error: "Selecciona una región" }),
  addressLine: z.string().min(5, "Ingresa la dirección"),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || urlPattern.test(value.trim()), {
      message: "Ingresa una URL válida",
    }),
});

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const ownersQuery = useOwners();
  const { create } = useAccountMutations();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ownerId: "",
      industry: ACCOUNT_INDUSTRIES[0],
      region: CHILE_REGIONS[0],
      addressLine: "",
      website: "",
    },
  });

  useEffect(() => {
    if (!form.getValues("ownerId") && ownersQuery.data && ownersQuery.data.length > 0) {
      form.setValue("ownerId", ownersQuery.data[0].id, { shouldDirty: false });
    }
  }, [form, ownersQuery.data]);

  const industries = useMemo(() => ACCOUNT_INDUSTRIES, []);
  const regions = useMemo(() => CHILE_REGIONS, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const rawWebsite = values.website?.trim() ?? "";
      const formattedWebsite = rawWebsite
        ? rawWebsite.startsWith("http://") || rawWebsite.startsWith("https://")
          ? rawWebsite
          : `https://${rawWebsite}`
        : undefined;

      await create.mutateAsync({
        name: values.name,
        ownerId: values.ownerId,
        industry: values.industry,
        region: values.region,
        addressLine: values.addressLine,
        website: formattedWebsite,
      });
      setOpen(false);
      form.reset({
        name: "",
        ownerId: ownersQuery.data?.[0]?.id ?? "",
        industry: ACCOUNT_INDUSTRIES[0],
        region: CHILE_REGIONS[0],
        addressLine: "",
        website: "",
      });
    } catch (error) {
      console.error(error);
    }
  });

  const loading = ownersQuery.isLoading;
  const hasOwners = (ownersQuery.data?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={loading || !hasOwners}>
          Nueva cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear cuenta</DialogTitle>
        </DialogHeader>
        {ownersQuery.isError ? (
          <p className="text-sm text-destructive">No pudimos cargar los owners. Intenta nuevamente.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando información…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="account-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="account-name" required aria-required {...form.register("name")} />
              <FormError message={form.formState.errors.name?.message} />
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
                  <SelectValue placeholder="Selecciona owner" />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Industria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("industry")}
                  onValueChange={(value) =>
                    form.setValue("industry", value as (typeof industries)[number], { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={form.formState.errors.industry?.message} />
              </div>
              <div className="space-y-2">
                <Label>
                  Región <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("region")}
                  onValueChange={(value) =>
                    form.setValue("region", value as (typeof regions)[number], { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={form.formState.errors.region?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input id="addressLine" required aria-required {...form.register("addressLine")} />
              <FormError message={form.formState.errors.addressLine?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sitio web</Label>
              <Input id="website" placeholder="https://" {...form.register("website")} />
              <FormError message={form.formState.errors.website?.message} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending || !hasOwners}>
                Guardar cuenta
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
