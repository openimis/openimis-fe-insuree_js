import _ from "lodash";
import { INSUREE_ACTIVE_STRING, PASSPORT_LENGTH } from "../constants";

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

  const isInsureePhotoRequired = modulesManager.getConf("fe-insuree", "insureeForm.isInsureePhotoRequired", false);

  const isInsureeStatusRequired = modulesManager.getConf("fe-insuree", "insureeForm.isInsureeStatusRequired", false);
  if (isInsureeFirstServicePointRequired && !insuree.healthFacility) return false;
  if (insuree.validityTo) return false;
  // if (!insuree.chfId) return false;
  if (!insuree.lastName) return false;
  if (!insuree.otherNames) return false;
  if (!insuree.dob) return false;
  if (!insuree.gender || !insuree.gender?.code) return false;
  if (!!insuree.photo && (!insuree.photo.date || !insuree.photo.officerId || !insuree.photo.photo)) return false;
  if (!insuree.incomeLevel) return false;
  if (
    !insuree.passport ||
    (!!insuree.passport && (insuree.passport.length < PASSPORT_LENGTH || insuree.passport.length > PASSPORT_LENGTH))
  )
    return false;
  if (!!insuree.preferredPaymentMethod && insuree.preferredPaymentMethod == "PB" && !insuree.bankCoordinates)
    return false;
  if (!insuree.photo) return false;
  if (!insuree.profession) return false;
  if (isInsureeStatusRequired && !insuree.status) return false;
  if (isInsureePhotoRequired && !insuree.photo) return false;
  if (
    !!insuree.relationship &&
    insuree.relationship.id == 4 &&
    (!insuree.education || (!!insuree.education && insuree.education.id == null))
  )
    return false;
  //cas de modificationn de l'assuré qui n'est pas le parent 
  if (!!insuree.family && !!insuree.family.headInsuree && !!insuree.family.headInsuree.id ){
    if(insuree.family.headInsuree.id !== insuree.id && (!insuree.relationship ||  (!!insuree.relationship && (insuree.relationship.id ==null) ))) return false
  } 
  if (!!insuree.status && insuree.status !== INSUREE_ACTIVE_STRING && (!insuree.statusDate || !insuree.statusReason))
    return false;

  return true;
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

export const isValidWorker = (worker) => {
  return worker?.chfId;
};
