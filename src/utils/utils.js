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

export const isValidInsuree = (insuree, modulesManager, fieldErrors) => {
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

  const fields = modulesManager.getConf("fe-insuree", "fields", {}); // config M/N/H

  const isInsureeStatusRequired = modulesManager.getConf(
    "fe-insuree",
    "insureeForm.isInsureeStatusRequired",
    false,
  );

  if (isInsureeFirstServicePointRequired && !insuree.healthFacility) {
    fieldErrors.healthFacility = "insuree.fieldRequired";
  }

  if (insuree.validityTo) {
    fieldErrors.validityTo = "insuree.fieldRequired";
  }
  if (!insuree.chfId) {
    fieldErrors.chfId = "insuree.fieldRequired";
  }
  if (!insuree.lastName) {
    fieldErrors.lastName = "insuree.fieldRequired";
  }
  if (!insuree.otherNames) {
    fieldErrors.otherNames = "insuree.fieldRequired";
  }
  if (!insuree.dob) {
    fieldErrors.dob = "insuree.fieldRequired";
  }
  if (!insuree.gender || !insuree.gender?.code) {
    fieldErrors.gender = "insuree.fieldRequired";
  }
  if (fields.email === "M" && !insuree.email) {
    fieldErrors.email = "insuree.fieldRequired";
  }
  if (fields.phone === "M" && !insuree.phone) {
    fieldErrors.phone = "insuree.fieldRequired";
  }
  if (fields.profession === "M" && !insuree.profession) {
    fieldErrors.profession = "insuree.fieldRequired";
  }
  if (fields.education === "M" && !insuree.education) {
    fieldErrors.education = "insuree.fieldRequired";
  }
  if (isInsureePhotoRequired) {
    if (!insuree?.photo?.photo) {
      fieldErrors.photo = {...fieldErrors.photo, photo: "insuree.fieldRequired"};
    }
    if (!insuree?.photo?.date) {
      fieldErrors.photo = {...fieldErrors.photo, date: "insuree.fieldRequired"};
    }
  }

  if (isInsureeStatusRequired && !insuree.status) {
    fieldErrors.status = "insuree.fieldRequired";
  }
  if (!!insuree.status && insuree.status !== INSUREE_ACTIVE_STRING && (!insuree.statusDate || !insuree.statusReason)) {
    fieldErrors.statusProblem = "insuree.statusProblem";
  }

  return Object.keys(fieldErrors).length === 0;
};


export const isValidFamily = (family, modulesManager, fieldErrors) => {
  const fields = modulesManager.getConf("fe-insuree", "fields", {}); // config M/N/H
  
  if (!family.headInsuree.chfId) {
    fieldErrors.chfId = "insuree.fieldRequired";
  }
  if (!family.headInsuree.lastName) {
    fieldErrors.lastName = "insuree.fieldRequired";
  }
  if (!family.headInsuree.otherNames) {
    fieldErrors.otherNames = "insuree.fieldRequired";
  }
  if (!family.headInsuree.gender || !family.headInsuree.gender?.code) {
    fieldErrors.gender = "insuree.fieldRequired";
  }
  if (!family.headInsuree.dob) {
    fieldErrors.dob = "insuree.fieldRequired";
  }
  if (!family.location) {
    fieldErrors.location = "insuree.fieldRequired";
  }
  if (fields.email === "M" && !family.headInsuree.email) {
    fieldErrors.email = "insuree.fieldRequired";
  }
  if (fields.phone === "M" && !family.headInsuree.phone) {
    fieldErrors.phone = "insuree.fieldRequired";
  }
  if (fields.profession === "M" && !family.headInsuree.profession) {
    fieldErrors.profession = "insuree.fieldRequired";
  }
  if (fields.education === "M" && !family.headInsuree.education) {
    fieldErrors.education = "insuree.fieldRequired";
  }

  return Object.keys(fieldErrors).length === 0;
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
