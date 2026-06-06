import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { Fab } from "@mui/material";
import { GetIconComponent } from "@openimis/fe-core";
const AddIcon = GetIconComponent("Add")
import {
  historyPush,
  withModulesManager,
  withHistory,
  withTooltip,
  formatMessage,
  clearCurrentPaginationPage,
} from "@openimis/fe-core";
import InsureeSearcher from "../components/InsureeSearcher";

import { RIGHT_INSUREE_ADD } from "../constants";

const StyledInsureesPage = styled('div')(({ theme }) => ({
  ...theme?.page ?? {},
  '& .fab': theme?.fab ?? {},
}));

class InsureesPage extends Component {
  constructor(props) {
    super(props);
    let defaultFilters = {};
    this.state = {
      defaultFilters,
    };
  }

  onDoubleClick = (i, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [i.uuid], newTab);
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree");
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
      <StyledInsureesPage>
        <InsureeSearcher cacheFiltersKey="insureeInsureesPageFiltersCache" onDoubleClick={this.onDoubleClick} defaultFilters={this.state.defaultFilters} />
        {rights.includes(RIGHT_INSUREE_ADD) &&
          withTooltip(
            <div className="fab">
              <Fab color="primary" onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </div>,
            formatMessage(intl, "insuree", "addNewInsureeTooltip"),
          )}
      </StyledInsureesPage>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ clearCurrentPaginationPage }, dispatch);

export { StyledInsureesPage };
export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(InsureesPage)),
  ),
);
