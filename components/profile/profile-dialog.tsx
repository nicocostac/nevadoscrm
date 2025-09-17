"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/lib/auth/session-context";
import { updatePasswordAction, updateProfileDetailsAction } from "@/app/(app)/actions/profiles";

const profileSchema = z.object({
  fullName: z.string().min(2, "Ingresa un nombre válido"),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { profile } = useSessionContext();
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, setPasswordPending] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile?.full_name ?? "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (profile?.full_name) {
      profileForm.reset({ fullName: profile.full_name });
    }
  }, [profile?.full_name, profileForm]);

  const submitProfile = profileForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateProfileDetailsAction({ fullName: values.fullName });
        toast.success("Perfil actualizado");
        onOpenChange(false);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo actualizar el perfil");
      }
    });
  });

  const submitPassword = passwordForm.handleSubmit(async ({ newPassword }) => {
    try {
      setPasswordPending(true);
      await updatePasswordAction({ password: newPassword });
      toast.success("Contraseña actualizada");
      passwordForm.reset({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la contraseña");
    } finally {
      setPasswordPending(false);
    }
  });

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuración de cuenta</DialogTitle>
          <DialogDescription>
            Actualiza tu nombre y administra tu contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Datos personales
            </h3>
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  placeholder="Nombre y apellido"
                  {...profileForm.register("fullName")}
                  aria-invalid={!!profileForm.formState.errors.fullName}
                />
                {profileForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </section>
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-primary" aria-hidden /> Seguridad
            </h3>
            <form onSubmit={submitPassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••"
                    {...passwordForm.register("newPassword")}
                    aria-invalid={!!passwordForm.formState.errors.newPassword}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    {...passwordForm.register("confirmPassword")}
                    aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" variant="outline" disabled={isPasswordPending}>
                  {isPasswordPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Actualizar contraseña
                </Button>
              </DialogFooter>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
