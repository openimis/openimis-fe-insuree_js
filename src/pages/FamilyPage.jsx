import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { styled } from "@mui/material/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import FamilyForm from "../components/FamilyForm";
import { createFamily, updateFamily, clearInsuree, fetchParentFamily } from "../actions";
import { RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_FAMILY_EDIT } from "../constants";
import { familyLabel } from "../utils/utils";

const StyledFamilyPage = styled('div')(({ theme }) => ({
  ...theme?.page ?? {},
}));

class FamilyPage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  };

  save = async (family) => {
    const { modulesManager, parent_uuid } = this.props;
    if (!family.uuid) {
      if (!!parent_uuid && !family.parentFamily) {
        const response = await this.props.fetchParentFamily(modulesManager, parent_uuid);
        const parentFamily = response?.payload?.data?.families?.edges?.[0]?.node;
        family.parentFamily = parentFamily?.id || null;
      }
      this.props.createFamily(
        modulesManager,
        family,
        formatMessageWithValues(this.props.intl, "insuree", "CreateFamily.mutationLabel", {
          label: familyLabel(family),
        }),
      );
    } else {
      this.props.updateFamily(
        modulesManager,
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

  render() {
    const { modulesManager, history, rights, family_uuid, overview, parent_uuid } = this.props;
    if (!rights.includes(RIGHT_FAMILY)) return null;

    const handleBack = () => {
      if (parent_uuid) {
        historyPush(modulesManager, history, "insuree.route.familyOverview", [parent_uuid]);
      } else {
        historyPush(modulesManager, history, "insuree.route.families");
      }
    };

    return (
      <StyledFamilyPage>
        <div className="page">
          <FamilyForm
            overview={overview}
            family_uuid={family_uuid}
            parent_uuid={parent_uuid}
            back={handleBack}
            add={rights.includes(RIGHT_FAMILY_ADD) ? this.add : null}
            save={rights.includes(RIGHT_FAMILY_EDIT) ? this.save : null}
            readOnly={!rights.includes(RIGHT_FAMILY_EDIT) || !rights.includes(RIGHT_FAMILY_ADD)}
          />
        </div>
      </StyledFamilyPage>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  family_uuid: props.match.params.family_uuid,
  parent_uuid: props.match.params.parent_uuid
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createFamily, updateFamily, clearInsuree, fetchParentFamily }, dispatch);
};

export { StyledFamilyPage };
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(FamilyPage)),
  ),
);
