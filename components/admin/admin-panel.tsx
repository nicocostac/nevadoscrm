"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, UserRoundCog } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { inviteUserAction, updateProfileRoleAction } from "@/app/(app)/actions/profiles";
import { useOwners } from "@/hooks/use-owners";
import { useSessionContext } from "@/lib/auth/session-context";
import { queryKeys } from "@/lib/query/keys";
import type { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ROLE_LABELS: Record<Profile["role"], string> = {
  admin: "Administrador",
  manager: "Manager",
  rep: "Representante",
};

const ROLE_OPTIONS = ["admin", "manager", "rep"] as const;

const inviteSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  role: z.enum(ROLE_OPTIONS),
});

export function AdminPanel() {
  const { profile: currentProfile } = useSessionContext();
  const ownersQuery = useOwners();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "rep" },
  });

  const profiles = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);

  const updateRole = useMutation({
    mutationFn: updateProfileRoleAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.owners });
      toast.success("Rol actualizado");
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo actualizar el rol");
    },
  });

  const inviteUser = useMutation({
    mutationFn: inviteUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.owners });
      toast.success("Invitación enviada");
      inviteForm.reset({ email: "", role: "rep" });
      setInviteOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo enviar la invitación");
    },
  });

  if (ownersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (ownersQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        No fue posible cargar los usuarios de la organización.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden /> Gestión de roles
            </CardTitle>
            <CardDescription>
              Ajusta permisos de la organización. Solo los administradores pueden cambiar roles.
            </CardDescription>
          </div>
          {currentProfile?.role === "admin" ? (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Invitar usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar usuario</DialogTitle>
                  <DialogDescription>
                    Envía una invitación para que defina su contraseña y se una a la organización.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={inviteForm.handleSubmit((values) => inviteUser.mutate(values))}
                >
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Correo</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="usuario@nevados.cl"
                      {...inviteForm.register("email")}
                      aria-invalid={!!inviteForm.formState.errors.email}
                    />
                    {inviteForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {inviteForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Rol inicial</Label>
                    <Select
                      value={inviteForm.watch("role")}
                      onValueChange={(value) => inviteForm.setValue("role", value as Profile["role"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={inviteUser.isPending}>
                      {inviteUser.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      ) : null}
                      Enviar invitación
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="h-5 w-5" aria-hidden /> Usuarios
          </CardTitle>
          <CardDescription>
            Lista sincronizada con Supabase (org: {currentProfile?.org_id ?? "-"}).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const canEdit = currentProfile?.role === "admin" && profile.id !== currentProfile.id;
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-semibold">
                      {profile.full_name ?? "Sin nombre"}
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        disabled={!canEdit || updateRole.isPending}
                        onValueChange={(value) =>
                          updateRole.mutate({ profileId: profile.id, role: value as Profile["role"] })
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {profile.id === currentProfile?.id ? (
                        <Badge variant="secondary">Tú</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">ID: {profile.id}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
