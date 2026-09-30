import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import {
  historyPush,
  withModulesManager,
  withHistory,
  withTooltip,
  formatMessage,
  clearCurrentPaginationPage,
  hasPermsAnywhere,
  selectUserRights,
} from "@openimis/fe-core";
import InsureeSearcher from "../components/InsureeSearcher";

import { RIGHT_INSUREE_ADD } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

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
    const { intl, classes, rights } = this.props;
    return (
      <div className={classes.page}>
        <InsureeSearcher cacheFiltersKey="insureeInsureesPageFiltersCache" onDoubleClick={this.onDoubleClick} defaultFilters={this.state.defaultFilters}/>
        {/* navigation level: a right held only on the villages the user is linked to
            (ENROLMENT) still opens the form, the village picker restricting the choice */}
        {hasPermsAnywhere(RIGHT_INSUREE_ADD, { rights }) &&
          withTooltip(
            <div className={classes.fab}>
              <Fab color="primary" onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </div>,
            formatMessage(intl, "insuree", "addNewInsureeTooltip"),
          )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: selectUserRights(state),
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ clearCurrentPaginationPage }, dispatch);

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(InsureesPage)))),
  ),
);
