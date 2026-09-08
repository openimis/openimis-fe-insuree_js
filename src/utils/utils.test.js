import { describe, expect, it } from "vitest";
import { INSUREE_ACTIVE_STRING, INSUREE_INACTIVE_STRING } from "../constants";
import { isValidInsuree } from "./utils";

const modulesManager = (config = {}) => ({
  getConf: (module, key, defaultValue) => config[`${module}.${key}`] ?? defaultValue,
});

const validInsuree = {
  chfId: "CHF-001",
  lastName: "Doe",
  otherNames: "Jane",
  dob: "1990-01-01",
  gender: { code: "F" },
  status: INSUREE_ACTIVE_STRING,
  statusReason: null,
};

describe("isValidInsuree", () => {
  it("accepts a complete active insuree", () => {
    expect(isValidInsuree(validInsuree, modulesManager())).toBe(true);
  });

  it.each([
    ["chfId"],
    ["lastName"],
    ["otherNames"],
    ["dob"],
  ])("rejects an insuree without %s", (field) => {
    expect(isValidInsuree({ ...validInsuree, [field]: null }, modulesManager())).toBe(false);
  });

  it("rejects an insuree without a gender code", () => {
    expect(isValidInsuree({ ...validInsuree, gender: {} }, modulesManager())).toBe(false);
  });

  it("rejects an expired insuree", () => {
    expect(isValidInsuree({ ...validInsuree, validityTo: "2024-01-01" }, modulesManager())).toBe(false);
  });

  it("enforces first service point when configured", () => {
    const mm = modulesManager({
      "fe-insuree.insureeForm.isInsureeFirstServicePointRequired": true,
    });

    expect(isValidInsuree(validInsuree, mm)).toBe(false);
    expect(isValidInsuree({ ...validInsuree, healthFacility: { id: "HF-1" } }, mm)).toBe(true);
  });

  it("enforces photo when configured", () => {
    const mm = modulesManager({
      "fe-insuree.insureeForm.isInsureePhotoRequired": true,
    });

    expect(isValidInsuree(validInsuree, mm)).toBe(false);
    expect(
      isValidInsuree(
        {
          ...validInsuree,
          photo: { date: "2024-01-01", officerId: "OFF-1" },
        },
        mm,
      ),
    ).toBe(true);
  });

  it("rejects incomplete photo metadata", () => {
    expect(isValidInsuree({ ...validInsuree, photo: { date: "2024-01-01" } }, modulesManager())).toBe(false);
  });

  it("enforces status when configured", () => {
    const mm = modulesManager({
      "fe-insuree.insureeForm.isInsureeStatusRequired": true,
    });

    expect(isValidInsuree({ ...validInsuree, status: null }, mm)).toBe(false);
  });

  it("requires status date and reason for non-active statuses", () => {
    const inactiveInsuree = { ...validInsuree, status: INSUREE_INACTIVE_STRING };

    expect(isValidInsuree(inactiveInsuree, modulesManager())).toBe(false);
    expect(
      isValidInsuree(
        {
          ...inactiveInsuree,
          statusDate: "2024-01-01",
          statusReason: { id: "reason-1" },
        },
        modulesManager(),
      ),
    ).toBe(true);
  });
});
