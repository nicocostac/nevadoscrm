"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAccounts, useContactMutations } from "@/hooks/use-accounts";
import { useOwners } from "@/hooks/use-owners";
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
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().min(8, "Número inválido").optional().or(z.literal("")),
  title: z.string().optional(),
  ownerId: z.string().min(1, "Selecciona owner"),
  accountId: z.string().min(1, "Selecciona una cuenta"),
});

export function CreateContactDialog() {
  const [open, setOpen] = useState(false);
  const ownersQuery = useOwners();
  const accountsQuery = useAccounts();
  const { create } = useContactMutations();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      ownerId: "",
      accountId: "",
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

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        title: values.title,
        ownerId: values.ownerId,
        accountId: values.accountId,
      });
      setOpen(false);
      form.reset({
        name: "",
        email: "",
        phone: "",
        title: "",
        ownerId: ownersQuery.data?.[0]?.id ?? "",
        accountId: accountsQuery.data?.[0]?.id ?? "",
      });
    } catch (error) {
      console.error(error);
    }
  });

  const loading = ownersQuery.isLoading || accountsQuery.isLoading;
  const hasOwners = (ownersQuery.data?.length ?? 0) > 0;
  const hasAccounts = (accountsQuery.data?.length ?? 0) > 0;
  const disabled = loading || !hasOwners || !hasAccounts;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          Nuevo contacto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear contacto</DialogTitle>
        </DialogHeader>
        {ownersQuery.isError || accountsQuery.isError ? (
          <p className="text-sm text-destructive">No se pudieron cargar catálogos. Intenta nuevamente.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando información…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="contact-name" required aria-required {...form.register("name")} />
              <FormError message={form.formState.errors.name?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Correo</Label>
                <Input id="contact-email" type="email" {...form.register("email")} />
                <FormError message={form.formState.errors.email?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Teléfono</Label>
                <Input id="contact-phone" {...form.register("phone")} />
                <FormError message={form.formState.errors.phone?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-title">Cargo</Label>
              <Input id="contact-title" {...form.register("title")} />
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
            <DialogFooter>
              <Button type="submit" disabled={create.isPending || disabled}>
                Guardar contacto
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
