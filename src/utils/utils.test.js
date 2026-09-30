import { describe, expect, it } from "vitest";

import {
  buildParentLocationFilters,
  familyLabel,
  formatLocationString,
  insureeLabel,
  isValidInsuree,
} from "./utils";
import { INSUREE_ACTIVE_STRING } from "../constants";

describe("insureeLabel", () => {
  it("puts the family name first and the insurance number in brackets", () => {
    expect(insureeLabel({ lastName: "Doe", otherNames: "Jane", chfId: "chf-1" })).toBe("Doe Jane (chf-1)");
  });

  it("leaves out the brackets when there is no insurance number", () => {
    expect(insureeLabel({ lastName: "Doe", otherNames: "Jane" })).toBe("Doe Jane");
  });

  it.each([
    ["only a family name", { lastName: "Doe" }, "Doe"],
    ["only other names", { otherNames: "Jane" }, "Jane"],
    ["a missing name", { lastName: "Doe", otherNames: null, chfId: "chf-1" }, "Doe (chf-1)"],
    ["an empty name", { lastName: "", otherNames: "Jane" }, "Jane"],
  ])("does not leave a stray space for %s", (_label, insuree, expected) => {
    expect(insureeLabel(insuree)).toBe(expected);
  });

  it.each([
    ["no insuree", undefined],
    ["a null insuree", null],
  ])("returns an empty string for %s", (_label, insuree) => {
    expect(insureeLabel(insuree)).toBe("");
  });

  it.fails("labels an insuree with a number but no name by the number alone", () => {
    // Currently fails: the empty name still leaves a separating space before the number.
    expect(insureeLabel({ chfId: "chf-1" })).toBe("(chf-1)");
  });
});

describe("familyLabel", () => {
  it("labels a family by its head", () => {
    expect(familyLabel({ headInsuree: { lastName: "Doe", otherNames: "Jane", chfId: "chf-1" } }))
      .toBe("Doe Jane (chf-1)");
  });

  it.each([
    ["no family", undefined],
    ["a null family", null],
    ["a family with no head", { uuid: "fam-1" }],
    ["a family whose head is null", { headInsuree: null }],
  ])("returns an empty string for %s", (_label, family) => {
    expect(familyLabel(family)).toBe("");
  });
});

describe("isValidInsuree", () => {
  const modulesManager = (conf = {}) => ({
    getConf: (_module, key, defaultValue) => (key in conf ? conf[key] : defaultValue),
  });

  const complete = {
    chfId: "chf-1",
    lastName: "Doe",
    otherNames: "Jane",
    dob: "1990-01-01",
    gender: { code: "F" },
  };

  it("accepts an insuree with the always-required fields", () => {
    expect(isValidInsuree(complete, modulesManager())).toBe(true);
  });

  it.each([["chfId"], ["lastName"], ["otherNames"], ["dob"]])("rejects an insuree with no %s", (field) => {
    expect(isValidInsuree({ ...complete, [field]: null }, modulesManager())).toBe(false);
  });

  it.each([
    ["no gender", undefined],
    ["a gender with no code", {}],
  ])("rejects an insuree with %s", (_label, gender) => {
    expect(isValidInsuree({ ...complete, gender }, modulesManager())).toBe(false);
  });

  it("rejects an insuree that has been deleted", () => {
    expect(isValidInsuree({ ...complete, validityTo: "2026-01-01" }, modulesManager())).toBe(false);
  });

  describe("when the health facility is configured as required", () => {
    const conf = { "insureeForm.isInsureeFirstServicePointRequired": true };

    it("rejects an insuree without one", () => {
      expect(isValidInsuree(complete, modulesManager(conf))).toBe(false);
    });

    it("accepts an insuree with one", () => {
      expect(isValidInsuree({ ...complete, healthFacility: { id: "hf-1" } }, modulesManager(conf))).toBe(true);
    });

    it("does not require one by default", () => {
      expect(isValidInsuree(complete, modulesManager())).toBe(true);
    });
  });

  describe("when the photo is configured as required", () => {
    const conf = { "insureeForm.isInsureePhotoRequired": true };
    const photo = { date: "2026-01-01", officerId: "off-1" };

    it("rejects an insuree without one", () => {
      expect(isValidInsuree(complete, modulesManager(conf))).toBe(false);
    });

    it("accepts an insuree with a complete photo", () => {
      expect(isValidInsuree({ ...complete, photo }, modulesManager(conf))).toBe(true);
    });

    it.each([
      ["no date", { officerId: "off-1" }],
      ["no officer", { date: "2026-01-01" }],
    ])("rejects a photo with %s, whether or not photos are required", (_label, incomplete) => {
      expect(isValidInsuree({ ...complete, photo: incomplete }, modulesManager(conf))).toBe(false);
      expect(isValidInsuree({ ...complete, photo: incomplete }, modulesManager())).toBe(false);
    });
  });

  describe("when the status is configured as required", () => {
    const conf = { "insureeForm.isInsureeStatusRequired": true };

    it("rejects an insuree without one", () => {
      expect(isValidInsuree(complete, modulesManager(conf))).toBe(false);
    });

    it("accepts an active insuree without a status date or reason", () => {
      expect(isValidInsuree({ ...complete, status: INSUREE_ACTIVE_STRING }, modulesManager(conf))).toBe(true);
    });

    it.each([
      ["no status date", { status: "IN", statusReason: { code: "SR1" } }],
      ["no status reason", { status: "IN", statusDate: "2026-01-01" }],
    ])("rejects an insuree who is not active and has %s", (_label, status) => {
      expect(isValidInsuree({ ...complete, ...status }, modulesManager(conf))).toBe(false);
    });

    it("accepts an insuree who is not active and explains why", () => {
      const insuree = { ...complete, status: "IN", statusDate: "2026-01-01", statusReason: { code: "SR1" } };

      expect(isValidInsuree(insuree, modulesManager(conf))).toBe(true);
    });
  });

  it("requires the date and reason of a non-active status even when the status itself is optional", () => {
    expect(isValidInsuree({ ...complete, status: "IN" }, modulesManager())).toBe(false);
  });

  it("accepts a non-active status with a date and reason when the status itself is optional", () => {
    const insuree = { ...complete, status: "IN", statusDate: "2026-01-01", statusReason: { code: "SR1" } };

    expect(isValidInsuree(insuree, modulesManager())).toBe(true);
  });
});

