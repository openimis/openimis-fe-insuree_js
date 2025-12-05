import { render } from "@testing-library/react";
import InsureeFormComponent from "../src/components/InsureeForm";
import { isValidInsuree } from "../src/utils/utils";

// Mock global baseInsuree
const baseInsuree = {
  chfId: "CHF123",
  lastName: "Doe",
  otherNames: "John",
  dob: "1990-01-01",
  gender: { code: "M" },
  validityTo: null,
  photo: null,
  healthFacility: null,
  status: "AC",
};

// Mock ModulesManager global
const mockModulesManager = {
  getConf: jest.fn((module, key, defaultValue) => {
    const conf = {
      "fe-insuree": {
        "insureeForm.isInsureeFirstServicePointRequired": false,
        "insureeForm.isInsureePhotoRequired": false,
        "insureeForm.isInsureeStatusRequired": false,
      },
    };
    return conf[module]?.[key] ?? defaultValue;
  }),
};

// Props globales pour le composant
const defaultProps = {
  modulesManager: mockModulesManager,
  isChfIdValid: true,
  rights: ["RIGHT_INSUREE"],
  fetchInsureeFull: jest.fn(),
  fetchFamily: jest.fn(),
  clearInsuree: jest.fn(),
  fetchInsureeMutation: jest.fn(),
  journalize: jest.fn(),
  save: jest.fn(),
  add: jest.fn(),
};

describe("isValidInsuree()", () => {
  it("returns true for a fully valid insuree", () => {
    expect(isValidInsuree(baseInsuree, mockModulesManager)).toBe(true);
  });

  it("fails when CHF ID is missing", () => {
    const insuree = { ...baseInsuree, chfId: null };
    expect(isValidInsuree(insuree, mockModulesManager)).toBe(false);
  });

  it("fails if validityTo is set (insuree deleted)", () => {
    const insuree = { ...baseInsuree, validityTo: "2023-01-01" };
    expect(isValidInsuree(insuree, mockModulesManager)).toBe(false);
  });

  it("fails if status required but missing", () => {
    mockModulesManager.getConf.mockImplementation((module, key, defaultValue) => {
      if (module === "fe-insuree" && key === "insureeForm.isInsureeStatusRequired") return true;
      return false;
    });

    const insuree = { ...baseInsuree, status: null };
    expect(isValidInsuree(insuree, mockModulesManager)).toBe(false);
  });
});

describe("InsureeFormComponent canSave()", () => {
  it("returns true when all conditions are met", () => {
    // Render du composant
    const { container } = render(<InsureeFormComponent {...defaultProps} />);

    // Récupérer l'instance de la class component
    const componentInstance = container.firstChild._reactRootContainer._internalRoot.current.child.stateNode;

    // Set le state avec baseInsuree
    componentInstance.setState({ insuree: { ...baseInsuree }, lockNew: false, newInsuree: false });

    // Vérifie que canSave retourne true
    expect(componentInstance.canSave()).toBe(true);
  });
});
