"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileMenu() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir navegación"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-semibold">Nevados CRM</SheetTitle>
        </SheetHeader>
        <nav aria-label="Secciones" className="mt-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="mt-0.5 h-4 w-4" aria-hidden />
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
