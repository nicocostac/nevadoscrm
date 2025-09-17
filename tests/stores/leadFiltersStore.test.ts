import { afterEach, describe, expect, it } from "vitest";

import { useLeadFiltersStore } from "@/lib/stores/leads-filters-store";

describe("useLeadFiltersStore", () => {
  afterEach(() => {
    useLeadFiltersStore.setState({
      search: "",
      owner: "todos",
      stage: "todas",
      source: "todas",
      lastActivity: "todas",
    });
  });

  it("updates search and owner filters", () => {
    useLeadFiltersStore.getState().setSearch("valentina");
    useLeadFiltersStore.getState().setOwner("owner-1");

    const state = useLeadFiltersStore.getState();
    expect(state.search).toBe("valentina");
    expect(state.owner).toBe("owner-1");
  });

  it("resets to default values", () => {
    useLeadFiltersStore.setState({
      search: "demo",
      owner: "Luis",
      stage: "Nuevo",
      source: "Web",
      lastActivity: "7",
    });

    useLeadFiltersStore.getState().reset();

    expect(useLeadFiltersStore.getState()).toMatchObject({
      search: "",
      owner: "todos",
      stage: "todas",
      source: "todas",
      lastActivity: "todas",
    });
  });
});
