"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      expand
      offset={16}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group bg-background border border-border text-foreground shadow-lg",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton:
            "rounded-full bg-primary px-3 py-1 text-primary-foreground",
          cancelButton:
            "rounded-full border border-input px-3 py-1 text-muted-foreground",
        },
      }}
      closeButton
      richColors
    />
  );
}
