import { create } from "zustand";

type LeadSheetMode = "create" | "edit";

type LeadSheetState = {
  isOpen: boolean;
  mode: LeadSheetMode;
  leadId: string | null;
  openCreate: () => void;
  openEdit: (leadId: string) => void;
  close: () => void;
};

export const useLeadSheetStore = create<LeadSheetState>((set) => ({
  isOpen: false,
  mode: "create",
  leadId: null,
  openCreate: () => set({ isOpen: true, mode: "create", leadId: null }),
  openEdit: (leadId) => set({ isOpen: true, mode: "edit", leadId }),
  close: () => set({ isOpen: false }),
}));
