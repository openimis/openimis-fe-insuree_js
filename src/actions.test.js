import { describe, expect, it, vi } from "vitest";

// Only fe-core's two dispatchers are stubbed; the formatters are real, imported
// from their defining modules because fe-core's barrel imports itself.
const core = vi.hoisted(() => ({
  graphql: vi.fn((payload, type, meta) => ({ payload, type, meta })),
  graphqlWithVariables: vi.fn((operation, variables, type, meta) => ({ operation, variables, type, meta })),
}));

vi.mock("@openimis/fe-core", async () => ({
  ...(await vi.importActual("@openimis/fe-core/helpers/api")),
  ...(await vi.importActual("@openimis/fe-core/helpers/jsonExt")),
  ...core,
}));

const actions = await import("./actions");
const { INSUREE_ACTIVE_STRING } = await import("./constants");
const { globalId } = await import("@openimis/fe-core/testing");

const mm = { getProjection: (key) => (key.includes("HealthFacility") ? "{id,name}" : "{id, name}") };

const query = (result) => result.payload.replace(/\s+/g, " ");
const operation = (result) => result.operation.replace(/\s+/g, " ");

describe("insuree actions", () => {
  describe("searches", () => {
    it("looks an insuree up by number, ignoring the officer's location", () => {
      const result = actions.fetchInsuree(mm, "chf-1");

      expect(result.type).toBe("INSUREE_INSUREE");
      expect(query(result)).toContain('insurees(chfId:"chf-1", ignoreLocation:true)');
      expect(query(result)).not.toContain("totalCount");
    });

    it("raises the enquiry under its own type so the two do not overwrite each other", () => {
      expect(actions.fetchInsureeEnquiry(mm, "chf-1").type).toBe("ENQUIRY_INSUREE");
      expect(actions.fetchInsuree(mm, "chf-1").type).toBe("INSUREE_INSUREE");
    });

    it("loads a full insuree by uuid and keeps the family projection", () => {
      const result = actions.fetchInsureeFull(mm, "uuid-1");

      expect(result.type).toBe("INSUREE_INSUREE");
      expect(query(result)).toContain('insurees(uuid:"uuid-1")');
      expect(query(result)).toContain("family{");
      expect(query(result)).toContain("jsonExt");
      expect(query(result)).not.toContain("ignoreLocation");
    });

    it("can be asked to look outside the officer's location", () => {
      expect(query(actions.fetchInsureeFull(mm, "uuid-1", true)))
        .toContain('insurees(uuid:"uuid-1",ignoreLocation: true)');
    });

    it("counts the insuree summaries and projects both villages", () => {
      const result = actions.fetchInsureeSummaries(mm, ["first: 10"]);

      expect(result.type).toBe("INSUREE_INSUREES");
      expect(query(result)).toContain("insurees(first: 10) { totalCount");
      expect(query(result)).toContain("family{uuid,location{id, name}}");
      expect(query(result)).toContain("currentVillage{id, name}");
    });

    it("adds the location override only when asked", () => {
      expect(query(actions.fetchInsureeSummaries(mm, ["first: 10"], true))).toContain("ignoreLocation: true");
      expect(query(actions.fetchInsureeSummaries(mm, ["first: 10"]))).not.toContain("ignoreLocation");
    });

    // Currently fails: the location override is pushed onto the caller's own array, so the
    // filters a component holds grow every time it searches.
    it.fails("leaves the filters it was given alone", () => {
      const filters = ["first: 10"];

      actions.fetchInsureeSummaries(mm, filters, true);

      expect(filters).toEqual(["first: 10"]);
    });

    it("counts the insurees offered to the picker", () => {
      const result = actions.fetchInsureesForPicker(mm, ['chfId_Icontains: "1"']);

      expect(result.type).toBe("INSUREE_INSUREES");
      expect(query(result)).toContain('insurees(chfId_Icontains: "1") { totalCount');
    });

    it.each([
      ["genders", "fetchInsureeGenders", "INSUREE_GENDERS", "insureeGenders { code }"],
      ["family types", "fetchFamilyTypes", "INSUREE_FAMILY_TYPES", "familyTypes { code }"],
    ])("asks for the %s without paging", (_label, creator, type, expected) => {
      const result = actions[creator]();

      expect(result.type).toBe(type);
      expect(query(result)).toContain(expected);
      expect(query(result)).not.toContain("edges");
    });

    it.each([
      ["educations", "fetchEducations", "INSUREE_EDUCATIONS", "educations"],
      ["professions", "fetchProfessions", "INSUREE_PROFESSIONS", "professions"],
      ["relations", "fetchRelations", "INSUREE_RELATIONS", "relations"],
      ["identification types", "fetchIdentificationTypes", "INSUREE_IDENTIFICATION_TYPES", "identificationTypes"],
    ])("asks for the %s reference list", (_label, creator, type, entity) => {
      const result = actions[creator](mm);

      expect(result.type).toBe(type);
      expect(query(result)).toContain(entity);
    });

    it("counts the family summaries and projects the head's contact details", () => {
      const result = actions.fetchFamilySummaries(mm, ["first: 10"]);

      expect(result.type).toBe("INSUREE_FAMILIES");
      expect(query(result)).toContain("families(first: 10) { totalCount");
      expect(query(result)).toContain("headInsuree{id,uuid,chfId,lastName,otherNames,email,phone, dob}");
      expect(query(result)).toContain("location{id, name}");
    });

    it("counts the members of a family", () => {
      const result = actions.fetchFamilyMembers(mm, ['family_Uuid: "fam-1"']);

      expect(result.type).toBe("INSUREE_FAMILY_MEMBERS");
      expect(query(result)).toContain('familyMembers(family_Uuid: "fam-1") { totalCount');
      expect(query(result)).toContain("cardIssued");
    });

    it("asks whether an insuree may be added to a family, by decoded id", () => {
      const result = actions.checkCanAddInsuree({ id: globalId("FamilyType", "21") });

      expect(result.type).toBe("INSUREE_FAMILY_CAN_ADD_INSUREE");
      expect(query(result)).toContain("canAddInsuree(familyId:21)");
    });

    it("asks for the confirmation types with the flag the form needs", () => {
      const result = actions.fetchConfirmationTypes();

      expect(result.type).toBe("INSUREE_CONFIRMATION_TYPES");
      expect(query(result)).toContain("confirmationTypes { code,isConfirmationNumberRequired }");
    });

    it.each([
      ["fetchFamilyMutation", "families{family{uuid}}"],
      ["fetchInsureeMutation", "insurees{insuree{uuid}}"],
    ])("looks up what %s created by its client mutation id", (creator, projection) => {
      const result = actions[creator](mm, "cmid-1");

      expect(query(result)).toContain('mutationLogs(clientMutationId:"cmid-1")');
      expect(query(result)).toContain(projection);
    });

    it("loads a family overview by uuid, including its history", () => {
      const result = actions.fetchFamily(mm, "fam-1");

      expect(result.type).toBe("INSUREE_FAMILY_OVERVIEW");
      expect(query(result)).toContain('families(uuid: "fam-1",showHistory: true)');
    });

    it("falls back to the head's insuree number when there is no family uuid", () => {
      const result = actions.fetchFamily(mm, null, "chf-1");

      expect(query(result)).toContain('families(headInsuree_ChfId: "chf-1")');
      expect(query(result)).not.toContain("showHistory");
    });
  });

  describe("insuree mutation input", () => {
    const insuree = {
      uuid: "uuid-1",
      chfId: "chf-1",
      lastName: "Doe",
      otherNames: "Jane",
      dob: "1990-01-01",
      gender: { code: "F" },
      marital: "M",
      head: true,
      cardIssued: false,
      passport: "P123",
      phone: "555",
      email: "jane@example.org",
      currentAddress: "1 Main St",
      currentVillage: { id: globalId("LocationType", "17") },
      profession: { id: 3 },
      education: { id: 4 },
      typeOfId: { code: "P" },
      family: { id: globalId("FamilyType", "21") },
      relationship: { id: 5 },
      status: "IN",
      statusDate: "2026-01-01",
      statusReason: { code: "SR1" },
      healthFacility: { id: globalId("HealthFacilityType", "9") },
      jsonExt: { extra: 1 },
    };

    const sent = (overrides) => actions.formatInsureeGQL(mm, { ...insuree, ...overrides }).replace(/\s+/g, " ");

    it("sends the identity, contact and reference fields", () => {
      const gql = sent();

      expect(gql).toContain('uuid: "uuid-1"');
      expect(gql).toContain('chfId: "chf-1"');
      expect(gql).toContain('lastName: "Doe"');
      expect(gql).toContain('otherNames: "Jane"');
      expect(gql).toContain('genderId: "F"');
      expect(gql).toContain('dob: "1990-01-01"');
      expect(gql).toContain('marital: "M"');
      expect(gql).toContain('typeOfIdId: "P"');
      expect(gql).toContain("professionId: 3");
      expect(gql).toContain("educationId: 4");
      expect(gql).toContain("relationshipId: 5");
    });

    it("decodes the ids of the records it points at", () => {
      const gql = sent();

      expect(gql).toContain("currentVillageId: 17");
      expect(gql).toContain("familyId: 21");
      expect(gql).toContain("healthFacilityId: 9");
    });

    it("always states whether the insuree is the head and holds a card", () => {
      expect(sent({ head: false, cardIssued: false })).toContain("head: false");
      expect(sent({ head: false, cardIssued: false })).toContain("cardIssued:false");
      expect(sent({ head: undefined, cardIssued: undefined })).toContain("head: false");
    });

    it("escapes the free text fields", () => {
      expect(sent({ lastName: "O\\Neill" })).toContain('lastName: "O\\\\Neill"');
    });

    it("serialises the extension field as an escaped json string", () => {
      expect(sent()).toContain('jsonExt: "{\\"extra\\":1}"');
    });

    it("omits what it was not given", () => {
      const gql = actions.formatInsureeGQL(mm, { chfId: "chf-1" }).replace(/\s+/g, " ");

      expect(gql).not.toContain("uuid:");
      expect(gql).not.toContain("genderId");
      expect(gql).not.toContain("photo:");
      expect(gql).not.toContain("familyId");
      expect(gql).not.toContain("statusDate");
    });

    it("sends an empty uuid when one was explicitly given", () => {
      expect(sent({ uuid: "" })).toContain('uuid: ""');
    });

    // Currently fails: `!!insuree.status != INSUREE_ACTIVE_STRING` compares a boolean with
    // a string, which is always true, so the status date and reason are sent even
    // for an active insuree — the case the check exists to exclude.
    it.fails("leaves the status date and reason out for an active insuree", () => {
      const gql = sent({ status: INSUREE_ACTIVE_STRING });

      expect(gql).not.toContain("statusDate");
      expect(gql).not.toContain("statusReason");
    });

    it("sends the status date and reason for an insuree who is not active", () => {
      const gql = sent({ status: "IN" });

      expect(gql).toContain('statusDate: "2026-01-01"');
      expect(gql).toContain('statusReason: "SR1"');
    });
  });

  describe("insuree photo input", () => {
    const photo = {
      id: globalId("PhotoType", "5"),
      uuid: "photo-1",
      officerId: globalId("OfficerType", "7"),
      date: "2026-01-01",
      photo: "base64data",
      folder: "images/",
      filename: "jane.jpg",
    };

    const sent = (overrides) =>
      actions.formatInsureeGQL(mm, { chfId: "c", photo: { ...photo, ...overrides } }).replace(/\s+/g, " ");

    it("decodes the photo and officer ids", () => {
      expect(sent()).toContain("id: 5");
      expect(sent()).toContain("officerId: 7");
    });

    it("sends the folder and filename as quoted strings", () => {
      expect(sent()).toContain('folder: "images/"');
      expect(sent()).toContain('filename: "jane.jpg"');
    });

    // Currently fails: the filename line is gated on photo.folder, so a photo that has a
    // name but no folder is uploaded without its name.
    it.fails("sends the filename of a photo that has no folder", () => {
      expect(sent({ folder: undefined })).toContain('filename: "jane.jpg"');
    });
  });

  describe("family mutation input", () => {
    const family = {
      uuid: "fam-1",
      headInsuree: { chfId: "chf-1", lastName: "Doe" },
      location: { id: globalId("LocationType", "17") },
      poverty: true,
      familyType: { code: "H" },
      address: "1 Main St",
      confirmationType: { code: "C" },
      confirmationNo: "CN1",
      jsonExt: { extra: 1 },
    };

    it("nests the head insuree and marks them as the head", () => {
      const gql = actions.formatFamilyGQL(mm, { ...family, headInsuree: { ...family.headInsuree } });

      expect(gql.replace(/\s+/g, " ")).toContain("headInsuree: { ");
      expect(gql).toContain("head: true");
      expect(gql).toContain('chfId: "chf-1"');
    });

    it("sends the family's own fields", () => {
      const gql = actions
        .formatFamilyGQL(mm, { ...family, headInsuree: { ...family.headInsuree } })
        .replace(/\s+/g, " ");

      expect(gql).toContain('uuid: "fam-1"');
      expect(gql).toContain("locationId: 17");
      expect(gql).toContain("poverty: true");
      expect(gql).toContain('familyTypeId: "H"');
      expect(gql).toContain('address: "1 Main St"');
      expect(gql).toContain('confirmationTypeId: "C"');
      expect(gql).toContain('confirmationNo: "CN1"');
    });

    it("always states whether the family is in poverty", () => {
      const gql = actions.formatFamilyGQL(mm, { headInsuree: {}, poverty: undefined });

      expect(gql).toContain("poverty: false");
    });

    // Currently fails: the formatter marks the head by writing to the object it was given,
    // which is the one held in the store.
    it.fails("leaves the family it was given alone", () => {
      const headInsuree = { chfId: "chf-1" };

      actions.formatFamilyGQL(mm, { ...family, headInsuree });

      expect(headInsuree).toEqual({ chfId: "chf-1" });
    });
  });

  describe("mutations", () => {
    const family = { uuid: "fam-1", headInsuree: { chfId: "chf-1" } };
    const insuree = { uuid: "uuid-1", chfId: "chf-1" };

    it.each([
      ["createFamily", "createFamily", "INSUREE_CREATE_FAMILY_RESP"],
      ["updateFamily", "updateFamily", "INSUREE_UPDATE_FAMILY_RESP"],
    ])("raises %s between the shared request and error types", (creator, mutationName, respType) => {
      const result = actions[creator](mm, { ...family, headInsuree: { ...family.headInsuree } }, "label");

      expect(result.type).toEqual(["INSUREE_MUTATION_REQ", respType, "INSUREE_MUTATION_ERR"]);
      expect(query(result)).toContain(`mutation ${mutationName}`);
      expect(query(result)).toContain(`clientMutationId: "${result.meta.clientMutationId}"`);
      expect(result.meta.requestedDateTime).toBeInstanceOf(Date);
    });

    it("names the family a member mutation belongs to, so the page can refresh it", () => {
      expect(actions.updateFamily(mm, { ...family, headInsuree: {} }, "label").meta.familyUuid).toBe("fam-1");
      expect(actions.setFamilyHead(mm, "fam-1", "uuid-1", "label").meta.familyUuid).toBe("fam-1");
      expect(actions.removeInsuree(mm, "fam-1", insuree, false, "label").meta.familyUuid).toBe("fam-1");
    });

    it("asks whether to delete the members along with the family", () => {
      const result = actions.deleteFamily(mm, { ...family }, true, "label");

      expect(result.type[1]).toBe("INSUREE_DELETE_FAMILY_RESP");
      expect(query(result)).toContain('uuids: ["fam-1"], deleteMembers: true');
      expect(query(actions.deleteFamily(mm, { ...family }, false, "label"))).toContain("deleteMembers: false");
    });

    it.each([
      ["createInsuree", "createInsuree", "INSUREE_CREATE_INSUREE_RESP"],
      ["updateInsuree", "updateInsuree", "INSUREE_UPDATE_INSUREE_RESP"],
    ])("raises %s with the insuree input", (creator, mutationName, respType) => {
      const result = actions[creator](mm, insuree, "label");

      expect(result.type[1]).toBe(respType);
      expect(query(result)).toContain(`mutation ${mutationName}`);
      expect(query(result)).toContain('chfId: "chf-1"');
    });

    it("asks whether to cancel the policies when a member leaves a family", () => {
      const result = actions.removeInsuree(mm, "fam-1", { ...insuree }, true, "label");

      expect(result.type[1]).toBe("INSUREE_REMOVE_INSUREES_RESP");
      expect(query(result)).toContain('uuid: "fam-1", uuids: ["uuid-1"], cancelPolicies: true');
    });

    it("deletes an insuree with or without a family to detach them from", () => {
      expect(query(actions.deleteInsuree(mm, "fam-1", { ...insuree }, "label")))
        .toContain('uuid: "fam-1", uuids: ["uuid-1"]');
      expect(query(actions.deleteInsuree(mm, null, { ...insuree }, "label"))).toContain('uuids: ["uuid-1"]');
      expect(query(actions.deleteInsuree(mm, null, { ...insuree }, "label"))).not.toContain("uuid: \"null\"");
    });

    it("moves an insuree to another family and reports both uuids", () => {
      const result = actions.changeFamily(mm, "fam-2", insuree, false, "label");

      expect(result.type[1]).toBe("INSUREE_CHANGE_FAMILY_HEAD_RESP");
      expect(query(result)).toContain('familyUuid: "fam-2", insureeUuid: "uuid-1", cancelPolicies: false');
      expect(result.meta).toMatchObject({ familyUuid: "fam-2", insureeUuid: "uuid-1" });
    });

    it("sets the head of a family by both uuids", () => {
      expect(query(actions.setFamilyHead(mm, "fam-1", "uuid-1", "label")))
        .toContain('uuid: "fam-1", insureeUuid: "uuid-1"');
    });

    // Currently fails: these stamp the generated id onto the record they were handed,
    // which is the object held in the store.
    it.fails.each([
      ["deleteFamily", (record) => actions.deleteFamily(mm, record, true, "label")],
      ["removeInsuree", (record) => actions.removeInsuree(mm, "fam-1", record, false, "label")],
      ["deleteInsuree", (record) => actions.deleteInsuree(mm, "fam-1", record, "label")],
    ])("%s leaves the record it was given alone", (_label, run) => {
      const record = { uuid: "uuid-1", chfId: "chf-1" };

      run(record);

      expect(record).not.toHaveProperty("clientMutationId");
    });
  });

  describe("insuree number validation", () => {
    it("asks the server whether a number may be used", () => {
      const result = actions.insureeNumberValidationCheck(mm, { insuranceNumber: "chf-1" });

      expect(result.type).toBe("INSUREE_NUMBER_VALIDATION_FIELDS");
      expect(result.variables).toEqual({ insuranceNumber: "chf-1" });
      expect(operation(result)).toContain("insureeNumberValidity(insureeNumber: $insuranceNumber)");
      expect(operation(result)).toContain("errorMessage");
    });

    it.each([
      ["insureeNumberSetValid", "INSUREE_NUMBER_VALIDATION_FIELDS_SET_VALID"],
      ["insureeNumberValidationClear", "INSUREE_NUMBER_VALIDATION_FIELDS_CLEAR"],
      ["clearInsuree", "INSUREE_INSUREE_CLEAR"],
      ["clearInsureeEnquiry", "ENQUIRY_INSUREE_CLEAR"],
      ["newFamily", "INSUREE_FAMILY_NEW"],
    ])("%s dispatches a single plain action", (creator, type) => {
      const dispatch = vi.fn();

      actions[creator]()(dispatch);

      expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type });
    });
  });

  describe("head selection", () => {
    it.each([
      ["an insuree", { uuid: "uuid-1" }, true],
      ["nothing", null, false],
      ["undefined", undefined, false],
    ])("reports %s as the selected head", (_label, insuree, headSelected) => {
      const dispatch = vi.fn();

      actions.checkIfHeadSelected(insuree)(dispatch);

      expect(dispatch).toHaveBeenCalledExactlyOnceWith({
        type: "INSUREE_CHECK_IS_HEAD_SELECTED",
        payload: { headSelected },
      });
    });
  });
});
