import { vi } from "vitest";

// Stand-in for the @openimis/fe-core API used by the tested components: fe-core
// is a peer dependency, so the tests alias it to this file. The modules manager
// is mutable so each test can drive the configuration it needs.
const defaultModulesManager = {
  getConf: (module, key, defaultValue) => defaultValue,
};

let modulesManager = defaultModulesManager;

export const setModulesManager = (next) => {
  modulesManager = next ?? defaultModulesManager;
};

export const useModulesManager = () => modulesManager;

export const useTranslations = () => ({
  formatMessage: (id) => id,
  formatMessageWithValues: (id) => id,
  formatAmount: (amount) => String(amount ?? 0),
  formatDateFromISO: (date) => date ?? "",
});

export const withModulesManager = (Component) => (props) => <Component {...props} modulesManager={modulesManager} />;

export const GetIconComponent = (name) => (props) => <span data-icon={name} {...props} />;
