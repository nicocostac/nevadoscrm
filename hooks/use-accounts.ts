"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createAccountAction } from "@/app/(app)/actions/accounts";
import { createContactAction } from "@/app/(app)/actions/contacts";
import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Account, Contact } from "@/lib/types";

export function useAccounts() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*, owner:profiles!accounts_owner_id_fkey(id, full_name, email)")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useContacts() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.contacts.all,
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, owner:profiles!contacts_owner_id_fkey(id, full_name, email)")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useAccountMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createAccountAction,
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      toast.success("Cuenta creada", {
        description: `${account.name} se agregó a la cartera`,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo crear la cuenta");
    },
  });

  return { create };
}

export function useContactMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createContactAction,
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      toast.success("Contacto creado", {
        description: `${contact.name} ya está disponible para el equipo`,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo crear el contacto");
    },
  });

  return { create };
}
