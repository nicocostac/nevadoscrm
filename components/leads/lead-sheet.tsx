"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccounts, useContacts } from "@/hooks/use-accounts";
import { useLead, useLeadMutations } from "@/hooks/use-leads";
import { useOwners } from "@/hooks/use-owners";
import { useSessionContext } from "@/lib/auth/session-context";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import { useLeadSheetStore } from "@/lib/stores/lead-sheet-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadForm, type LeadFormValues } from "@/components/leads/lead-form";

export function LeadSheet() {
  const { isOpen, mode, leadId, close } = useLeadSheetStore();
  const ownersQuery = useOwners();
  const accountsQuery = useAccounts();
  const contactsQuery = useContacts();
  const leadQuery = useLead(leadId ?? "");
  const { create, update, remove } = useLeadMutations();
  const queryClient = useQueryClient();
  const { profile } = useSessionContext();

  useEffect(() => {
    if (!isOpen && leadId) {
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(leadId) });
    }
  }, [isOpen, leadId, queryClient]);

  const loadingOptions =
    ownersQuery.isLoading || accountsQuery.isLoading || contactsQuery.isLoading;

  const hasError =
    ownersQuery.isError || accountsQuery.isError || contactsQuery.isError;

  const defaultValues: Partial<LeadFormValues> | undefined = (() => {
    if (mode === "edit" && leadQuery.data) {
      return {
        name: leadQuery.data.name,
        company: leadQuery.data.company ?? "",
        title: leadQuery.data.title ?? "",
        email: leadQuery.data.email ?? "",
        phone: leadQuery.data.phone ?? "",
        ownerId: leadQuery.data.owner_id ?? ownersQuery.data?.[0]?.id ?? "",
        stage: leadQuery.data.stage,
        source: leadQuery.data.source,
        value: leadQuery.data.value ?? 0,
        notes: leadQuery.data.notes ?? "",
        teamId: leadQuery.data.team_id,
        accountId: leadQuery.data.account_id ?? accountsQuery.data?.[0]?.id ?? "",
        contactId: leadQuery.data.contact_id,
      };
    }

    if (mode === "create") {
      return {
        ownerId: profile?.id ?? ownersQuery.data?.[0]?.id ?? "",
      };
    }

    return undefined;
  })();

  const toPayload = (values: LeadFormValues) => ({
    ...values,
    company: values.company && values.company.length > 0 ? values.company : null,
    title: values.title && values.title.length > 0 ? values.title : null,
    email: values.email && values.email.length > 0 ? values.email : null,
    phone: values.phone && values.phone.length > 0 ? values.phone : null,
    notes: values.notes && values.notes.length > 0 ? values.notes : null,
    teamId: values.teamId ?? null,
    contactId: values.contactId ?? null,
  });

  const handleSubmit = (values: LeadFormValues) => {
    const payload = toPayload(values);
    if (mode === "create") {
      create.mutate(payload, {
        onSuccess: () => {
          close();
        },
      });
    } else if (mode === "edit" && leadId) {
      update.mutate(
        {
          id: leadId,
          ...payload,
        },
        {
          onSuccess: () => {
            close();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!leadId) return;
    const confirmed = window.confirm("¿Eliminar este lead?");
    if (!confirmed) return;
    remove.mutate(leadId, {
      onSuccess: () => {
        close();
        toast.success("Lead eliminado");
      },
    });
  };

  const isSubmitting = create.isPending || update.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background/95 px-4 pb-6 sm:h-auto sm:max-w-xl sm:rounded-lg"
      >
        <SheetHeader className="space-y-2 text-left">
          <SheetTitle>{mode === "create" ? "Nuevo lead" : "Editar lead"}</SheetTitle>
          <SheetDescription>
            Gestiona leads sin salir del flujo. Los campos mínimos se completan en menos de 3 toques en móvil.
          </SheetDescription>
        </SheetHeader>
        {hasError ? (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Error al cargar catálogos. Actualiza la página.
          </div>
        ) : loadingOptions || (mode === "edit" && leadQuery.isLoading) ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : mode === "edit" && leadQuery.data === null ? (
          <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            No encontramos este lead. Selecciona otro registro.
          </div>
        ) : (
          <div className="mt-4">
            <LeadForm
              mode={mode}
              owners={ownersQuery.data ?? []}
              accounts={accountsQuery.data?.map((account) => ({
                id: account.id,
                name: account.name,
              })) ?? []}
              contacts={contactsQuery.data ?? []}
              isSubmitting={isSubmitting}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              canEditOwner={profile?.role !== "rep"}
            />
          </div>
        )}
        {mode === "edit" && leadId ? (
          <SheetFooter className={cn("mt-6 flex-col items-stretch gap-2 sm:flex-row")}> 
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              Eliminar lead
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
