import { describe, expect, it, vi } from "vitest";
import { INSUREE_ACTIVE_STRING } from "../constants";

vi.mock("@mui/material/styles", () => ({
  styled: () => () => "styled-component",
}));

vi.mock("@openimis/fe-core", () => ({
  Form: "Form",
  Helmet: "Helmet",
  ProgressOrError: "ProgressOrError",
  GetIconComponent: () => () => null,
  formatMessageWithValues: () => "",
  historyPush: vi.fn(),
  journalize: vi.fn(),
  parseData: (data) => data?.edges?.map((edge) => edge.node) ?? [],
  withHistory: (Component) => Component,
  withModulesManager: (Component) => Component,
}));

vi.mock("react-intl", () => ({
  injectIntl: (Component) => Component,
}));

vi.mock("react-redux", () => ({
  connect: () => (Component) => Component,
}));

vi.mock("../actions", () => ({
  clearInsuree: vi.fn(),
  fetchFamily: vi.fn(),
  fetchInsureeFull: vi.fn(),
  fetchInsureeMutation: vi.fn(),
}));

vi.mock("./FamilyDisplayPanel", () => ({
  default: "FamilyDisplayPanel",
}));

vi.mock("../components/InsureeMasterPanel", () => ({
  default: "InsureeMasterPanel",
}));

const modulesManager = {
  getConf: (_module, _key, defaultValue) => defaultValue,
};

const validInsuree = {
  chfId: "CHF-001",
  lastName: "Doe",
  otherNames: "Jane",
  dob: "1990-01-01",
  gender: { code: "F" },
  status: INSUREE_ACTIVE_STRING,
  statusReason: null,
};

const buildForm = async ({ originalInsuree = validInsuree, editedInsuree = validInsuree, lockNew = false, isChfIdValid = true } = {}) => {
  const { InsureeForm } = await import("./InsureeForm");
  const form = new InsureeForm({
    insuree: originalInsuree,
    isChfIdValid,
    modulesManager,
  });

  form.state = {
    ...form.state,
    insuree: editedInsuree,
    lockNew,
  };

  return form;
};

describe("InsureeForm.canSave", () => {
  it("rejects unchanged insurees", async () => {
    const form = await buildForm();

    expect(form.canSave()).toBe(false);
  });

  it("rejects locked forms", async () => {
    const form = await buildForm({
      editedInsuree: { ...validInsuree, otherNames: "Janet" },
      lockNew: true,
    });

    expect(form.canSave()).toBe(false);
  });

  it("rejects invalid insuree numbers", async () => {
    const form = await buildForm({
      editedInsuree: { ...validInsuree, otherNames: "Janet" },
      isChfIdValid: false,
    });

    expect(form.canSave()).toBe(false);
  });

  it("rejects changed insurees that fail business validation", async () => {
    const form = await buildForm({
      editedInsuree: { ...validInsuree, otherNames: null },
    });

    expect(form.canSave()).toBe(false);
  });

  it("accepts changed insurees that pass business validation", async () => {
    const form = await buildForm({
      editedInsuree: { ...validInsuree, otherNames: "Janet" },
    });

    expect(form.canSave()).toBe(true);
  });
});
