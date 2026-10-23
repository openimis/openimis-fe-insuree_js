import { describe, expect, it, vi } from "vitest";

// The fe-core barrel cannot be loaded from a test: only what this module reads
// when it loads. PagedDataHandler is the base class; a plain component will do.
vi.mock("@openimis/fe-core", async () => {
  const { Component } = await import("react");
  return {
    PagedDataHandler: class extends Component {},
    GetIconComponent: () => () => null,
    withModulesManager: (C) => C,
    withTooltip: (C) => C,
  };
});
vi.mock("../actions", () => ({
  fetchFamilyMembers: vi.fn(),
  selectFamilyMember: vi.fn(),
  deleteInsuree: vi.fn(),
  removeInsuree: vi.fn(),
  setFamilyHead: vi.fn(),
  changeFamily: vi.fn(),
  checkCanAddInsuree: vi.fn(),
}));
vi.mock("./ChangeInsureeFamilyDialog", () => ({ default: () => null }));
vi.mock("./EnquiryDialog", () => ({ default: () => null }));
vi.mock("./FamilyInsureesSearcher", () => ({ default: () => null }));
vi.mock("./RemoveInsureeFromFamilyDialog", () => ({ default: () => null }));

const { FamilyInsureesOverview } = await import("./FamilyInsureesOverview");

// Journal statuses, as in fe-core helpers/mutations.js.
const RECEIVED = 0;
const SUCCESS = 2;

const family = { uuid: "family-1" };
// A member being deleted carries the id of the mutation deleting it (lockMutated).
const deleting = { uuid: "insuree-1", chfId: "123", clientMutationId: "mutation-1" };

const overview = (mutations) => {
  const props = {
    family,
    familyMembers: [deleting],
    mutations,
    modulesManager: { getConf: (module, key, defaultValue) => defaultValue },
  };
  const component = new FamilyInsureesOverview(props);
  component.props = props;
  component.query = vi.fn();
  return component;
};

const update = (component, mutations) => {
  const prevProps = component.props;
  component.props = { ...prevProps, mutations };
  component.componentDidUpdate(prevProps, component.state);
};

describe("FamilyInsureesOverview", () => {
  it("reloads the members when a member's mutation succeeds", () => {
    const component = overview([{ clientMutationId: "mutation-1", status: RECEIVED }]);

    update(component, [{ clientMutationId: "mutation-1", status: SUCCESS }]);

    expect(component.query).toHaveBeenCalledTimes(1);
  });

  it("does not reload while the member's mutation is still running", () => {
    const component = overview([{ clientMutationId: "mutation-1", status: RECEIVED }]);

    update(component, [
      { clientMutationId: "mutation-1", status: RECEIVED },
      { clientMutationId: "unrelated", status: SUCCESS },
    ]);

    expect(component.query).not.toHaveBeenCalled();
  });
});
