import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import PrintIcon from "@material-ui/icons/ListAlt";
import { historyPush, withModulesManager, withHistory, withTooltip, formatMessage,  decodeId } from "@openimis/fe-core";
import InsureeSearcher from "../components/InsureeSearcher";
import { print } from "../actions";

import { RIGHT_INSUREE_ADD, RIGHT_PRINT } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

class InsureesPage extends Component {
  state = {
    printParam: [],
  }
  onDoubleClick = (i, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [i.uuid], newTab);
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree");
  };

  printSelected = (selection) => {
    this.props.print(selection.map((i) =>  decodeId(i.id) ));
  };

  canPrintSelected = (selection) =>
    !!selection && selection.length;


  render() {
    const { intl, classes, rights } = this.props;
    const { printParam } = this.state;
    var actions = [];
    if (rights.includes(RIGHT_PRINT)) {
      actions.push({
        label: "insureeSummaries.printSelected",
        action: this.printSelected,
        enabled: this.canPrintSelected,
        icon: <PrintIcon />,
      });
    }
    return (
      <div className={classes.page}>
        <InsureeSearcher cacheFiltersKey="insureeInsureesPageFiltersCache" onDoubleClick={this.onDoubleClick} rights={rights} actions={actions} />
        {rights.includes(RIGHT_INSUREE_ADD) &&
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
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      print
    },
    dispatch,
  );
};


export default injectIntl(
  withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(InsureesPage))))),
);
