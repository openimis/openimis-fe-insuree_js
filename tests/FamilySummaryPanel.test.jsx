// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { IntlProvider } from "react-intl";

import { setModulesManager } from "./mocks/feCore";
import FamilySummaryPanel from "../src/components/FamilySummaryPanel";

const modulesManagerWith = (productsOrContributions) => ({
  getConf: (module, key, defaultValue) =>
    module === "fe-policy" && key === "productsOrContributions" ? productsOrContributions : defaultValue,
});

// The panel styles rely on the openIMIS theme extensions (paper/table), which
// the host application provides.
const theme = createTheme({
  paper: { paper: {}, header: { backgroundColor: "#b7d4d8" }, title: {} },
  table: { title: {} },
});

const renderPanel = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <FamilySummaryPanel totalPoliciesAmount={100} totalContributions={40} {...props} />
      </ThemeProvider>
    </IntlProvider>,
  );

afterEach(cleanup);

describe("FamilySummaryPanel", () => {
  beforeEach(() => {
    setModulesManager(modulesManagerWith("products"));
  });

  it("is hidden when the instance uses contribution plans (invoice payment mode)", () => {
    setModulesManager(modulesManagerWith("contributions"));

    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to products mode when the configuration is missing", () => {
    setModulesManager({ getConf: (module, key, defaultValue) => defaultValue });

    renderPanel();

    expect(screen.getByText("familyAmountsSummary")).toBeInTheDocument();
  });

  it("renders the family amounts summary in products mode", () => {
    renderPanel();

    expect(screen.getByText("familyAmountsSummary")).toBeInTheDocument();
    expect(screen.getByText("totalPoliciesAmount:")).toBeInTheDocument();
    expect(screen.getByText("totalContributions:")).toBeInTheDocument();
    expect(screen.getByText("balance:")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });
});
