import {
  decodeId,
  getGrantedRights,
  hasPerms,
  hasPermsAnywhere,
} from "@openimis/fe-core";

import { UBA_LINK_TYPE_ENROLMENT, UBA_MODEL_LOCATION } from "../constants";

/**
 * Family and insuree rights, and the village they are granted on.
 *
 * An enrolment officer is a user holding the ENROLMENT credential (a UserBusinessAccess
 * link) on one or more villages. The family / insuree rights their role grants them may
 * sit in the *UBA bag* only, i.e. be valid on the families of those villages and nowhere
 * else - and never show up in the global bag `state.core.user.i_user.rights` the screens
 * used to read, which hid "Add family", the "+" buttons and every edit action from them.
 *
 * Which check for which place (see `docs/rights.md` in the core module):
 *  - navigation level (main menu, route pages, FABs, searcher header): `hasPermsAnywhere`;
 *  - one family / insuree: `canOnFamily` / `canOnInsuree`, i.e. `hasPerms` with a business
 *    map naming the family's village, which falls back to the global bag.
 *
 * The frontend only decides what is shown: the backend `has_perms` stays the authority.
 */

/** The village a family belongs to. */
export const familyVillage = (family) => family?.location ?? null;

/** The village an insuree is enrolled under: their family's, their current one otherwise. */
export const insureeVillage = (insuree) => insuree?.family?.location ?? insuree?.currentVillage ?? null;

/**
 * The business map of a village, under the ENROLMENT credential. A link stores the
 * primary key of the location, the projections carry its uuid and its (relay encoded) id:
 * offer both, like the claim module does for health facilities.
 */
export const villageAccessRequirements = (village) => {
  if (!village) return [];
  let pk = null;
  try {
    pk = village.id ? decodeId(village.id) : null;
  } catch (e) {
    // not a relay id: the uuid alone will do
  }
  return [village.uuid, pk]
    .filter((ref) => ref !== undefined && ref !== null && ref !== "")
    .map((ref) => [UBA_MODEL_LOCATION, ref, UBA_LINK_TYPE_ENROLMENT]);
};

/**
 * Does the user hold `perms` on that village ? Globally, or in the UBA bag through an
 * ENROLMENT link on it. With no village at hand:
 *  - `anywhereIfUnknown` (a record not saved yet, whose village is still to be picked):
 *    the navigation level answer, the village picker then restricting the choice;
 *  - otherwise the global bag alone.
 */
export const canOnVillage = (perms, village, { anywhereIfUnknown = false, ...options } = {}) => {
  const accessRequirements = villageAccessRequirements(village);
  if (!accessRequirements.length && anywhereIfUnknown) return hasPermsAnywhere(perms, options);
  return hasPerms(perms, { ...options, accessRequirements });
};

/**
 * Does the user hold `perms` on that family ? A new family (no uuid) whose village is not
 * picked yet is answered at the navigation level.
 */
export const canOnFamily = (perms, family, options = {}) =>
  canOnVillage(perms, familyVillage(family), { anywhereIfUnknown: !family?.uuid, ...options });

/** Does the user hold `perms` on that insuree, i.e. on the village of their family ? */
export const canOnInsuree = (perms, insuree, options = {}) =>
  canOnVillage(perms, insureeVillage(insuree), { anywhereIfUnknown: !insuree?.uuid, ...options });

/**
 * The rights the user may exercise on that family: the global bag, plus the UBA one when
 * an ENROLMENT link covers its village. For the components still reading a `rights` prop
 * (the panels contributed to the family form), in place of the global bag alone.
 */
export const rightsOnFamily = (family, options = {}) =>
  getGrantedRights({ ...options, accessRequirements: villageAccessRequirements(familyVillage(family)) });

/** Same as `rightsOnFamily`, for an insuree: on the village of their family. */
export const rightsOnInsuree = (insuree, options = {}) =>
  getGrantedRights({ ...options, accessRequirements: villageAccessRequirements(insureeVillage(insuree)) });
