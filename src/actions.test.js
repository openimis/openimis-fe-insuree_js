import { describe, expect, it, vi } from "vitest";

// The fe-core barrel cannot be loaded whole in a module test (UserPicker import
// cycle); fetchInsuree only needs a query formatter and graphql.
vi.mock("@openimis/fe-core", () => ({
  formatPageQuery: (entity, filters, projections) => `${entity}(${filters.join(",")}){${projections.join(",")}}`,
  graphql: (payload, type) => ({ payload, type }),
}));

import { fetchInsuree } from "./actions";

const modulesManager = { getProjection: () => "{id, uuid, code, name, location{id, parent{id}}}" };

describe("fetchInsuree", () => {
  const { payload, type } = fetchInsuree(modulesManager, "070707070");

  it("looks the CHFID up nationwide", () => {
    expect(type).toBe("INSUREE_INSUREE");
    expect(payload).toContain('chfId:"070707070", ignoreLocation:true');
  });

  it("keeps what the forms it serves read", () => {
    for (const field of ["id", "uuid", "chfId", "lastName", "otherNames", "dob", "family{id,uuid}"]) {
      expect(payload).toContain(field);
    }
  });

  it("leaves the family head and the location tree to the insuree page", () => {
    expect(payload).not.toContain("headInsuree");
    expect(payload).not.toContain("location");
    expect(payload).not.toContain("parent");
  });
});
