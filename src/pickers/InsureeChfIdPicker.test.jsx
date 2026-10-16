/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, makeStore, renderWithProviders, screen, waitFor } from "@openimis/fe-core/testing";

const { fetchInsuree, modulesManager } = vi.hoisted(() => ({
  fetchInsuree: vi.fn(),
  modulesManager: {
    getConf: (module, key, defaultValue = null) => (key === "debounceTime" ? 0 : defaultValue),
  },
}));
vi.mock("../actions", () => ({ fetchInsuree }));

// The fe-core barrel imports UserPicker before withModulesManager is initialized,
// so the picker gets the few fe-core pieces it renders through, stubbed.
vi.mock("@openimis/fe-core", () => ({
  withModulesManager: (Component) => (props) => <Component modulesManager={modulesManager} {...props} />,
  TextInput: ({ label, value, onChange, readOnly }) => (
    <input aria-label={label} value={value ?? ""} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} />
  ),
  ProgressOrError: ({ progress, error }) =>
    progress ? <span>loading</span> : error ? <span>{error.detail}</span> : null,
  formatMessage: (intl, module, id) => id,
  GRID_RESPONSIVE_HALF: { xs: 12 },
  parseData: (data) => data?.edges?.map((edge) => edge.node) ?? [],
  formatGraphQLError: (payload) =>
    payload.errors ? { detail: payload.errors.map((error) => error.message).join("; ") } : null,
  formatServerError: (payload) => ({ detail: String(payload) }),
}));

import reducer from "../reducer";
import InsureeChfIdPicker from "./InsureeChfIdPicker";

const DENIED = "User not authorized for this operation";

const deniedResponse = {
  type: "INSUREE_INSUREE_RESP",
  payload: {
    errors: [{ message: DENIED }],
    data: { insurees: { edges: [] } },
  },
};

const insureeStore = () => makeStore({ reducers: { insuree: reducer } });

describe("InsureeChfIdPicker", () => {
  it("does not show the error a previous form left in the shared store slot", () => {
    const store = insureeStore();
    store.dispatch(deniedResponse);

    renderWithProviders(<InsureeChfIdPicker onChange={vi.fn()} />, { store });

    expect(screen.queryByText(DENIED)).not.toBeInTheDocument();
  });

  it("shows the error of a lookup it ran itself", async () => {
    fetchInsuree.mockImplementation(() => deniedResponse);
    renderWithProviders(<InsureeChfIdPicker onChange={vi.fn()} />, { store: insureeStore() });

    fireEvent.change(screen.getByLabelText("Insuree.chfId"), { target: { value: "070707070" } });

    await waitFor(() => expect(screen.getByText(DENIED)).toBeInTheDocument());
    expect(fetchInsuree).toHaveBeenCalledWith(modulesManager, "070707070");
  });
});
