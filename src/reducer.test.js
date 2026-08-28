import { describe, expect, it, vi } from "vitest";

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock("@openimis/fe-core", async () => vi.importActual("@openimis/fe-core/helpers/api"));

const { default: reducer } = await import("./reducer");
const { graphqlErrors, relayPage, serverError } = await import("@openimis/fe-core/testing");

const initial = () => reducer(undefined, { type: "@@INIT" });
const dispatch = (state, type, { payload, meta } = {}) => reducer(state, { type, payload, meta });
const respond = (state, type, data) => dispatch(state, `${type}_RESP`, { payload: { data } });
const fail = (state, type, payload = serverError(500, "Internal Server Error", "boom")) =>
  dispatch(state, `${type}_ERR`, { payload });

const SERVER_ERROR = { code: 500, message: "Internal Server Error", detail: "boom" };
const insuree = (chfId) => ({ uuid: `uuid-${chfId}`, chfId, lastName: "Doe" });

describe("insuree reducer", () => {
  describe("initialisation", () => {
    it("starts with nothing loaded and nothing in flight", () => {
      const state = initial();

      expect(state.insuree).toBeNull();
      expect(state.family).toBeNull();
      expect(state.insurees).toEqual([]);
      expect(state.families).toEqual([]);
      expect(state.submittingMutation).toBe(false);
      expect(state.headSelected).toBe(false);
    });

    it("counts nothing before the first page arrives", () => {
      expect(initial().insureesPageInfo).toEqual({ totalCount: 0 });
      expect(initial().familiesPageInfo).toEqual({ totalCount: 0 });
      expect(initial().familyMembersPageInfo).toEqual({ totalCount: 0 });
    });

    it("returns the same state object for an unrelated action", () => {
      const state = initial();

      expect(reducer(state, { type: "SOMETHING_ELSE" })).toBe(state);
    });
  });

  describe("one insuree by number", () => {
    it("unwraps the first node of the page", () => {
      const state = respond(initial(), "INSUREE_INSUREE", { insurees: relayPage([insuree("chf-1")]) });

      expect(state.insuree).toEqual(insuree("chf-1"));
      expect(state.fetchedInsuree).toBe(true);
      expect(state.errorInsuree).toBeNull();
    });

    it("leaves the insuree undefined when nobody matched", () => {
      expect(respond(initial(), "INSUREE_INSUREE", { insurees: relayPage([]) }).insuree).toBeUndefined();
    });

    it("forgets the previous insuree while the next one loads", () => {
      const loaded = { ...initial(), insuree: insuree("chf-1"), fetchedInsuree: true };

      expect(dispatch(loaded, "INSUREE_INSUREE_REQ")).toMatchObject({
        insuree: null,
        fetchedInsuree: false,
        fetchingInsuree: true,
      });
    });

    it("stops fetching and reports a transport failure", () => {
      const state = fail(initial(), "INSUREE_INSUREE");

      expect(state.fetchingInsuree).toBe(false);
      expect(state.errorInsuree).toEqual(SERVER_ERROR);
    });

    it("forgets the insuree on clear", () => {
      const loaded = { ...initial(), insuree: insuree("chf-1"), fetchedInsuree: true };

      expect(dispatch(loaded, "INSUREE_INSUREE_CLEAR")).toMatchObject({
        insuree: null,
        fetchedInsuree: false,
        errorInsuree: null,
      });
    });

    // Currently fails: fetchFamilyMutation and fetchInsureeMutation look a mutation log up
    // under this same action type, and their callers read the response directly.
    // The reducer still runs, finds no `insurees` in a mutationLogs payload, and
    // replaces the insuree being edited with undefined. The fix belongs in
    // actions.js — those two lookups need their own type.
    it.fails("keeps the insuree being edited when a mutation log is looked up", () => {
      const loaded = { ...initial(), insuree: insuree("chf-1"), fetchedInsuree: true };
      const state = respond(loaded, "INSUREE_INSUREE", {
        mutationLogs: relayPage([{ id: "1", families: [{ family: { uuid: "fam-1" } }] }]),
      });

      expect(state.insuree).toEqual(insuree("chf-1"));
    });
  });

  describe("enquiry", () => {
    it("keeps the enquiry result separate from the insuree being edited", () => {
      const state = respond(initial(), "ENQUIRY_INSUREE", { insurees: relayPage([insuree("chf-1")]) });

      expect(state.insureeEnquiry).toEqual(insuree("chf-1"));
      expect(state.insuree).toBeNull();
      expect(state.fetchedInsureeEnquiry).toBe(true);
    });

    it("forgets the enquiry on clear", () => {
      const loaded = { ...initial(), insureeEnquiry: insuree("chf-1"), fetchedInsureeEnquiry: true };

      expect(dispatch(loaded, "ENQUIRY_INSUREE_CLEAR")).toMatchObject({
        insureeEnquiry: null,
        fetchedInsureeEnquiry: false,
        errorInsureeEnquiry: null,
      });
    });

    it("reports a transport failure", () => {
      expect(fail(initial(), "ENQUIRY_INSUREE").errorInsureeEnquiry).toEqual(SERVER_ERROR);
    });

    // Currently fails: the error branch clears fetchedInsureeEnquiry instead of
    // fetchingInsureeEnquiry, so the enquiry never stops looking busy.
    it.fails("stops fetching when the enquiry fails", () => {
      const requested = dispatch(initial(), "ENQUIRY_INSUREE_REQ");
      expect(requested.fetchingInsureeEnquiry).toBe(true);

      expect(fail(requested, "ENQUIRY_INSUREE").fetchingInsureeEnquiry).toBe(false);
    });
  });

  describe("insuree search", () => {
    it("stores the page and its cursors", () => {
      const state = respond(initial(), "INSUREE_INSUREES", {
        insurees: relayPage([insuree("chf-1"), insuree("chf-2")], {
          totalCount: 9,
          pageInfo: { hasNextPage: true, endCursor: "cursor-2" },
        }),
      });

      expect(state.insurees).toEqual([insuree("chf-1"), insuree("chf-2")]);
      expect(state.insureesPageInfo).toMatchObject({ totalCount: 9, hasNextPage: true, endCursor: "cursor-2" });
      expect(state.fetchedInsurees).toBe(true);
    });

    it("empties the list while the next page loads", () => {
      const loaded = { ...initial(), insurees: [insuree("chf-1")] };

      expect(dispatch(loaded, "INSUREE_INSUREES_REQ")).toMatchObject({
        insurees: [],
        fetchingInsurees: true,
        fetchedInsurees: false,
      });
    });

    it("surfaces a data error", () => {
      const state = dispatch(initial(), "INSUREE_INSUREES_RESP", {
        payload: { data: { insurees: relayPage([]) }, ...graphqlErrors("not permitted") },
      });

      expect(state.errorInsurees).toMatchObject({ detail: "not permitted" });
    });

    // Currently fails: the error branch writes `fetching` and `error` — fields nothing in
    // this module owns — so the searcher keeps its spinner and never learns why.
    it.fails("stops searching and reports a transport failure", () => {
      const requested = dispatch(initial(), "INSUREE_INSUREES_REQ");
      const state = fail(requested, "INSUREE_INSUREES");

      expect(state.fetchingInsurees).toBe(false);
      expect(state.errorInsurees).toEqual(SERVER_ERROR);
    });
  });

  describe("family search", () => {
    const family = (uuid) => ({ uuid, poverty: false });

    it("stores the page and its cursors", () => {
      const state = respond(initial(), "INSUREE_FAMILIES", {
        families: relayPage([family("fam-1")], { totalCount: 3 }),
      });

      expect(state.families).toEqual([family("fam-1")]);
      expect(state.familiesPageInfo).toMatchObject({ totalCount: 3 });
      expect(state.fetchedFamilies).toBe(true);
    });

    it("resets the count while the next page loads", () => {
      const loaded = { ...initial(), families: [family("fam-1")], familiesPageInfo: { totalCount: 3 } };

      expect(dispatch(loaded, "INSUREE_FAMILIES_REQ").familiesPageInfo).toEqual({ totalCount: 0 });
    });

    it("stops fetching and reports a transport failure", () => {
      const state = fail(initial(), "INSUREE_FAMILIES");

      expect(state.fetchingFamilies).toBe(false);
      expect(state.errorFamilies).toEqual(SERVER_ERROR);
    });
  });

  describe("family overview", () => {
    it("takes the first family of the page", () => {
      const state = respond(initial(), "INSUREE_FAMILY_OVERVIEW", {
        families: relayPage([{ uuid: "fam-1" }, { uuid: "fam-2" }]),
      });

      expect(state.family).toEqual({ uuid: "fam-1" });
      expect(state.fetchedFamily).toBe(true);
    });

    it("reports no family rather than undefined when the page is empty", () => {
      expect(respond(initial(), "INSUREE_FAMILY_OVERVIEW", { families: relayPage([]) }).family).toBeNull();
    });

    it("stops fetching and reports a transport failure", () => {
      const state = fail(initial(), "INSUREE_FAMILY_OVERVIEW");

      expect(state.fetchingFamily).toBe(false);
      expect(state.errorFamily).toEqual(SERVER_ERROR);
    });
  });

  describe("family members", () => {
    it("stores the members and their cursors", () => {
      const state = respond(initial(), "INSUREE_FAMILY_MEMBERS", {
        familyMembers: relayPage([insuree("chf-1")], { totalCount: 4 }),
      });

      expect(state.familyMembers).toEqual([insuree("chf-1")]);
      expect(state.familyMembersPageInfo).toMatchObject({ totalCount: 4 });
      expect(state.fetchedFamilyMembers).toBe(true);
    });

    it("stops fetching and reports a transport failure", () => {
      const state = fail(initial(), "INSUREE_FAMILY_MEMBERS");

      expect(state.fetchingFamilyMembers).toBe(false);
      expect(state.errorFamilyMembers).toEqual(SERVER_ERROR);
    });

    // Currently fails: the request branch empties insureeFamilyMembers — a different slice,
    // filled by INSUREE_FAMILY — and leaves the members it is about to replace on
    // screen.
    it.fails("empties the list it is about to refill, and nothing else", () => {
      const loaded = {
        ...initial(),
        familyMembers: [insuree("chf-1")],
        insureeFamilyMembers: [insuree("chf-2")],
      };
      const state = dispatch(loaded, "INSUREE_FAMILY_MEMBERS_REQ");

      expect(state.familyMembers).toBeNull();
      expect(state.insureeFamilyMembers).toEqual([insuree("chf-2")]);
    });

    it("takes the selected member as the insuree being edited", () => {
      const state = dispatch(initial(), "INSUREE_FAMILY_MEMBER", { payload: insuree("chf-1") });

      expect(state.insuree).toEqual(insuree("chf-1"));
    });

    it("wipes the family and its members when a new family is started", () => {
      const loaded = {
        ...initial(),
        family: { uuid: "fam-1" },
        familyMembers: [insuree("chf-1")],
        familyMembersPageInfo: { totalCount: 1 },
        insuree: insuree("chf-1"),
      };

      expect(dispatch(loaded, "INSUREE_FAMILY_NEW")).toMatchObject({
        family: null,
        familyMembers: null,
        familyMembersPageInfo: { totalCount: 0 },
        insuree: null,
      });
    });
  });

  describe("adding an insuree to a family", () => {
    it("keeps the warnings the server returned", () => {
      const state = respond(initial(), "INSUREE_FAMILY_CAN_ADD_INSUREE", {
        canAddInsuree: ["The family already has a head"],
      });

      expect(state.canAddInsureeWarnings).toEqual(["The family already has a head"]);
      expect(state.checkedCanAddInsuree).toBe(true);
      expect(state.checkingCanAddInsuree).toBe(false);
    });

    it("drops the previous warnings while the check runs", () => {
      const checked = { ...initial(), canAddInsureeWarnings: ["stale"] };

      expect(dispatch(checked, "INSUREE_FAMILY_CAN_ADD_INSUREE_REQ")).toMatchObject({
        canAddInsureeWarnings: [],
        checkingCanAddInsuree: true,
        checkedCanAddInsuree: false,
      });
    });

    // Currently fails: the error branch formats a transport failure with the GraphQL
    // formatter, which returns null when the payload has no errors array.
    it.fails("reports a transport failure of the check", () => {
      const state = fail(initial(), "INSUREE_FAMILY_CAN_ADD_INSUREE");

      expect(state.checkingCanAddInsuree).toBe(false);
      expect(state.errorCanAddInsuree).toEqual(SERVER_ERROR);
    });
  });

  describe("reference data", () => {
    it.each([
      ["genders", "INSUREE_GENDERS", "insureeGenders", [{ code: "M" }, { code: "F" }], ["M", "F"]],
      ["family types", "INSUREE_FAMILY_TYPES", "familyTypes", [{ code: "H" }], ["H"]],
      ["identification types", "INSUREE_IDENTIFICATION_TYPES", "identificationTypes", [{ code: "P" }], ["P"]],
      ["educations", "INSUREE_EDUCATIONS", "educations", [{ id: 1 }, { id: 2 }], [1, 2]],
      ["professions", "INSUREE_PROFESSIONS", "professions", [{ id: 3 }], [3]],
      ["relations", "INSUREE_RELATIONS", "relations", [{ id: 4 }], [4]],
    ])("reduces %s to the values the pickers use", (_label, type, field, nodes, expected) => {
      const state = respond(initial(), type, { [field]: nodes });

      expect(state[field]).toEqual(expected);
      expect(state[`fetched${field.charAt(0).toUpperCase()}${field.slice(1)}`]).toBe(true);
    });

    it("keeps the confirmation types as objects, since the picker needs more than the code", () => {
      const confirmationTypes = [{ code: "C", isConfirmationNumberRequired: true }];
      const state = respond(initial(), "INSUREE_CONFIRMATION_TYPES", { confirmationTypes });

      expect(state.confirmationTypes).toEqual(confirmationTypes);
    });

    it.each([
      ["genders", "INSUREE_GENDERS", "errorInsureeGenders", "fetchingInsureeGenders"],
      ["family types", "INSUREE_FAMILY_TYPES", "errorFamilyTypes", "fetchingFamilyTypes"],
      ["educations", "INSUREE_EDUCATIONS", "errorEducations", "fetchingEducations"],
      ["professions", "INSUREE_PROFESSIONS", "errorProfessions", "fetchingProfessions"],
      ["relations", "INSUREE_RELATIONS", "errorRelations", "fetchingRelations"],
      [
        "identification types",
        "INSUREE_IDENTIFICATION_TYPES",
        "errorIdentificationTypes",
        "fetchingIdentificationTypes",
      ],
      ["confirmation types", "INSUREE_CONFIRMATION_TYPES", "errorConfirmationTypes", "fetchingConfirmationTypes"],
    ])("stops fetching %s and reports the failure", (_label, type, errorField, fetchingField) => {
      const state = fail(initial(), type);

      expect(state[fetchingField]).toBe(false);
      expect(state[errorField]).toEqual(SERVER_ERROR);
    });
  });

  describe("insuree officers", () => {
    it("stores the officers of the page", () => {
      const officers = [{ uuid: "off-1", lastName: "Smith" }];
      const state = respond(initial(), "INSUREE_INSUREE_OFFICERS", { insureeOfficers: relayPage(officers) });

      expect(state.insureeOfficers).toEqual(officers);
      expect(state.fetchedInsureeOfficers).toBe(true);
    });

    it("stops fetching and reports a transport failure", () => {
      const state = fail(initial(), "INSUREE_INSUREE_OFFICERS");

      expect(state.fetchingInsureeOfficers).toBe(false);
      expect(state.errorInsureeOfficers).toEqual(SERVER_ERROR);
    });
  });

  describe("insuree number validation", () => {
    const validating = () => dispatch(initial(), "INSUREE_NUMBER_VALIDATION_FIELDS_REQ");

    it("marks the number as validating and not yet valid while the check runs", () => {
      expect(validating().validationFields.insureeNumber).toEqual({
        isValidating: true,
        isValid: false,
        validationErrorMessage: null,
        validationError: null,
      });
    });

    it("takes the verdict and the message from the response", () => {
      const state = respond(validating(), "INSUREE_NUMBER_VALIDATION_FIELDS", {
        insureeNumberValidity: { isValid: false, errorMessage: "Number already assigned" },
      });

      expect(state.validationFields.insureeNumber).toEqual({
        isValidating: false,
        isValid: false,
        validationErrorMessage: "Number already assigned",
        validationError: null,
      });
    });

    it("accepts a valid number", () => {
      const state = respond(validating(), "INSUREE_NUMBER_VALIDATION_FIELDS", {
        insureeNumberValidity: { isValid: true, errorMessage: null },
      });

      expect(state.validationFields.insureeNumber).toMatchObject({ isValid: true, isValidating: false });
    });

    it("accepts a number as valid without a round trip", () => {
      expect(dispatch(initial(), "INSUREE_NUMBER_VALIDATION_FIELDS_SET_VALID").validationFields.insureeNumber).toEqual({
        isValidating: false,
        isValid: true,
        validationErrorMessage: null,
        validationError: null,
      });
    });

    it("treats a failed check as invalid and records why", () => {
      const state = fail(validating(), "INSUREE_NUMBER_VALIDATION_FIELDS");

      expect(state.validationFields.insureeNumber.isValid).toBe(false);
      expect(state.validationFields.insureeNumber.validationError).toEqual(SERVER_ERROR);
    });

    // Currently fails: clearing sets isValidating true, so the form believes a check it
    // just cancelled is still running.
    it.fails("stops validating on clear", () => {
      const state = dispatch(validating(), "INSUREE_NUMBER_VALIDATION_FIELDS_CLEAR");

      expect(state.validationFields.insureeNumber.isValidating).toBe(false);
    });

    // The error branch is the only one that does not name validationErrorMessage;
    // it drops the key rather than nulling it, so no stale reason survives.
    it("does not keep the previous error message when a later check fails", () => {
      const rejected = respond(validating(), "INSUREE_NUMBER_VALIDATION_FIELDS", {
        insureeNumberValidity: { isValid: false, errorMessage: "Number already assigned" },
      });

      expect(
        fail(rejected, "INSUREE_NUMBER_VALIDATION_FIELDS").validationFields.insureeNumber.validationErrorMessage,
      ).toBeUndefined();
    });
  });

  describe("head selection", () => {
    it.each([
      ["records that a head is selected", { headSelected: true }, true],
      ["records that none is", { headSelected: false }, false],
    ])("%s", (_label, payload, expected) => {
      expect(dispatch(initial(), "INSUREE_CHECK_IS_HEAD_SELECTED", { payload }).headSelected).toBe(expected);
    });

    it("reports no selection when the action carries no payload", () => {
      expect(dispatch(initial(), "INSUREE_CHECK_IS_HEAD_SELECTED").headSelected).toBeUndefined();
    });
  });

  describe("mutations", () => {
    const MUTATION_RESULTS = [
      ["INSUREE_CREATE_FAMILY_RESP", "createFamily"],
      ["INSUREE_UPDATE_FAMILY_RESP", "updateFamily"],
      ["INSUREE_DELETE_FAMILY_RESP", "deleteFamilies"],
      ["INSUREE_CREATE_INSUREE_RESP", "createInsuree"],
      ["INSUREE_UPDATE_INSUREE_RESP", "updateInsuree"],
      ["INSUREE_DELETE_INSUREES_RESP", "deleteInsurees"],
      ["INSUREE_REMOVE_INSUREES_RESP", "removeInsurees"],
      ["INSUREE_SET_FAMILY_HEAD_RESP", "setFamilyHead"],
      ["INSUREE_CHANGE_FAMILY_HEAD_RESP", "changeInsureeFamily"],
    ];

    const submitting = () =>
      dispatch(initial(), "INSUREE_MUTATION_REQ", {
        meta: { clientMutationId: "cmid-1", clientMutationLabel: "Create family", familyUuid: "fam-1" },
      });

    it("records the request metadata while a mutation is in flight", () => {
      expect(submitting()).toMatchObject({
        submittingMutation: true,
        mutation: { id: "cmid-1", clientMutationLabel: "Create family", familyUuid: "fam-1" },
      });
    });

    it("serialises a Date requested time so the store stays serialisable", () => {
      const requestedDateTime = new Date("2026-08-10T09:00:00.000Z");
      const state = dispatch(initial(), "INSUREE_MUTATION_REQ", { meta: { requestedDateTime } });

      expect(state.mutation.requestedDateTime).toBe("2026-08-10T09:00:00.000Z");
    });

    it.each(MUTATION_RESULTS)("clears the in-flight flag and keeps the internal id of %s", (type, service) => {
      const state = dispatch(submitting(), type, { payload: { data: { [service]: { internalId: "internal-1" } } } });

      expect(state.submittingMutation).toBe(false);
      expect(state.mutation.id).toBe("internal-1");
    });

    it("raises an alert when a mutation fails", () => {
      const state = dispatch(submitting(), "INSUREE_MUTATION_ERR", {
        payload: { status: 500, statusText: "Internal Server Error" },
      });

      expect(JSON.parse(state.alert)).toEqual({ status: 500, statusText: "Internal Server Error" });
    });
  });

  // INSUREE_FAMILY fills insureeFamilyMembers, a slice distinct from the
  // familyMembers one above — and one the family members request wrongly clears.
  describe("the family an insuree belongs to", () => {
    it("stores the members the response carried", () => {
      const members = [insuree("chf-1"), insuree("chf-2")];
      const state = respond(initial(), "INSUREE_FAMILY", { insureeFamilyMembers: members });

      expect(state.insureeFamilyMembers).toEqual(members);
      expect(state.fetchedInsureeFamilyMembers).toBe(true);
      expect(state.fetchingInsureeFamilyMembers).toBe(false);
    });

    it("forgets the insuree being edited while the family loads", () => {
      const loaded = { ...initial(), insuree: insuree("chf-1"), insureeFamilyMembers: [insuree("chf-2")] };
      const state = dispatch(loaded, "INSUREE_FAMILY_REQ");

      expect(state.insuree).toBeNull();
      expect(state.insureeFamilyMembers).toBeNull();
      expect(state.fetchingInsureeFamilyMembers).toBe(true);
    });

    it("stops fetching and reports a transport failure", () => {
      const requested = dispatch(initial(), "INSUREE_FAMILY_REQ");
      const state = fail(requested, "INSUREE_FAMILY");

      expect(state.fetchingInsureeFamilyMembers).toBe(false);
      expect(state.errorInsureeFamilyMembers).toEqual(SERVER_ERROR);
    });
  });

  describe("request branches, one slice at a time", () => {
    it.each([
      ["genders", "INSUREE_GENDERS", "InsureeGenders", "insureeGenders"],
      ["family types", "INSUREE_FAMILY_TYPES", "FamilyTypes", "familyTypes"],
      ["confirmation types", "INSUREE_CONFIRMATION_TYPES", "ConfirmationTypes", "confirmationTypes"],
      ["identification types", "INSUREE_IDENTIFICATION_TYPES", "IdentificationTypes", "identificationTypes"],
      ["educations", "INSUREE_EDUCATIONS", "Educations", "educations"],
      ["professions", "INSUREE_PROFESSIONS", "Professions", "professions"],
      ["relations", "INSUREE_RELATIONS", "Relations", "relations"],
      ["insuree officers", "INSUREE_INSUREE_OFFICERS", "InsureeOfficers", "insureeOfficers"],
    ])("drops the %s it holds and marks them in flight when reloaded", (_label, type, suffix, field) => {
      const loaded = { ...initial(), [field]: ["stale"] };
      const state = dispatch(loaded, `${type}_REQ`);

      expect(state[field]).toBeNull();
      expect(state[`fetching${suffix}`]).toBe(true);
      expect(state[`fetched${suffix}`]).toBe(false);
      expect(state[`error${suffix}`]).toBeNull();
    });

    it("forgets the family overview while the next one loads", () => {
      const loaded = { ...initial(), family: { uuid: "fam-1" }, fetchedFamily: true };
      const state = dispatch(loaded, "INSUREE_FAMILY_OVERVIEW_REQ");

      expect(state.family).toBeNull();
      expect(state.fetchingFamily).toBe(true);
      expect(state.fetchedFamily).toBe(false);
      expect(state.errorFamily).toBeNull();
    });
  });

  describe("immutability", () => {
    it("does not mutate the state it was given", () => {
      const state = initial();
      const snapshot = JSON.stringify(state);

      respond(state, "INSUREE_INSUREES", { insurees: relayPage([insuree("chf-1")]) });
      dispatch(state, "INSUREE_NUMBER_VALIDATION_FIELDS_REQ");

      expect(JSON.stringify(state)).toBe(snapshot);
    });
  });
});
