"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { navItems } from "@/lib/navigation";
import { useSessionContext } from "@/lib/auth/session-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const pathname = usePathname();
  const { profile } = useSessionContext();
  const items = profile?.role === "admin" ? navItems : navItems.filter((item) => item.href !== "/admin");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-background/60 backdrop-blur lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Nevados</p>
          <h1 className="text-xl font-bold">Mini CRM</h1>
        </div>
        <Badge variant="secondary">Fase 1</Badge>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-8">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  <div className="flex flex-1 flex-col text-left">
                    <span>{item.title}</span>
                    <span className="text-xs font-normal text-muted-foreground/80 group-hover:text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground/70 transition group-hover:translate-x-0.5",
                      isActive && "text-primary-foreground"
                    )}
                    aria-hidden
                  />
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/40" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
