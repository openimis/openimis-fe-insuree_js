import InsureeMainMenu from "./menus/InsureeMainMenu";
import FamiliesPage from "./pages/FamiliesPage";
import InsureePage from "./pages/InsureePage";
import FamilyPage from "./pages/FamilyPage";
import { CappedItemServicePage } from "./pages/CappedItemServicePage";
import InsureesPage from "./pages/InsureesPage";
import { ProfilePage } from "./pages/ProfilePage";
import FamilyOverviewPage from "./pages/FamilyOverviewPage";
import Enquiry from "./components/Enquiry";
import InsureeOfficerPicker from "./pickers/InsureeOfficerPicker";
import FamilyPicker from "./pickers/FamilyPicker";
import InsureePicker from "./pickers/InsureePicker";
import InsureeChfIdPicker from "./pickers/InsureeChfIdPicker";
import InsureeGenderPicker from "./pickers/InsureeGenderPicker";
import EducationPicker from "./pickers/EducationPicker";
import ProfessionPicker from "./pickers/ProfessionPicker";
import IdentificationTypePicker from "./pickers/IdentificationTypePicker";
import InsureeMaritalStatusPicker from "./pickers/InsureeMaritalStatusPicker";
import FamilyPovertyStatusPicker from "./pickers/FamilyPovertyStatusPicker";
import ConfirmationTypePicker from "./pickers/ConfirmationTypePicker";
import FamilyTypePicker from "./pickers/FamilyTypePicker";
import PhotoStatusPicker from "./pickers/PhotoStatusPicker";
import RelationPicker from "./pickers/RelationPicker";
import InsureeAvatar from "./components/InsureeAvatar";
import InsureeCappedItemServiceLink from "./components/InsureeCappedItemServiceLink";
import InsureeProfileLink from "./components/InsureeProfileLink";
import InsureeSummary from "./components/InsureeSummary";
import InsureeFirstServicePointDisplay from "./components/InsureeFirstServicePointDisplay";
import InsureeFirstServicePointPanel from "./components/InsureeFirstServicePointPanel";
import InsureeAddress from "./components/InsureeAddress";
import FamilyDisplayPanel from "./components/FamilyDisplayPanel";
import { familyLabel } from "./utils/utils";
import messages_en from "./translations/en.json";
import reducer from "./reducer";

const ROUTE_INSUREE_FAMILIES = "insuree/families";
const ROUTE_INSUREE_FAMILY_OVERVIEW = "insuree/familyOverview";
const ROUTE_INSUREE_FAMILY = "insuree/family";
const ROUTE_INSUREE_INSUREES = "insuree/insurees";
const ROUTE_INSUREE_INSUREE = "insuree/insuree";

const DEFAULT_CONFIG = {
  "translations": [{ key: 'en', messages: messages_en }],
  "reducers": [{ key: 'insuree', reducer }],
  "refs": [
    { key: "insuree.InsureeOfficerPicker", ref: InsureeOfficerPicker },
    { key: "insuree.InsureeOfficerPicker.projection", ref: ["id", "uuid", "code", "lastName", "otherNames"] },
    { key: "insuree.InsureePicker", ref: InsureePicker },
    { key: "insuree.InsureeChfIdPicker", ref: InsureeChfIdPicker },
    { key: "insuree.InsureePicker.projection", ref: ["id", "uuid", "chfId", "lastName", "otherNames"] },
    { key: "insuree.InsureePicker.sort", ref: 'insuree__last_name' },
    { key: "insuree.FamilyPicker", ref: FamilyPicker },
    { key: "insuree.FamilyPicker.projection", ref: ["id", "uuid", "headInsuree{id chfId uuid lastName otherNames}"] },
    { key: "insuree.FamilyPicker.sort", ref: 'family__head_insuree__lastName' },
    { key: "insuree.familyLabel", ref: familyLabel },
    { key: "insuree.InsureeGenderPicker", ref: InsureeGenderPicker },
    { key: "insuree.InsureeMaritalStatusPicker", ref: InsureeMaritalStatusPicker },
    { key: "insuree.EducationPicker", ref: EducationPicker },
    { key: "insuree.ProfessionPicker", ref: ProfessionPicker },
    { key: "insuree.IdentificationTypePicker", ref: IdentificationTypePicker },
    { key: "insuree.FamilyPovertyStatusPicker", ref: FamilyPovertyStatusPicker },
    { key: "insuree.ConfirmationTypePicker", ref: ConfirmationTypePicker },
    { key: "insuree.FamilyTypePicker", ref: FamilyTypePicker },
    { key: "insuree.PhotoStatusPicker", ref: PhotoStatusPicker },
    { key: "insuree.RelationPicker", ref: RelationPicker },

    { key: "insuree.route.families", ref: ROUTE_INSUREE_FAMILIES },
    { key: "insuree.route.familyOverview", ref: ROUTE_INSUREE_FAMILY_OVERVIEW },
    { key: "insuree.route.family", ref: ROUTE_INSUREE_FAMILY },
    { key: "insuree.route.insurees", ref: ROUTE_INSUREE_INSUREES },
    { key: "insuree.route.insuree", ref: ROUTE_INSUREE_INSUREE },

    { key: "insuree.Avatar", ref: InsureeAvatar },
    { key: "insuree.Summary", ref: InsureeSummary },
    { key: "insuree.InsureeFirstServicePointDisplay", ref: InsureeFirstServicePointDisplay },
    { key: "insuree.InsureeFirstServicePointPanel", ref: InsureeFirstServicePointPanel },
    { key: "insuree.InsureeAddress", ref: InsureeAddress },
    { key: "insuree.ProfileLink", ref: InsureeProfileLink },
    { key: "insuree.CappedItemServiceLink", ref: InsureeCappedItemServiceLink },
  ],
  "core.Router": [
    { path: ROUTE_INSUREE_FAMILIES, component: FamiliesPage },
    { path: ROUTE_INSUREE_FAMILY + "/:family_uuid?", component: FamilyPage },
    { path: ROUTE_INSUREE_FAMILY_OVERVIEW + "/:family_uuid", component: FamilyOverviewPage },
    { path: ROUTE_INSUREE_INSUREES, component: InsureesPage },
    { path: ROUTE_INSUREE_INSUREE + "/:insuree_uuid?/:family_uuid?", component: InsureePage },
    { path: "insuree/cappedItemService", component: CappedItemServicePage },
    { path: "insuree/profile", component: ProfilePage },
  ],
  "core.AppBar": [Enquiry],
  "core.MainMenu": [InsureeMainMenu],
  "insuree.InsureeSummaryAvatar": [InsureeAvatar],
  "insuree.InsureeSummaryExt": [InsureeFirstServicePointDisplay],
  "insuree.Insuree.panels": [InsureeFirstServicePointPanel],
  "policy.Policy.headPanel": [FamilyDisplayPanel],
}

export const InsureeModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
}

