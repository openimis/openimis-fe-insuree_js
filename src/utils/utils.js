import _ from "lodash";

export function insureeLabel(insuree) {
  if (!insuree) return "";
  return `${_.compact([insuree.lastName, insuree.otherNames]).join(" ")}${
    !!insuree.chfId ? ` (${insuree.chfId})` : ""
  }`;
}

export function familyLabel(family) {
  return !!family && !!family.headInsuree ? insureeLabel(family.headInsuree) : "";
}

export const isValidInsuree = (insuree, modulesManager) => {
  const isInsureeFirstServicePointRequired = modulesManager.getConf(
    "fe-insuree",
    "insureeForm.isInsureeFirstServicePointRequired",
    false,
  );

  if (isInsureeFirstServicePointRequired && !insuree.healthFacility) return false;
  if (family.validityTo) return false;
  if (!insuree.chfId) return false;
  if (!insuree.lastName) return false;
  if (!insuree.otherNames) return false;
  if (!insuree.dob) return false;
  if (!insuree.gender || !insuree.gender?.code) return false;
  if (!!insuree.photo && (!insuree.photo.date || !insuree.photo.officerId)) return false;

  return true;
};
