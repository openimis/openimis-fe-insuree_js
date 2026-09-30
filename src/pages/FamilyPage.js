import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  hasPermsAnywhere,
  selectUserRights,
} from "@openimis/fe-core";
import FamilyForm from "../components/FamilyForm";
import { createFamily, updateFamily, clearInsuree } from "../actions";
import { RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_FAMILY_EDIT } from "../constants";
import { familyLabel } from "../utils/utils";
import { canOnFamily } from "../utils/rights";

const styles = (theme) => ({
  page: theme.page,
});

class FamilyPage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  };

  save = (family) => {
    if (!family.uuid) {
      this.props.createFamily(
        this.props.modulesManager,
        family,
        formatMessageWithValues(this.props.intl, "insuree", "CreateFamily.mutationLabel", {
          label: familyLabel(family),
        }),
      );
    } else {
      this.props.updateFamily(
        this.props.modulesManager,
        family,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateFamily.mutationLabel", {
          label: familyLabel(family),
        }),
      );
    }
  };

  componentWillUnmount = () => {
    this.props.clearInsuree();
  };

  /**
   * Does the user hold `perms` on the family being looked at: globally, or through an
   * ENROLMENT link on its village ? A new family is answered at the navigation level, its
   * village picker only offering the villages the user may enrol in.
   */
  canOnFamily = (perms) => {
    const { family, family_uuid, rights } = this.props;
    // the family of the store may still be the previous one while this one loads
    const current = !!family_uuid && family?.uuid === family_uuid ? family : { uuid: family_uuid };
    return canOnFamily(perms, family_uuid ? current : null, { rights });
  };

  render() {
    const { classes, modulesManager, history, rights, family_uuid, overview } = this.props;
    // navigation level gate: the actions below are checked against the family
    if (!hasPermsAnywhere(RIGHT_FAMILY, { rights })) return null;

    return (
      <div className={classes.page}>
        <FamilyForm
          overview={overview}
          family_uuid={family_uuid}
          back={(e) => historyPush(modulesManager, history, "insuree.route.families")}
          add={hasPermsAnywhere(RIGHT_FAMILY_ADD, { rights }) ? this.add : null}
          save={this.canOnFamily(RIGHT_FAMILY_EDIT) ? this.save : null}
          readOnly={!this.canOnFamily(RIGHT_FAMILY_EDIT) || !this.canOnFamily(RIGHT_FAMILY_ADD)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: selectUserRights(state),
  // the family, for its village: the UBA rights apply there, see `utils/rights.js`
  family: state.insuree.family,
  userBusinessAccesses: state.core?.userBusinessAccesses,
  family_uuid: props.match.params.family_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createFamily, updateFamily, clearInsuree }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyPage)))),
  ),
);
