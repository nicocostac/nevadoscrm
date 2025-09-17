"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ACTIVITY_PRIORITIES, ACTIVITY_TYPES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
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

const schema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  subject: z.string().min(3, "Describe la actividad"),
  dueDate: z.string().min(1, "Selecciona fecha"),
  ownerId: z.string().min(1, "Selecciona owner"),
  notes: z.string().min(3, "Agrega contexto"),
  priority: z.enum(ACTIVITY_PRIORITIES),
});

export type ActivityFormValues = z.infer<typeof schema>;

type ActivityFormProps = {
  owners: Profile[];
  defaultOwnerId?: string;
  onSubmit: (values: ActivityFormValues) => void;
  isSubmitting: boolean;
};

export function ActivityForm({ owners, defaultOwnerId, onSubmit, isSubmitting }: ActivityFormProps) {
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: ACTIVITY_TYPES[0],
      subject: "",
      dueDate: new Date().toISOString().slice(0, 10),
      ownerId: defaultOwnerId ?? owners[0]?.id ?? "",
      notes: "",
      priority: ACTIVITY_PRIORITIES[1],
    },
  });

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as ActivityFormValues["type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(value) => form.setValue("priority", value as ActivityFormValues["priority"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Asunto</Label>
        <Input id="subject" {...form.register("subject")} />
        <FormError message={form.formState.errors.subject?.message} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Fecha</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
          <FormError message={form.formState.errors.dueDate?.message} />
        </div>
        <div className="space-y-2">
          <Label>Owner</Label>
          <Select
            value={form.watch("ownerId")}
            onValueChange={(value) => form.setValue("ownerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Owner" />
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
        <FormError message={form.formState.errors.notes?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        Registrar actividad
      </Button>
    </form>
  );
}

type FormErrorProps = { message?: string };
function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