describe("buildParentLocationFilters", () => {
  const village = {
    uuid: "village-uuid",
    name: "Village",
    parent: { uuid: "ward-uuid", name: "Ward", parent: { uuid: "region-uuid", name: "Region" } },
  };

  it("filters on the deepest location and states how deep it is", () => {
    const [anchor] = buildParentLocationFilters(village);

    expect(anchor).toEqual({
      id: "parentLocation",
      value: village,
      filter: 'parentLocation: "village-uuid", parentLocationLevel: 2',
    });
  });

  it("names the filter after the anchor it was given", () => {
    const [anchor] = buildParentLocationFilters(village, "location");

    expect(anchor.id).toBe("location");
    expect(anchor.filter).toBe('location: "village-uuid", locationLevel: 2');
  });

  it("carries the lineage top down, one entry per level", () => {
    const filters = buildParentLocationFilters(village);

    expect(filters.slice(1).map((filter) => filter.id))
      .toEqual(["parentLocation_0", "parentLocation_1", "parentLocation_2", "parentLocation_3"]);
    expect(filters.slice(1).map((filter) => filter.value?.name)).toEqual(["Region", "Ward", "Village", undefined]);
  });

  it("contributes no query text for the per-level entries", () => {
    expect(buildParentLocationFilters(village).slice(1).every((filter) => filter.filter === "")).toBe(true);
  });

  it("respects a different number of location levels", () => {
    expect(buildParentLocationFilters(village, "parentLocation", 2)).toHaveLength(3);
  });

  it.each([
    ["no location", undefined],
    ["a null location", null],
  ])("clears the anchor for %s while keeping the level entries", (_label, location) => {
    const filters = buildParentLocationFilters(location);

    expect(filters[0]).toEqual({ id: "parentLocation", value: null, filter: null });
    expect(filters).toHaveLength(5);
    expect(filters.slice(1).every((filter) => filter.value === null)).toBe(true);
  });

  it("reports level zero for a top-level location", () => {
    expect(buildParentLocationFilters({ uuid: "region-uuid", name: "Region" })[0].filter)
      .toBe('parentLocation: "region-uuid", parentLocationLevel: 0');
  });
});

describe("formatLocationString", () => {
  const village = {
    name: "Village",
    parent: { name: "Ward", parent: { name: "District", parent: { name: "Region" } } },
  };

  it("reads the hierarchy from the top down and ends with the street address", () => {
    expect(formatLocationString({ location: village, address: "1 Main St" }))
      .toBe("Region, District, Ward, Village, 1 Main St");
  });

  it("leaves out the levels a shallow hierarchy does not have", () => {
    expect(formatLocationString({ location: { name: "Region" }, address: "1 Main St" })).toBe("Region, 1 Main St");
  });

  it("leaves out an address that was not given", () => {
    expect(formatLocationString({ location: village })).toBe("Region, District, Ward, Village");
  });

  it.each([
    ["a family with no location", { address: "1 Main St" }, "1 Main St"],
    ["a family with nothing at all", {}, ""],
  ])("returns what it can for %s", (_label, family, expected) => {
    expect(formatLocationString(family)).toBe(expected);
  });
});
