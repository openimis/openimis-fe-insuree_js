import React, { Component } from "react";
import { connect } from "react-redux";

import { withModulesManager, withHistory } from "@openimis/fe-core";
import FamilyPage from "./FamilyPage";

class FamilyOverviewPage extends Component {
  render() {
    return <FamilyPage {...this.props} readOnly={true} overview={true} />;
  }
}

const mapStateToProps = (state, props) => ({
  family_uuid: props.match.params.family_uuid,
});

export { FamilyOverviewPage };
export default withHistory(withModulesManager(connect(mapStateToProps)(FamilyOverviewPage)));
