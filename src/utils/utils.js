import _ from "lodash";
import { INSUREE_ACTIVE_STRING } from "../constants";

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

  const isInsureePhotoRequired = modulesManager.getConf(
    "fe-insuree",
    "insureeForm.isInsureePhotoRequired",
    false,
  );

  const isInsureeStatusRequired = modulesManager.getConf("fe-insuree", "insureeForm.isInsureeStatusRequired", false);

  if (isInsureeFirstServicePointRequired && !insuree.healthFacility) return false;
  if (insuree.validityTo) return false;
  if (!insuree.chfId) return false;
  if (!insuree.lastName) return false;
  if (!insuree.otherNames) return false;
  if (!insuree.dob) return false;
  if (!insuree.gender || !insuree.gender?.code) return false;
  if (!!insuree.photo && (!insuree.photo.date || !insuree.photo.officerId)) return false;
  if (isInsureeStatusRequired && !insuree.status) return false;
  if (isInsureePhotoRequired && !insuree.photo) return false;
  if (!!insuree.status && insuree.status !== INSUREE_ACTIVE_STRING && (!insuree.statusDate || !insuree.statusReason)) return false;

  return true;
};

// to be removed when also published in location
export const buildParentLocationFilters = (location, anchor = "parentLocation", locationTypesCount = 4) => {
  const lineage = [];
  let current = location;
  while (current) {
    lineage.unshift(current);
    current = current.parent || null;
  }

  const level = location ? lineage.length - 1 : null;
  const filters = [
    {
      id: anchor,
      value: location || null,
      filter: location ? `${anchor}: "${location.uuid}", ${anchor}Level: ${level}` : null,
    },
  ];

  for (let i = 0; i < locationTypesCount; i++) {
    filters.push({
      id: `${anchor}_${i}`,
      value: lineage[i] || null,
      filter: "",
    });
  }

  return filters;
};

export const formatLocationString = (family) => {
  const { location, address } = family;
  return [
    location?.parent?.parent?.parent?.name,
    location?.parent?.parent?.name,
    location?.parent?.name,
    location?.name,
    address,
  ]
    .filter(Boolean)
    .join(", ");
};
