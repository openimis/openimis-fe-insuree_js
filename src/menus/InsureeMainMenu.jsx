import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { GetIconComponent } from "@openimis/fe-core";
const AssignmentInd = GetIconComponent("AssignmentInd")
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";

const INSUREE_MAIN_MENU_CONTRIBUTION_KEY = "insuree.MainMenu";

class InsureeMainMenu extends Component {
  render() {
    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "insuree", "mainMenu")}
        icon={<AssignmentInd />}
        contributionKey={INSUREE_MAIN_MENU_CONTRIBUTION_KEY}
        menuId="InsureeMainMenu"
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export { INSUREE_MAIN_MENU_CONTRIBUTION_KEY };
export default withModulesManager(injectIntl(connect(mapStateToProps)(InsureeMainMenu)));