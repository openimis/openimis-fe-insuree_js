import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { Grid, Button, Tooltip } from "@mui/material";
import { GetIconComponent, ActionMenu } from "@openimis/fe-core";
const SearchIcon = GetIconComponent("Search")
const PeopleIcon = GetIconComponent("People")
const TabIcon = GetIconComponent("Tab")
const DeleteIcon = GetIconComponent("Delete")
const MoreVertIcon = GetIconComponent("MoreVert")

import _ from "lodash";
import {
  withModulesManager,
  formatMessageWithValues,
  formatDateFromISO,
  formatMessage,
  withHistory,
  historyPush,
  coreConfirm,
  journalize,
  Searcher,
  PublishedComponent,
} from "@openimis/fe-core";
import EnquiryDialog from "./EnquiryDialog";
import { RIGHT_INSUREE_DELETE, INSUREE_MARITAL_STATUS, DEFAULT } from "../constants";
import { fetchInsureeSummaries, deleteInsuree } from "../actions";

import InsureeFilter from "./InsureeFilter";
import { insureeLabel } from "../utils/utils";

const INSUREE_SEARCHER_CONTRIBUTION_KEY = "insuree.InsureeSearcher";

class InsureeSearcher extends Component {
  state = {
    open: false,
    chfid: null,
    confirmedAction: null,
    reset: 0,
    failedExport: false,
    searchInitiated: false,
    initialFitlers: this.props.defaultFilters,
    anchorEl: null,
    selectedInsuree: null,
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = this.props.modulesManager.getConf(
      "fe-insuree",
      "insureeFilter.rowsPerPageOptions",
      [10, 20, 50, 100],
    );
    this.columns = this.props.modulesManager.getConf("fe-insuree", "columns", {});
    this.fields = this.props.modulesManager.getConf("fe-insuree", "fields", {});
    this.defaultPageSize = this.props.modulesManager.getConf("fe-insuree", "insureeFilter.defaultPageSize", 10);
    this.locationLevels = this.props.modulesManager.getConf("fe-location", "location.Location.MaxLevels", 4);
    this.renderLastNameFirst = this.props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
    this.isDefaultFetchInsureeActivated = this.props.modulesManager.getConf(
      "fe-insuree",
      "isDefaultFetchInsureeActivated",
      true
    );
  }

  componentDidMount() {
    this.scheduleCanInsureeDetails();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.confirmed && this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
    if (
      prevState.searchInitiated !== this.state.searchInitiated ||
      prevState.initialFitlers !== this.state.initialFitlers
    ) {
      this.scheduleCanInsureeDetails();
    }
  }

  fetch = (prms) => {
    this.props.fetchInsureeSummaries(this.props.modulesManager, prms);
  };

  canFetchInsureeDetails = () => {
    if (this.state.searchInitiated === false && !!this.state.initialFitlers) {
      this.onFiltersApplied(this.state.initialFitlers);
    }
  };

