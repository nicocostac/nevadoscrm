"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useAccounts } from "@/hooks/use-accounts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";

export function AccountsTable() {
  const { data, isLoading, isError } = useAccounts();

  if (isError) {
    return <p className="text-sm text-destructive">No fue posible cargar las cuentas.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Cuentas</CardTitle>
          <Badge variant="outline">{data.length} registros</Badge>
        </div>
        <CreateAccountDialog />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Industria</TableHead>
              <TableHead>Región</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Sitio web</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-semibold">{account.name}</TableCell>
                <TableCell>
                  {account.owner?.full_name ?? account.owner?.email ?? "Sin asignar"}
                </TableCell>
                <TableCell>{account.industry ?? ""}</TableCell>
                <TableCell>{account.region ?? ""}</TableCell>
                <TableCell>{account.address_line ?? ""}</TableCell>
                <TableCell>
                  {account.website ? (
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {account.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(account.created_at), "dd MMM yyyy", { locale: es })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
