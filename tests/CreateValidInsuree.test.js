import { isValidInsuree } from "../src/utils/utils";
import { RIGHT_INSUREE } from "../src/constants";
import { render } from "@testing-library/react";

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

const mockProps = {
  modulesManager: mockModulesManager,
  isChfIdValid: true,
  rights: [RIGHT_INSUREE],
  fetchInsureeFull: jest.fn(),
  fetchFamily: jest.fn(),
  clearInsuree: jest.fn(),
  fetchInsureeMutation: jest.fn(),
  journalize: jest.fn(),
  save: jest.fn(),
  add: jest.fn(),
  intl: { formatMessage: ({ id }) => id },
  family: { uuid: 'FAM123', name: 'Doe' },
  insuree: { uuid: 'INS123', firstName: 'John', lastName: 'Doe' },
  mutation: { clientMutationId: 'abc123' },
  insuree_uuid: 'INS123',
  family_uuid: 'FAM123',
  submittingMutation: false,
};

render(<InsureeForm {...mockProps} />);

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
      return module === "fe-insuree" && key === "insureeForm.isInsureeStatusRequired";
    });

    const insuree = { ...baseInsuree, status: null };
    expect(isValidInsuree(insuree, mockModulesManager)).toBe(false);
  });

});

