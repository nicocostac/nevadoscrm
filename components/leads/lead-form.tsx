"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import type { Account, Contact, Lead, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const leadSchema = z.object({
  name: z.string().min(2, "Ingresa un nombre"),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().min(8, "Número inválido").optional().or(z.literal("")),
  ownerId: z.string().min(1, "Selecciona un owner"),
  stage: z.enum(LEAD_STAGES as [Lead["stage"], ...Lead["stage"][]]),
  source: z.enum(LEAD_SOURCES as [Lead["source"], ...Lead["source"][]]),
  value: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  accountId: z.string().min(1, "Selecciona una cuenta"),
  contactId: z.string().optional().nullable(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  defaultValues?: Partial<LeadFormValues>;
  owners: Profile[];
  contacts: Contact[];
  accounts: Pick<Account, "id" | "name">[];
  isSubmitting: boolean;
  onSubmit: (values: LeadFormValues) => void;
  mode: "create" | "edit";
  canEditOwner?: boolean;
}

export function LeadForm({
  defaultValues,
  owners,
  contacts,
  accounts,
  isSubmitting,
  onSubmit,
  mode,
  canEditOwner = true,
}: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      company: "",
      title: "",
      email: "",
      phone: "",
      ownerId: owners[0]?.id ?? "",
      stage: LEAD_STAGES[0],
      source: LEAD_SOURCES[0],
      value: 15000,
      notes: "",
      teamId: null,
      accountId: accounts[0]?.id ?? "",
      contactId: null,
      ...defaultValues,
    },
  });

  const selectedAccount = form.watch("accountId");
  const selectedContactId = form.watch("contactId");

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => contact.account_id === selectedAccount),
    [contacts, selectedAccount]
  );

  useEffect(() => {
    const account = accounts.find((item) => item.id === selectedAccount);
    if (account && (!defaultValues?.company || defaultValues.company.length === 0)) {
      form.setValue("company", account.name, { shouldDirty: false });
    }
  }, [accounts, defaultValues?.company, form, selectedAccount]);

  useEffect(() => {
    const currentContact = form.getValues("contactId");
    if (currentContact && !filteredContacts.some((contact) => contact.id === currentContact)) {
      form.setValue("contactId", null);
    }
  }, [filteredContacts, form]);

  useEffect(() => {
    if (!selectedContactId) return;
    const contact = contacts.find((item) => item.id === selectedContactId);
    if (!contact) return;
    if (contact.email) form.setValue("email", contact.email, { shouldDirty: false });
    if (contact.phone) form.setValue("phone", contact.phone, { shouldDirty: false });
    if (contact.title) form.setValue("title", contact.title, { shouldDirty: false });
  }, [contacts, form, selectedContactId]);

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input id="name" autoFocus required aria-required {...form.register("name")} />
          <FormError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Empresa</Label>
          <Input id="company" {...form.register("company")} />
          <FormError message={form.formState.errors.company?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Cargo</Label>
          <Input id="title" {...form.register("title")} />
          <FormError message={form.formState.errors.title?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" {...form.register("email")} />
          <FormError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...form.register("phone")} />
          <FormError message={form.formState.errors.phone?.message} />
        </div>
        <div className="space-y-2">
          <Label>
            Owner <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("ownerId")}
            onValueChange={(value) => form.setValue("ownerId", value, { shouldDirty: true })}
            disabled={!canEditOwner}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona owner" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
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
            Etapa <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("stage")}
            onValueChange={(value) => form.setValue("stage", value as Lead["stage"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona etapa" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.stage?.message} />
        </div>
        <div className="space-y-2">
          <Label>
            Fuente <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("source")}
            onValueChange={(value) =>
              form.setValue("source", value as Lead["source"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona fuente" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.source?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">
            Valor estimado ($) <span className="text-destructive">*</span>
          </Label>
          <Input id="value" type="number" min={0} required aria-required {...form.register("value")} />
          <FormError message={form.formState.errors.value?.message} />
        </div>
        <div className="space-y-2">
          <Label>
            Cuenta <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("accountId")}
            onValueChange={(value) => form.setValue("accountId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona cuenta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.accountId?.message} />
        </div>
        <div className="space-y-2">
          <Label>Contacto</Label>
          <Select
            value={selectedContactId ?? "none"}
            onValueChange={(value) =>
              form.setValue("contactId", value === "none" ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona contacto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin contacto</SelectItem>
              {filteredContacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={form.formState.errors.contactId?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} placeholder="Contexto adicional" />
        <FormError message={form.formState.errors.notes?.message ?? undefined} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {mode === "create" ? "Crear lead" : "Guardar cambios"}
      </Button>
    </form>
  );
}

type FormErrorProps = { message?: string };
function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
