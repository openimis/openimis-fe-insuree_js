import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { Link as LinkIcon } from "@material-ui/icons";
import {
  historyPush,
  withModulesManager,
  withHistory,
  withTooltip,
  formatMessage,
  clearCurrentPaginationPage,
  formatMessageWithValues,
  decodeId,
} from "@openimis/fe-core";
import { Dialog, Button, DialogActions, DialogContent } from "@material-ui/core";
import FamilySearcher from "../components/FamilySearcher";
import { updateFamily, fetchSubFamilySummary } from "../actions";
import { RIGHT_FAMILY_ADD } from "../constants";
import { familyLabel } from "../utils/utils";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  primaryButton: theme.dialog.primaryButton,
  secondaryButton: theme.dialog.secondaryButton,
});

const FAMILY_FILTERS_CONTRIBUTION_KEY = "insuree.FamilyFilters";
const FAMILY_ACTION_CONTRIBUTION_KEY = "insuree.FamilyActions";

class FamiliesPage extends Component {
  state = {
    open: false,
    familyId: null,
    selections: [],
    shouldbeLocked: false,
    disabled: true,
  };
  onDoubleClick = (f, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [f.uuid], newTab);
  };

  OnFamilySelect = (f) => {
    const { selections } = this.state;
    if (!!f.familyType && f.familyType?.code != "P") {
      this.setState({
        disabled: true,
      });
    } else if (!f.familyType) {
      this.setState({
        disabled: true,
      });
    } else {
      selections.map((selection) => {
        if (decodeId(selection.id) != decodeId(f.id)) {
          this.setState({
            disabled: false,
          });
        } else {
          this.setState({
            disabled: true,
          });
        }
      });
    }

    this.setState({
      familyId: f.id,
    });
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  };
  componentDidMount = () => {
    const moduleName = "insuree";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  };
  linkFamilyToParent = () => {
    const { selections, familyId, shouldbeLocked } = this.state;
    this.setState({
      shouldbeLocked: true,
    });
    for (let i = 0; i < selections.length; i++) {
      selections[i].parentFamily = decodeId(familyId);
    }
    const updatePromises = selections.map((selection) => {
      return this.props.updateFamily(
        this.props.modulesManager,
        selection,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateFamily.mutationLabel", {
          label: familyLabel(selection),
        }),
      );
    });

    Promise.all(updatePromises)
      .then(() => {
        this.closeModal();
      })
      .catch((error) => {
        this.closeModal();
      });
  };
  openModal = (selection) => {
    this.setState({
      open: true,
      selections: selection,
    });
  };
  closeModal = () => {
    this.setState({
      open: false,
    });
  };
  canLinkFamilyToParent = (selection) => {
    if (selection && selection.length) {
      return selection.every((selected) => {
        const familyTypeCode = selected.familyType?.code;
        return familyTypeCode !== "P" && selected.parent == null;
      });
    }
    return false;
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
    const { disabled } = this.state;
    var actions = [];
    actions.push({
      label: "insuree.familySummaries.selectParent",
      action: this.openModal,
      enabled: this.canLinkFamilyToParent,
      icon: <LinkIcon />,
    });
    return (
      <div className={classes.page}>
        <FamilySearcher
          cacheFiltersKey="insureeFamiliesPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
          filterPaneContributionsKey={FAMILY_FILTERS_CONTRIBUTION_KEY}
          actionsContributionKey={FAMILY_ACTION_CONTRIBUTION_KEY}
          actions={actions}
        />
        <Dialog maxWidth="xl" fullWidth open={this.state.open} onClose={this.closeModal}>
          <DialogContent>
            <FamilySearcher
              cacheFiltersKey="insureeFamiliesPageFiltersCache"
              OnFamilySelect={this.OnFamilySelect}
              filterPaneContributionsKey={FAMILY_FILTERS_CONTRIBUTION_KEY}
              actionsContributionKey={FAMILY_ACTION_CONTRIBUTION_KEY}
              selectParent={true}
              shouldbeLocked={this.state.shouldbeLocked}
              canSelectMutiple={false}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeModal} color="primary">
              {formatMessage(intl, "insuree", "close")}
            </Button>
            <Button
              autoFocus
              onClick={this.linkFamilyToParent}
              disabled={disabled}
              className={disabled === true ? classes.secondaryButton : classes.primaryButton}
            >
              {formatMessage(intl, "insuree", "add")}
            </Button>
          </DialogActions>
        </Dialog>

        {rights.includes(RIGHT_FAMILY_ADD) &&
          this.state.open == false &&
          withTooltip(
            <div className={classes.fab}>
              <Fab color="primary" onClick={this.onAdd}>
                <AddIcon />
              </Fab>
            </div>,
            formatMessage(intl, "insuree", "addNewFamilyTooltip"),
          )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  module: state.core?.savedPagination?.module,
  subFamily: state.insuree.subFamilies,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ clearCurrentPaginationPage, updateFamily, fetchSubFamilySummary }, dispatch);

export default injectIntl(
  withModulesManager(
    withHistory(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(FamiliesPage)))),
  ),
);
