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
  if (fields.chfId === "M" && !insuree.chfId) {
    fieldErrors.chfId = "insuree.fieldRequired";
  }
  if (fields.lastName === "M" && !insuree.lastName) {
    fieldErrors.lastName = "insuree.fieldRequired";
  }
  if (fields.otherNames === "M" && !insuree.otherNames) {
    fieldErrors.otherNames = "insuree.fieldRequired";
  }
  if (fields.dob === "M" && !insuree.dob) {
    fieldErrors.dob = "insuree.fieldRequired";
  }
  if (fields.gender === "M" && (!insuree.gender || !insuree.gender?.code)) {
    fieldErrors.gender = "insuree.fieldRequired";
  }
  // if (fields.email === "M" && !insuree.email) {
  //   fieldErrors.email = "insuree.fieldRequired";
  // }
  // if (fields.phone === "M" && !insuree.phone) {
  //   fieldErrors.phone = "insuree.fieldRequired";
  // }
  // if (fields.profession === "M" && !insuree.profession) {
  //   fieldErrors.profession = "insuree.fieldRequired";
  // }
  // if (fields.education === "M" && !insuree.education) {
  //   fieldErrors.education = "insuree.fieldRequired";
  // }

  // Gestion de la photo
  if (fields.photo === "M") {
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

  if (
    fields.status === "M" &&
    !!insuree.status &&
    insuree.status !== INSUREE_ACTIVE_STRING &&
    (!insuree.statusDate || !insuree.statusReason)
  ) {
    fieldErrors.statusDate = "insuree.fieldRequired";
  }
};


export const isValidFamily = (family, modulesManager, fieldErrors) => {
  const fields = modulesManager.getConf("fe-insuree", "fields", {}); // config M/N/H

  if (fields.chfId === "M" && !family.headInsuree.chfId) {
    fieldErrors.chfId = "insuree.fieldRequired";
  }
  if (fields.lastName === "M" && !family.headInsuree.lastName) {
    fieldErrors.lastName = "insuree.fieldRequired";
  }
  if (fields.otherNames === "M" && !family.headInsuree.otherNames) {
    fieldErrors.otherNames = "insuree.fieldRequired";
  }
  if (fields.gender === "M" && (!family.headInsuree.gender || !family.headInsuree.gender?.code)) {
    fieldErrors.gender = "insuree.fieldRequired";
  }
  if (fields.dob === "M" && !family.headInsuree.dob) {
    fieldErrors.dob = "insuree.fieldRequired";
  }
  if (fields.location === "M" && !family.location) {
    fieldErrors.location = "insuree.fieldRequired";
  }
  if (fields.photo === "M") {
    if (!family?.headInsuree?.photo?.photo) {
      fieldErrors.photo = {...fieldErrors.photo, photo: "insuree.fieldRequired"};
    }
    if (!family?.headInsuree?.photo?.date) {
      fieldErrors.photo = {...fieldErrors.photo, date: "insuree.fieldRequired"};
    }
  }


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
