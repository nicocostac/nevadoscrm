"use client";

import { useMemo, useState } from "react";

import { useOpportunityCreateMutation } from "@/hooks/use-opportunities";
import { OpportunityForm, createEmptyOpportunityFormValues, type OpportunityFormValues } from "@/components/opportunities/opportunity-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateOpportunityDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useOpportunityCreateMutation();
  const defaultValues = useMemo(() => createEmptyOpportunityFormValues(), []);

  const handleSubmit = async (values: OpportunityFormValues) => {
    const contractTerm = values.contractTerm === "sin_contrato" ? null : Number(values.contractTerm);

    await createMutation.mutateAsync({
      name: values.name,
      accountId: values.accountId,
      ownerId: values.ownerId,
      stage: values.stage,
      amount: values.amount,
      probability: values.probability,
      closeDate: values.closeDate || null,
      leadId: values.leadId && values.leadId !== "none" ? values.leadId : null,
      hasContract: contractTerm !== null,
      contractTermMonths: contractTerm,
      coverageZone: null,
      serviceType: null,
      products: values.products,
    });
  };

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nueva oportunidad</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear oportunidad</DialogTitle>
          <DialogDescription>
            Define los productos incluidos y proyecta el revenue mensual esperado para esta propuesta.
          </DialogDescription>
        </DialogHeader>
        <OpportunityForm
          key={open ? "open" : "closed"}
          mode="create"
          defaultValues={defaultValues}
          submitLabel="Guardar oportunidad"
          onSubmit={handleSubmit}
          onSuccess={handleSuccess}
          isSubmitting={createMutation.isPending}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
