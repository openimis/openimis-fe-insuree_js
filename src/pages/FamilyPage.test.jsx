import { describe, expect, it, vi } from "vitest";
import { ROUTE_INSUREE_FAMILY_NEW, ROUTE_REFS } from "../routes";

// The fe-core barrel cannot be loaded from a test: only what FamilyPage uses.
vi.mock("@openimis/fe-core", () => ({
  formatMessageWithValues: (intl, module, id) => id,
  withModulesManager: (C) => C,
  withHistory: (C) => C,
  historyPush: vi.fn(),
}));
vi.mock("../components/FamilyForm", () => ({ default: () => null }));
vi.mock("../actions", () => ({
  createFamily: vi.fn(),
  updateFamily: vi.fn(),
  clearInsuree: vi.fn(),
  fetchParentFamily: vi.fn(),
}));

const { historyPush } = await import("@openimis/fe-core");
const { FamilyPage } = await import("./FamilyPage");

// The path historyPush navigates to: the ref's route, then the parameters.
const pushedPath = ([, , ref, params = []]) =>
  [ROUTE_REFS.find((route) => route.key === ref)?.ref, ...params].join("/");

describe("FamilyPage", () => {
  it("opens the registered new-family route from the form's add action", () => {
    new FamilyPage({ modulesManager: {}, history: {} }).add();

    expect(pushedPath(historyPush.mock.calls.at(-1))).toBe(ROUTE_INSUREE_FAMILY_NEW);
  });
});
