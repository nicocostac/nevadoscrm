"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/navigation";
import { useSessionContext } from "@/lib/auth/session-context";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useSessionContext();
  const items = profile?.role === "admin" ? navItems : navItems.filter((item) => item.href !== "/admin");

  return (
    <nav
      className="sticky bottom-0 z-30 mt-6 flex w-full items-center justify-around gap-1 border-t border-border/60 bg-background/95 px-2 py-2 backdrop-blur lg:hidden"
      aria-label="Navegación inferior"
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center rounded-lg px-3 py-1.5 text-[11px] font-medium transition",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className="mb-0.5 h-5 w-5" aria-hidden />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
