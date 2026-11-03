import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@openimis/fe-core/testing";

const cascaderProps = vi.fn();

// The fe-core barrel cannot be loaded from a test: only what InsureeAddress uses. The
// location cascader is replaced by a probe that records the props it is given.
vi.mock("@openimis/fe-core", async () => {
  const h = (await import("react")).createElement;
  return {
    PublishedComponent: (props) => {
      if (props.pubRef === "location.LocationCascader") cascaderProps(props);
      return null;
    },
    TextInput: () => null,
    useTranslations: () => ({ formatMessage: (id) => id }),
    useModulesManager: () => ({ getConf: (module, key, defaultValue) => defaultValue }),
    GRID_RESPONSIVE_STANDARD: 6,
    GRID_RESPONSIVE_LARGE: 12,
    h,
  };
});

const { default: InsureeAddress } = await import("./InsureeAddress");

describe("InsureeAddress current village", () => {
  it("requires a village when the insuree does not live at the family location", () => {
    renderWithProviders(<InsureeAddress onChangeLocation={vi.fn()} onChangeAddress={vi.fn()} value={{}} />);
    // Uncheck "same as family" to show the insuree's own location.
    fireEvent.click(screen.getByLabelText("Insuree.currentVillage.sameAsFamily"));
    // Location.MaxLevels is a count (default 4) and levels are 0-based: the village is 3.
    expect(cascaderProps).toHaveBeenLastCalledWith(expect.objectContaining({ required: true, requiredLevel: 3 }));
  });
});
