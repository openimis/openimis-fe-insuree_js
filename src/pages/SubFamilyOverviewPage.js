import React, { Component } from "react";
import { connect } from "react-redux";
import { Edit as EditIcon } from "@material-ui/icons";
import { historyPush, withModulesManager, withHistory } from "@openimis/fe-core";
import SubFamilyPage from "./SubFamilyPage";

class SubFamilyOverviewPage extends Component {
  render() {
    const { history, modulesManager, subFamilie_uuid, family_uuid, insuree_uuid } = this.props;
    var actions = [
      {
        doIt: (e) => historyPush(modulesManager, history, "insuree.route.subFamily", [subFamilie_uuid, family_uuid, insuree_uuid]),
        icon: <EditIcon />,
        onlyIfDirty: false,
      },
    ];
    return <SubFamilyPage {...this.props} readOnly={true} overview={true} actions={actions} />;
  }
}

const mapStateToProps = (state, props) => ({
  family_uuid: props.match.params.family_uuid,
  subFamily_uuid: props.match.params.subFamily_uuid,
  insuree_uuid : props.match.params.insuree_uuid
});

export default withHistory(withModulesManager(connect(mapStateToProps)(SubFamilyOverviewPage)));
