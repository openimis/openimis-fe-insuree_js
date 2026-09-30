import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { AssignmentInd, GroupAdd, People, Person } from "@material-ui/icons";
import {
  formatMessage,
  hasPermsAnywhere,
  MainMenuContribution,
  selectUserRights,
  withModulesManager,
} from "@openimis/fe-core";
import { DEFAULT, RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_INSUREE, RIGHT_WORKER } from "../constants";

const INSUREE_MAIN_MENU_CONTRIBUTION_KEY = "insuree.MainMenu";
const WORKER_MAIN_MENU_CONTRIBUTION_KEY = "worker.MainMenu";
// Contributions this deployment hides from the insuree menu, by route. It used to be
// `contribs.splice(contribs.length - 1)` on the *filtered* list ("hide contrib menu",
// 3679f96), meant to drop the policy holder entry - the last one registered. But the
// filter runs first: for a user without the policy holder rights (an enrolment officer),
// the last entry left was another one (payments, contributions or policies), dropped
// instead. The entry is now named rather than counted.
const HIDDEN_CONTRIBUTION_ROUTES = ["/policyHolders"];

class InsureeMainMenu extends Component {
  constructor(props) {
    super(props);
    this.isWorker = props.modulesManager.getConf("fe-core", "isWorker", DEFAULT.IS_WORKER);
    this.genericVoucherEnabled = props.modulesManager.getConf(
      "fe-worker_voucher",
      "genericVoucherEnabled",
      DEFAULT.GENERIC_VOUCHER_ENABLED,
    );
  }

  render() {
    const { modulesManager, rights } = this.props;
    let contribs = this.props.modulesManager
      .getContribs(INSUREE_MAIN_MENU_CONTRIBUTION_KEY)
      .filter((c) => !HIDDEN_CONTRIBUTION_ROUTES.includes(c.route))
      .filter((c) => !c.filter || c.filter(rights));
    let entries = [];

    if (this.isWorker) {
      const config = { genericVoucherEnabled: this.genericVoucherEnabled };

      if (hasPermsAnywhere(RIGHT_WORKER, { rights })) {
        entries.push({
          text: formatMessage(this.props.intl, "insuree", "menu.workers"),
          icon: <People />,
          route: `/${modulesManager.getRef("insuree.route.insurees")}`,
        });
      }
      
      entries.push(
        ...this.props.modulesManager
          .getContribs(WORKER_MAIN_MENU_CONTRIBUTION_KEY)
          .filter((c) => !c.filter || c.filter(rights, config)),
      );

      if (!entries) return null;

      return (
        <MainMenuContribution
          {...this.props}
          header={formatMessage(this.props.intl, "insuree", "workersMainMenu")}
          icon={<AssignmentInd />}
          entries={entries}
        />
      );
    }

    // navigation level gates: an enrolment officer holds the family / insuree rights in
    // their UBA bag, valid on the families of their villages, the pages then checking each
    // action against the family at hand (`utils/rights.js`)
    if (hasPermsAnywhere(RIGHT_FAMILY_ADD, { rights })) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.addFamilyOrGroup"),
        icon: <GroupAdd />,
        route: "/" + modulesManager.getRef("insuree.route.family"),
        withDivider: true,
      });
    }
    if (hasPermsAnywhere(RIGHT_FAMILY, { rights })) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.familiesOrGroups"),
        icon: <People />,
        route: "/" + modulesManager.getRef("insuree.route.families"),
      });
    }
    if (hasPermsAnywhere(RIGHT_INSUREE, { rights })) {
      entries.push({
        text: formatMessage(this.props.intl, "insuree", "menu.insurees"),
        icon: <Person />,
        route: "/" + modulesManager.getRef("insuree.route.insurees"),
      });
    }
    entries.push(
      // ...this.props.modulesManager
      //   .getContribs(INSUREE_MAIN_MENU_CONTRIBUTION_KEY)
      //   .filter((c) => !c.filter || c.filter(rights)),
      ...contribs
    );

    if (!entries.length) return null;
    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "insuree", "mainMenu")}
        icon={<AssignmentInd />}
        entries={entries}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: selectUserRights(state),
  // the UBA bag and the links live next to the global one: re-render when they change
  user: state.core?.user,
  userBusinessAccesses: state.core?.userBusinessAccesses,
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(InsureeMainMenu)));
