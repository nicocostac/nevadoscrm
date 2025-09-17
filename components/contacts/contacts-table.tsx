"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useContacts } from "@/hooks/use-accounts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";

export function ContactsTable() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useContacts();

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    return data.filter((contact) =>
      `${contact.name} ${contact.email ?? ""} ${contact.title ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  if (isError) {
    return <p className="text-sm text-destructive">No se pudieron cargar los contactos.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Contactos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Búsqueda rápida para llamadas o envíos desde móvil.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar contacto"
              className="pl-9"
              aria-label="Buscar contacto"
            />
          </div>
          <CreateContactDialog />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Última interacción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-semibold">{contact.name}</TableCell>
                <TableCell className="text-sm">
                  <a href={`mailto:${contact.email ?? ""}`} className="hover:underline">
                    {contact.email ?? ""}
                  </a>
                </TableCell>
                <TableCell>
                  <a href={`tel:${contact.phone ?? ""}`} className="hover:underline">
                    {contact.phone ?? ""}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{contact.title ?? ""}</Badge>
                </TableCell>
                <TableCell>
                  {contact.owner?.full_name ?? contact.owner?.email ?? "Sin owner"}
                </TableCell>
                <TableCell>
                  {contact.last_interaction_at
                    ? new Date(contact.last_interaction_at).toLocaleDateString("es-CL")
                    : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
