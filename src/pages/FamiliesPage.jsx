import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  historyPush,
  withModulesManager,
  withHistory,
  withTooltip,
  formatMessage,
  clearCurrentPaginationPage,
} from "@openimis/fe-core";
import FamilySearcher from "../components/FamilySearcher";

import { RIGHT_FAMILY_ADD } from "../constants";

const StyledFamiliesPage = styled('div')(({ theme }) => ({
  '& .page': theme.page,
  '& .fab': theme.fab,
}));

const FAMILY_FILTERS_CONTRIBUTION_KEY = "insuree.FamilyFilters";
const FAMILY_ACTION_CONTRIBUTION_KEY = "insuree.FamilyActions";

class FamiliesPage extends Component {

  constructor(props) {
    super(props);
    let defaultFilters = {};
    this.state = {
      defaultFilters,
    };
  }

  onDoubleClick = (f, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [f.uuid], newTab);
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  };

  componentDidMount = () => {
    const moduleName = "insuree";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  };

  componentWillUnmount = () => {
    const { location, history } = this.props;
    const {
      location: { pathname },
    } = history;
    const urlPath = location.pathname;
    if (!pathname.includes(urlPath)) this.props.clearCurrentPaginationPage();
  };

  render() {
    const { intl, rights } = this.props;
    return (
      <StyledFamiliesPage>
        <div className="page">
          <FamilySearcher
            cacheFiltersKey="insureeFamiliesPageFiltersCache"
            onDoubleClick={this.onDoubleClick}
            filterPaneContributionsKey={FAMILY_FILTERS_CONTRIBUTION_KEY}
            actionsContributionKey={FAMILY_ACTION_CONTRIBUTION_KEY}
            defaultFilters = {this.state.defaultFilters}
          />
          {rights.includes(RIGHT_FAMILY_ADD) &&
            withTooltip(
              <div className="fab">
                <Fab color="primary" onClick={this.onAdd}>
                  <AddIcon />
                </Fab>
              </div>,
              formatMessage(intl, "insuree", "addNewFamilyTooltip"),
            )}
        </div>
      </StyledFamiliesPage>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ clearCurrentPaginationPage }, dispatch);

export { StyledFamiliesPage };
export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(FamiliesPage)),
  ),
);
