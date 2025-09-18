"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { AuthApiError } from "@supabase/supabase-js";

import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateRecovery = async () => {
      try {
        const [sessionResponse, userResponse] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        const activeSession = sessionResponse.data.session;
        const currentUser = userResponse.data.user;

        if (!activeSession || !currentUser) {
          throw new Error("recovery-session-missing");
        }

        const sessionEmail = currentUser.email ?? currentUser.user_metadata?.email ?? null;
        setEmail(typeof sessionEmail === "string" ? sessionEmail : null);
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to validate recovery session", error);
        toast.error("El enlace de recuperación no es válido o expiró.");
        router.replace("/login");
      }
    };
    void validateRecovery();
  }, [router, supabase]);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        const updatedEmail = user.email ?? user.user_metadata?.email ?? null;
        setEmail(typeof updatedEmail === "string" ? updatedEmail : null);
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            requires_password_reset: false,
            email: user.email,
          })
          .eq("id", user.id);
        if (profileError) throw profileError;
      }
      toast.success("Contraseña actualizada");
      const redirectTo = searchParams.get("redirect") ?? "/dashboard";
      const safeRedirect = redirectTo && redirectTo !== "undefined" ? redirectTo : "/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = safeRedirect;
      } else {
        router.replace(safeRedirect);
      }
    } catch (error) {
      console.error(error);
      let message = "No se pudo actualizar la contraseña";
      if (error instanceof AuthApiError) {
        message =
          error.message?.trim() === "New password should be different from the old password."
            ? "La nueva contraseña debe ser diferente a la anterior."
            : error.message ?? message;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      form.setError("password", { type: "server", message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Ingresa una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email ? (
            <p className="mb-4 text-center text-sm font-medium text-foreground">Cuenta: {email}</p>
          ) : null}
          <div className="mb-4 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            Requisitos: mínimo 6 caracteres, confirmar exactamente la misma contraseña y debe ser distinta a la anterior.
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
                disabled={!sessionReady || loading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••"
                {...form.register("confirmPassword")}
                aria-invalid={!!form.formState.errors.confirmPassword}
                disabled={!sessionReady || loading}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!sessionReady || loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LockKeyhole className="mr-2 h-4 w-4" aria-hidden />
              )}
              Guardar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
