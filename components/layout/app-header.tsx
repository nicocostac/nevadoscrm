"use client";

import { Bell, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { UserMenu } from "@/components/layout/user-menu";

interface AppHeaderProps {
  onCreateLead: () => void;
}

export function AppHeader({ onCreateLead }: AppHeaderProps) {
  return (
    <TooltipProvider delayDuration={150} disableHoverableContent>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:w-auto">
            <div className="flex items-center gap-3">
              <MobileMenu />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nevados CRM
                </p>
                <h2 className="text-lg font-bold leading-tight">Pipeline del día</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Ver notificaciones"
                  >
                    <Bell className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notificaciones</TooltipContent>
              </Tooltip>
              <Button size="icon" onClick={onCreateLead} aria-label="Nuevo lead">
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
              <UserMenu />
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <GlobalSearch onCreateLead={onCreateLead} />
            <div className="hidden items-center gap-2 sm:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Ver notificaciones"
                  >
                    <Bell className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notificaciones</TooltipContent>
              </Tooltip>
              <Button onClick={onCreateLead} className="hidden sm:inline-flex">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Nuevo lead
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
