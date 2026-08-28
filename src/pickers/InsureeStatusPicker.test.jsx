import React from "react";
import { describe, expect, it, vi } from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => {
  const picker = await vi.importActual("@openimis/fe-core/components/generics/ConstantBasedPicker");
  return { ConstantBasedPicker: picker.default };
});

const { default: InsureeStatusPicker } = await import("./InsureeStatusPicker");
const { renderWithProviders, screen, userEvent } = await import("@openimis/fe-core/testing");

const messages = {
  "insuree.Insuree.status": "Status",
  "insuree.Insuree.status.null": "Any",
  "insuree.Insuree.status.AC": "Active",
  "insuree.Insuree.status.IN": "Inactive",
  "insuree.Insuree.status.DE": "Dead",
};

const renderPicker = (props = {}) =>
  renderWithProviders(<InsureeStatusPicker onChange={() => {}} {...props} />, { messages });

const openOptions = async () => {
  await userEvent.click(screen.getByRole("combobox"));
  return screen.getAllByRole("option").map((option) => option.textContent);
};

describe("InsureeStatusPicker", () => {
  it("offers every insuree status, translated, with an empty choice first", async () => {
    renderPicker();

    expect(await openOptions()).toEqual(["Any", "Active", "Inactive", "Dead"]);
  });

  it("drops the empty choice when a status must be given", async () => {
    renderPicker({ withNull: false });

    expect(await openOptions()).toEqual(["Active", "Inactive", "Dead"]);
  });

  it("reports the chosen status and the label to show for it", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Inactive" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("IN", "Inactive");
  });

  it("reports clearing the status as no value at all", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, value: "IN" });

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Any" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(null, "Any");
  });

  it("shows the status it was given", () => {
    renderPicker({ value: "DE" });

    expect(screen.getByRole("combobox")).toHaveTextContent("Dead");
  });

  it("follows the status when the form replaces it", () => {
    const { rerender } = renderPicker({ value: "AC" });
    expect(screen.getByRole("combobox")).toHaveTextContent("Active");

    rerender(<InsureeStatusPicker onChange={() => {}} value="DE" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Dead");
  });

  it("hides a filtered status", async () => {
    renderPicker({ filtered: ["DE"] });

    expect(await openOptions()).toEqual(["Any", "Active", "Inactive"]);
  });

  it("keeps showing a filtered status while it is the current one", async () => {
    renderPicker({ filtered: ["DE"], value: "DE" });

    expect(await openOptions()).toEqual(["Any", "Active", "Inactive", "Dead"]);
  });

  it("shows the status as plain text when read only", () => {
    // TextInput leaks props onto the DOM and React warns. Captured, not printed.
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderPicker({ readOnly: true, value: "AC" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Active")).toBeInTheDocument();
  });
});
