"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "sonner";

import { useSessionContext } from "@/lib/auth/session-context";
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

const passwordSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const magicSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

type LoginClientProps = {
  allowMagicLink: boolean;
};

export function LoginClient({ allowMagicLink }: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") ?? "/dashboard", [searchParams]);
  const supabase = useSupabaseClient();
  const { session } = useSessionContext();
  const [loading, setLoading] = useState(false);
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });
  const magicForm = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (session) {
      router.replace(redirect);
    }
  }, [redirect, router, session]);

  const loginWithPassword = passwordForm.handleSubmit(async ({ email, password }) => {
    if (allowMagicLink) {
      toast.error("Por favor, usa el enlace mágico para la configuración inicial.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Sesión iniciada");
      router.replace(redirect);
    } catch (error) {
      console.error(error);
      toast.error("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  });

  const sendMagicLink = magicForm.handleSubmit(async ({ email }) => {
    if (!allowMagicLink) {
      toast.error("El acceso por enlace ya no está habilitado");
      return;
    }
    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      toast.success("Revisa tu correo", {
        description: "Te enviamos un enlace para ingresar al CRM.",
      });
    } catch (error) {
      console.error(error);
      toast.error("No pudimos enviar el enlace. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  });

  const sendResetPassword = async (email: string) => {
    try {
      if (!email) {
        toast.error("Ingresa un correo para recuperar la contraseña");
        return;
      }
      setLoading(true);
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success("Revisa tu correo", {
        description: "Te enviamos un enlace para crear una nueva contraseña.",
      });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar el enlace de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const passwordFormView = (
    <>
      <form onSubmit={loginWithPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-password">Correo</Label>
          <Input
            id="email-password"
            type="email"
            placeholder="tu.nombre@nevados.cl"
            {...passwordForm.register("email")}
            aria-invalid={!!passwordForm.formState.errors.email}
          />
          {passwordForm.formState.errors.email && (
            <p className="text-sm text-destructive">
              {passwordForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••"
            {...passwordForm.register("password")}
            aria-invalid={!!passwordForm.formState.errors.password}
          />
          {passwordForm.formState.errors.password && (
            <p className="text-sm text-destructive">
              {passwordForm.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Unlock className="mr-2 h-4 w-4" aria-hidden />}
          Entrar
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-sm"
        onClick={() => sendResetPassword(passwordForm.getValues("email"))}
        disabled={loading}
      >
        ¿Olvidaste tu contraseña?
      </Button>
    </>
  );

  const magicFormView = (
    <form onSubmit={sendMagicLink} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-magic">Correo</Label>
        <Input
          id="email-magic"
          type="email"
          placeholder="tu.nombre@nevados.cl"
          {...magicForm.register("email")}
          aria-invalid={!!magicForm.formState.errors.email}
        />
        {magicForm.formState.errors.email && (
          <p className="text-sm text-destructive">
            {magicForm.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Send className="mr-2 h-4 w-4" aria-hidden />}
        Enviar enlace mágico
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden /> Nevados CRM
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Acceso sólo por invitación. Si eres admin, invita usuarios desde el panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {allowMagicLink ? (
            <div className="space-y-4">
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
                Primera configuración: solicita un enlace mágico para crear tu cuenta de administrador.
              </div>
              {magicFormView}
              <p className="text-center text-xs text-muted-foreground">
                Después de ingresar te pediremos definir una contraseña. A partir de entonces, el acceso será sólo con correo y contraseña.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {passwordFormView}
              <p className="text-center text-xs text-muted-foreground">
                El ingreso por enlace mágico ya no está habilitado. Usa tu contraseña o solicita una invitación al administrador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
