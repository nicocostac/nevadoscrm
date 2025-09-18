"use client";

import { useState, useTransition } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";

import { signOutAction } from "@/app/(app)/actions/auth";
import { useSessionContext } from "@/lib/auth/session-context";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
  const { profile, user } = useSessionContext();
  const [pending, startTransition] = useTransition();
  const [profileOpen, setProfileOpen] = useState(false);

  const fallbackName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? "Invitado";
  const initials = fallbackName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full border border-transparent transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="h-9 w-9">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Usuario"} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{fallbackName}</span>
              <span className="text-xs text-muted-foreground">
                {profile?.email ?? user?.email ?? "Sin correo"}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserRound className="mr-2 h-4 w-4" aria-hidden /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" aria-hidden /> Preferencias
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleSignOut}
            disabled={pending}
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
