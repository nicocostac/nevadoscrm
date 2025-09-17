"use client";

import { useState, type ChangeEvent } from "react";
import { Download, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { registerAttachmentAction } from "@/app/(app)/actions/attachments";
import { useAttachments } from "@/hooks/use-attachments";
import { useSessionContext } from "@/lib/auth/session-context";
import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

interface LeadAttachmentsProps {
  leadId: string;
}

export function LeadAttachments({ leadId }: LeadAttachmentsProps) {
  const { data, isLoading, isError } = useAttachments(leadId);
  const { profile } = useSessionContext();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!profile?.org_id) {
      toast.error("Tu perfil no tiene organización asociada");
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const uniqueId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const fileName = `${uniqueId}.${fileExt ?? "bin"}`;
      const storagePath = `${profile.org_id}/${leadId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("crm-attachments")
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      await registerAttachmentAction({
        leadId,
        storagePath,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byLead(leadId) });
      toast.success("Adjunto cargado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo subir el archivo");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDownload = async (path: string, name: string) => {
    const { data: signed, error } = await supabase
      .storage
      .from("crm-attachments")
      .createSignedUrl(path, 60 * 5);

    if (error || !signed?.signedUrl) {
      toast.error("No se pudo generar el enlace");
      return;
    }

    const link = document.createElement("a");
    link.href = signed.signedUrl;
    link.download = name;
    link.target = "_blank";
    link.rel = "noopener";
    link.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" aria-hidden /> Adjuntos
        </CardTitle>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden />
            )}
            <span>{uploading ? "Subiendo..." : "Agregar adjunto"}</span>
            <input
              type="file"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || !profile?.org_id}
            />
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-destructive">No se pudieron cargar los adjuntos.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay archivos vinculados.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file_size ? Math.round(attachment.file_size / 1024) : 0)} KB · {attachment.created_by?.full_name ?? ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment.storage_path, attachment.file_name)}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden /> Descargar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