  scheduleCanInsureeDetails = () => {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.canFetchInsureeDetails();
    }, 100);
  };

  rowIdentifier = (r) => r.uuid;

  filtersToQueryParams = (state) => {
    let prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f]["filter"])
      .map((f) => state.filters[f]["filter"]);
    if (!state.beforeCursor && !state.afterCursor) {
      prms.push(`first: ${state.pageSize}`);
    }
    if (!!state.afterCursor) {
      prms.push(`after: "${state.afterCursor}"`);
      prms.push(`first: ${state.pageSize}`);
    }
    if (!!state.beforeCursor) {
      prms.push(`before: "${state.beforeCursor}"`);
      prms.push(`last: ${state.pageSize}`);
    }
    if (!!state.orderBy) {
      prms.push(`orderBy: ["${state.orderBy}"]`);
    }
    return prms;
  };

  headers = (filters) => {
    var h = [
      "insuree.insureeSummaries.insuranceNo",
      "insuree.insureeSummaries.name",
      !!this.columns.maritalStatus && this.columns.maritalStatus !== "H" ? "insuree.insureeSummaries.maritalStatus" : null,
      "insuree.insureeSummaries.gender",
      !!this.columns.email && this.columns.email !== "H" ? "insuree.insureeSummaries.email" : null,
      !!this.columns.email && this.columns.email !== "H" ? "insuree.insureeSummaries.phone" : null,
      "insuree.insureeSummaries.dob",
      ...Array.from(Array(this.locationLevels)).map((_, i) => (`location.locationType.${i}`)),
      filters?.showHistory?.value ? "insuree.insureeSummaries.validityFrom" : null,
      filters?.showHistory?.value ? "insuree.insureeSummaries.validityTo" : null,
      "",
    ];
    return h.filter(Boolean);
  };

  sorts = (filters) => {
    var results = [
      ["chfId", true],
      this.renderLastNameFirst ? ["lastName", true] : ["otherNames", true],
      !this.renderLastNameFirst ? ["lastName", true] : ["otherNames", true],
      ["marital", true],
      ["gender__code", true],
      ["email", true],
      ["phone", true],
      ["dob", true],
      filters?.showHistory?.value ? ["validityFrom", false] : null,
      filters?.showHistory?.value ? ["validityTo", false] : null,
    ];
    _.times(this.locationLevels, () => results.push(null));
    return results;
  };

  rowSecondaryHighlighted = (insuree) => !insuree?.family;

  parentLocation = (location, level) => {
    if (!location) return "";
    let loc = location;
    for (var i = 1; i < this.locationLevels - level; i++) {
      if (!loc.parent) return "";
      loc = loc.parent;
    }
    return !!loc ? loc.name : "";
  };

  handleClose = () => {
    this.setState({ open: false, chfid: null });
  };

  handleExportErrorDialogClose = () => {
    this.setState({ failedExport: false });
  };

  confirmDelete = (i) => {
    let confirmedAction = () =>
      this.props.deleteInsuree(
        this.props.modulesManager,
        !!i.family ? i.family.uuid : null,
        i,
        formatMessageWithValues(this.props.intl, "insuree", "DeleteInsuree.mutationLabel", { label: insureeLabel(i) }),
      );
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.title", { label: insureeLabel(i) }),
        formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.message", {
          label: insureeLabel(i),
        }),
      );
    this.setState({ confirmedAction }, confirm);
  };

  renderInsureeName = (insuree) =>
    this.renderLastNameFirst ? insuree.lastName + " " + insuree.otherNames : insuree.otherNames + " " + insuree.lastName;

  handleMenuOpen = (event, insuree) => {
    this.setState({
      anchorEl: event.currentTarget,
      selectedInsuree: insuree,
    });
  };

  handleMenuClose = () => {
    this.setState({
      anchorEl: null,
      selectedInsuree: null,
    });
  };

  itemFormatters = (filters) => {
    var formatters = [
      (insuree) => insuree.chfId,
      (insuree) => this.renderInsureeName(insuree),
      !!this.columns.maritalStatus && this.columns.maritalStatus !== "H" ? (insuree) => formatMessage(
        this.props.intl,
        "insuree",
        `InsureeMaritalStatus.${insuree?.marital == null || insuree.marital === "0"
          ? INSUREE_MARITAL_STATUS[0]
          : insuree.marital}`
      ) : null,
      (insuree) => formatMessage(this.props.intl, "insuree", `InsureeGender.${insuree?.gender?.code}`),
      !!this.columns.email && this.columns.email !== "H" ? (insuree) => insuree.email : null,
      !!this.columns.phone && this.columns.phone !== "H" ? (insuree) => insuree.phone : null,
      (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.dob),
    ];
    for (var i = 0; i < this.locationLevels; i++) {
      // need a fixed variable to refer to as parentLocation argument
      let j = i + 0;
      formatters.push((insuree) =>
        this.parentLocation(insuree.currentVillage || (!!insuree.family && insuree.family.location), j),
      );
    }
    formatters.push(
      filters?.showHistory?.value
        ? (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.validityFrom)
        : null,
      filters?.showHistory?.value
        ? (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.validityTo)
        : null,
      (insuree) => (
        <ActionMenu
          actions={[
            {
              icon: <SearchIcon fontSize="small" />,
              label: formatMessage(
                this.props.intl,
                "insuree",
                "insureeSummaries.openInsureeButton.buttonText"
              ),
              onClick: () =>
                this.setState({
                  open: true,
                  chfid: insuree.chfId,
                }),
            },

            insuree.family && {
              icon: <PeopleIcon fontSize="small" />,
              label: formatMessage(
                this.props.intl,
                "insuree",
                "insureeSummaries.openFamilyButton.buttonText"
              ),
              onClick: () =>
                historyPush(
                  this.props.modulesManager,
                  this.props.history,
                  "insuree.route.familyOverview",
                  [insuree.family.uuid]
                ),
            },

            {
              icon: <TabIcon fontSize="small" />,
              label: formatMessage(
                this.props.intl,
                "insuree",
                "insureeSummaries.openNewTabButton.buttonText"
              ),
              onClick: () => this.props.onDoubleClick(insuree, true),
            },

            this.props.rights.includes(RIGHT_INSUREE_DELETE) &&
            !insuree.validityTo && {
              divider: true,
              icon: <DeleteIcon fontSize="small" color="error" />,
              label: formatMessage(
                this.props.intl,
                "insuree",
                "deleteInsuree.textButton"
              ),
              color: "error.main",
              onClick: () => this.confirmDelete(insuree),
            },
          ].filter(Boolean)}
        />
      ),
    );
    return formatters.filter(Boolean);
  };

  onFiltersApplied = (filters) => {
    this.setState({
      searchInitiated: true,
      filters, // Update the active filters
    });
  };

  rowDisabled = (selection, i) => !!i.validityTo;
  rowLocked = (selection, i) => !!i.clientMutationId;

  render() {
    const {
      intl,
      insurees,
      insureesPageInfo,
      fetchingInsurees,
      fetchedInsurees,
      errorInsurees,
      filterPaneContributionsKey,
      cacheFiltersKey,
      onDoubleClick,
    } = this.props;
    const { searchInitiated } = this.state;
    let count = (insureesPageInfo?.totalCount || 0).toLocaleString();

    return (
      <Fragment>
        <EnquiryDialog open={this.state.open} chfid={this.state.chfid} onClose={this.handleClose} />
        <Searcher
          module="insuree"
          cacheFiltersKey={cacheFiltersKey}
          FilterPane={InsureeFilter}
          filterPaneContributionsKey={filterPaneContributionsKey}
          items={insurees}
          itemsPageInfo={insureesPageInfo}
          fetchingItems={fetchingInsurees}
          fetchedItems={fetchedInsurees}
          errorItems={errorInsurees}
          contributionKey={INSUREE_SEARCHER_CONTRIBUTION_KEY}
          tableTitle={formatMessageWithValues(intl, "insuree", "insureeSummaries", { count })}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          fetch={this.isDefaultFetchInsureeActivated == false && searchInitiated ? this.fetch : this.isDefaultFetchInsureeActivated == true ? this.fetch : () => { }}
          rowIdentifier={this.rowIdentifier}
          rowSecondaryHighlighted={this.rowSecondaryHighlighted}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="chfId"
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowDisabled={this.rowDisabled}
          rowLocked={this.rowLocked}
          onDoubleClick={(i) => !i.clientMutationId && onDoubleClick(i)}
          reset={this.state.reset}
        />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  insurees: state.insuree.insurees,
  insureesPageInfo: state.insuree.insureesPageInfo,
  fetchingInsurees: state.insuree.fetchingInsurees,
  fetchedInsurees: state.insuree.fetchedInsurees,
  errorInsurees: state.insuree.errorInsurees,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  confirmed: state.core.confirmed,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchInsureeSummaries,
      deleteInsuree,
      journalize,
      coreConfirm,
    },
    dispatch,
  );
};

export { INSUREE_SEARCHER_CONTRIBUTION_KEY };
export { InsureeSearcher };
export default withModulesManager(
  withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(InsureeSearcher))),
);
