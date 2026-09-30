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
  hasPerms,
  hasPermsAnywhere,
  selectUserRights,
} from "@openimis/fe-core";
import InsureeForm from "../components/InsureeForm";
import { createInsuree, updateInsuree } from "../actions";
import { RIGHT_INSUREE, RIGHT_INSUREE_ADD, RIGHT_INSUREE_EDIT, RIGHT_VIH } from "../constants";
import { canOnInsuree } from "../utils/rights";

const styles = (theme) => ({
  page: theme.page,
});

class InsureePage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree");
  };

  save = (insuree) => {
    if (!insuree.uuid) {
      this.props.createInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "CreateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
    } else {
      this.props.updateInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
    }
  };

  /**
   * Does the user hold `perms` on the insuree being looked at: globally, or through an
   * ENROLMENT link on the village of their family - the family they are added to, for a
   * new member ? A new insuree without a family is answered at the navigation level.
   */
  canOnInsuree = (perms) => {
    const { rights, insuree, family, insuree_uuid, family_uuid } = this.props;
    const uuid = insuree_uuid !== "_NEW_" ? insuree_uuid : null;
    // the store may still hold the previous insuree / family while these ones load
    const currentFamily = !!family_uuid && family?.uuid === family_uuid ? family : null;
    if (uuid) return canOnInsuree(perms, insuree?.uuid === uuid ? insuree : { uuid }, { rights });
    if (currentFamily) return canOnInsuree(perms, { family: currentFamily }, { rights });
    // a new member of a family not loaded yet: nothing beyond the global bag, for now
    if (family_uuid) return hasPerms(perms, { rights });
    return canOnInsuree(perms, null, { rights });
  };

  render() {
    const { classes, modulesManager, history, rights, insuree_uuid, family_uuid } = this.props;
    // navigation level gate: the actions below are checked against the insuree
    if (!hasPermsAnywhere(RIGHT_INSUREE, { rights })) return null;
    return (
      <div className={classes.page}>
        <InsureeForm
          insuree_uuid={insuree_uuid !== "_NEW_" ? insuree_uuid : null}
          family_uuid={family_uuid}
          back={(e) => historyPush(modulesManager, history, "insuree.route.insurees")}
          add={hasPermsAnywhere(RIGHT_INSUREE_ADD, { rights }) ? this.add : null}
          save={this.canOnInsuree(RIGHT_INSUREE_EDIT) ? this.save : null}
          readOnly={!this.canOnInsuree(RIGHT_INSUREE_EDIT) || !this.canOnInsuree(RIGHT_INSUREE_ADD)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: selectUserRights(state),
  // the insuree and the family, for the village: the UBA rights apply there
  insuree: state.insuree.insuree,
  family: state.insuree.family,
  userBusinessAccesses: state.core?.userBusinessAccesses,
  insuree_uuid: props.match.params.insuree_uuid,
  family_uuid: props.match.params.family_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createInsuree, updateInsuree }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureePage)))),
  ),
);
