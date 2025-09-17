"use client";

import type { ReactNode } from "react";

import { useLeadSheetStore } from "@/lib/stores/lead-sheet-store";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LeadSheet } from "@/components/leads/lead-sheet";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const openCreateLead = useLeadSheetStore((state) => state.openCreate);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader onCreateLead={openCreateLead} />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8">{children}</main>
        <MobileNav />
        <LeadSheet />
      </div>
    </div>
  );
}
