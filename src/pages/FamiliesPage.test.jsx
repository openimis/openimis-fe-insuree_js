import { describe, expect, it, vi } from "vitest";
import { ROUTE_INSUREE_FAMILY_NEW, ROUTE_REFS } from "../routes";

// The fe-core barrel cannot be loaded from a test: only what FamiliesPage uses.
vi.mock("@openimis/fe-core", () => ({
  GetIconComponent: () => () => null,
  historyPush: vi.fn(),
  withModulesManager: (C) => C,
  withHistory: (C) => C,
  withTooltip: (C) => C,
  formatMessage: (intl, module, id) => id,
  clearCurrentPaginationPage: () => ({ type: "TEST_CLEAR_PAGINATION" }),
}));
vi.mock("../components/FamilySearcher", () => ({ default: () => null }));

const { historyPush } = await import("@openimis/fe-core");
const { FamiliesPage } = await import("./FamiliesPage");

// The path historyPush navigates to: the ref's route, then the parameters.
const pushedPath = ([, , ref, params = []]) =>
  [ROUTE_REFS.find((route) => route.key === ref)?.ref, ...params].join("/");

describe("FamiliesPage", () => {
  it("opens the registered new-family route from Create new Family", () => {
    new FamiliesPage({ modulesManager: {}, history: {} }).onAdd();

    expect(pushedPath(historyPush.mock.calls.at(-1))).toBe(ROUTE_INSUREE_FAMILY_NEW);
  });
});
