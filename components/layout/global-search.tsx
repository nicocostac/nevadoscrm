"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { navItems } from "@/lib/navigation";
import { useSessionContext } from "@/lib/auth/session-context";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type GlobalSearchProps = {
  onCreateLead: () => void;
};

export function GlobalSearch({ onCreateLead }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { profile } = useSessionContext();
  const items = profile?.role === "admin" ? navItems : navItems.filter((item) => item.href !== "/admin");

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "n" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onCreateLead();
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onCreateLead]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex w-full items-center justify-between gap-3 text-sm text-muted-foreground sm:w-80"
        onClick={() => setOpen(true)}
        aria-label="Abrir búsqueda global"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" aria-hidden />
          Buscar...
        </span>
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-xs font-semibold sm:flex">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Explorar CRM">
        <CommandInput placeholder="Busca páginas o acciones" />
        <CommandList>
          <CommandEmpty>Sin resultados. Prueba con otra palabra.</CommandEmpty>
          <CommandGroup heading="Navegación">
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${item.description}`}
                onSelect={() => navigate(item.href)}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Acciones rápidas">
            <CommandItem value="nuevo lead" onSelect={() => onCreateLead()}>
              <Plus className="h-4 w-4" aria-hidden />
              <span>Crear lead</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘ + N</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
