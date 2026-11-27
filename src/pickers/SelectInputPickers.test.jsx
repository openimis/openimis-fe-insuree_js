/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { makeStore, renderWithProviders, screen } from "@openimis/fe-core/testing";

vi.mock("../actions", () => ({
  fetchInsureeGenders: vi.fn(() => ({ type: "TEST_FETCH" })),
  fetchFamilyTypes: vi.fn(() => ({ type: "TEST_FETCH" })),
  fetchIdentificationTypes: vi.fn(() => ({ type: "TEST_FETCH" })),
  fetchConfirmationTypes: vi.fn(() => ({ type: "TEST_FETCH" })),
}));

// The fe-core barrel cannot be loaded from a module test: SelectInput shows what it is given.
vi.mock("@openimis/fe-core", async () => ({
  injectIntl: (await import("@openimis/fe-core/testing")).injectIntl,
  withModulesManager: (Component) => (props) => <Component modulesManager={{ getConf: (m, k, d) => d }} {...props} />,
  formatMessage: (intl, module, id) => id,
  SelectInput: ({ loading }) => <span>{loading ? "loading" : "not loading"}</span>,
}));

const { default: InsureeGenderPicker } = await import("./InsureeGenderPicker");
const { default: FamilyTypePicker } = await import("./FamilyTypePicker");
const { default: IdentificationTypePicker } = await import("./IdentificationTypePicker");
const { default: ConfirmationTypePicker } = await import("./ConfirmationTypePicker");

const PICKERS = [
  ["InsureeGenderPicker", InsureeGenderPicker, "InsureeGenders"],
  ["FamilyTypePicker", FamilyTypePicker, "FamilyTypes"],
  ["IdentificationTypePicker", IdentificationTypePicker, "IdentificationTypes"],
  ["ConfirmationTypePicker", ConfirmationTypePicker, "ConfirmationTypes"],
];

// Only the insuree slice: these pickers used to read `fetched*` from `state.medical`.
const renderPicker = (Picker, insuree) =>
  renderWithProviders(<Picker onChange={() => {}} />, {
    store: makeStore({ preloadedState: { insuree }, reducers: { insuree: (s = {}) => s } }),
  });

describe.each(PICKERS)("%s (OP-3280)", (name, Picker, key) => {
  it("is loading before its delayed fetch has started", () => {
    renderPicker(Picker, {});

    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("is loading while fetching", () => {
    renderPicker(Picker, { [`fetching${key}`]: true });

    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("stops loading once fetched", () => {
    renderPicker(Picker, { [`fetched${key}`]: true });

    expect(screen.getByText("not loading")).toBeInTheDocument();
  });

  it("stops loading when the fetch failed", () => {
    renderPicker(Picker, { [`error${key}`]: { detail: "boom" } });

    expect(screen.getByText("not loading")).toBeInTheDocument();
  });
});
