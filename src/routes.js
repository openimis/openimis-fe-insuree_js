// Route paths of the module and the refs other code resolves them by
// (modulesManager.getRef). Kept apart from index.jsx so a test can check a
// pushed ref against the registered paths without loading every component.
export const ROUTE_INSUREE_FAMILIES = "insuree/families";
export const ROUTE_INSUREE_FAMILY_OVERVIEW = "insuree/families/familyOverview";
export const ROUTE_INSUREE_FAMILY = "insuree/family";
export const ROUTE_INSUREE_FAMILY_NEW = `${ROUTE_INSUREE_FAMILY}/new`;
export const ROUTE_INSUREE_SUBFAMILY = "insuree/subfamily";
export const ROUTE_INSUREE_PROFILE = "insuree/profile";
export const ROUTE_INSUREE_INSUREES = "insuree/insurees";
export const ROUTE_INSUREE_INSUREE = "insuree/insurees/insuree";

export const ROUTE_REFS = [
  { key: "insuree.route.families", ref: ROUTE_INSUREE_FAMILIES },
  { key: "insuree.route.familyOverview", ref: ROUTE_INSUREE_FAMILY_OVERVIEW },
  { key: "insuree.route.family", ref: ROUTE_INSUREE_FAMILY },
  { key: "insuree.route.newFamily", ref: ROUTE_INSUREE_FAMILY_NEW },
  { key: "insuree.route.subfamily", ref: ROUTE_INSUREE_SUBFAMILY },
  { key: "insuree.route.insurees", ref: ROUTE_INSUREE_INSUREES },
  { key: "insuree.route.insuree", ref: ROUTE_INSUREE_INSUREE },
  { key: "insuree.route.insureeProfile", ref: ROUTE_INSUREE_PROFILE },
];
