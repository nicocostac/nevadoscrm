import { create } from "zustand";

export type LeadFilterState = {
  search: string;
  owner: string | "todos";
  stage: string | "todas";
  source: string | "todas";
  lastActivity: "7" | "14" | "30" | "todas";
  setSearch: (value: string) => void;
  setOwner: (value: LeadFilterState["owner"]) => void;
  setStage: (value: LeadFilterState["stage"]) => void;
  setSource: (value: LeadFilterState["source"]) => void;
  setLastActivity: (value: LeadFilterState["lastActivity"]) => void;
  reset: () => void;
};

const defaultState = {
  search: "",
  owner: "todos" as const,
  stage: "todas" as const,
  source: "todas" as const,
  lastActivity: "todas" as const,
};

export const useLeadFiltersStore = create<LeadFilterState>((set) => ({
  ...defaultState,
  setSearch: (value) => set({ search: value }),
  setOwner: (value) => set({ owner: value }),
  setStage: (value) => set({ stage: value }),
  setSource: (value) => set({ source: value }),
  setLastActivity: (value) => set({ lastActivity: value }),
  reset: () => set({ ...defaultState }),
}));
