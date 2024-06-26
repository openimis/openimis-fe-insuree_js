import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import {
  Grid,
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
} from "@material-ui/core";
import { Search as SearchIcon, People as PeopleIcon, Tab as TabIcon, Delete as DeleteIcon } from "@material-ui/icons";
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
  downloadExport,
} from "@openimis/fe-core";
import EnquiryDialog from "./EnquiryDialog";
import { RIGHT_INSUREE_DELETE, INSUREE_MARITAL_STATUS, DEFAULT } from "../constants";
import { fetchInsureeSummaries, deleteInsuree, downloadWorkers, clearWorkersExport } from "../actions";

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
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-insuree",
      "insureeFilter.rowsPerPageOptions",
      [10, 20, 50, 100],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-insuree", "insureeFilter.defaultPageSize", 10);
    this.locationLevels = this.props.modulesManager.getConf("fe-location", "location.Location.MaxLevels", 4);
    this.isWorker = props.modulesManager.getConf("fe-core", "isWorker", DEFAULT.IS_WORKER);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.errorWorkersExport && this.props.errorWorkersExport) {
      this.setState({ failedExport: true });
    }

    if (prevProps.workersExport !== this.props.workersExport && this.props.workersExport) {
      const { clearWorkersExport, workersExport, intl } = this.props;
      downloadExport(workersExport, `${formatMessage(intl, "insuree", "workers.filename")}.csv`)();
      clearWorkersExport();
    }

    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.confirmed && this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  fetch = (prms) => {
    this.props.fetchInsureeSummaries(this.props.modulesManager, prms, this.isWorker);
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
      this.renderLastNameFirst ? "insuree.insureeSummaries.lastName" : "insuree.insureeSummaries.otherNames",
      !this.renderLastNameFirst ? "insuree.insureeSummaries.lastName" : "insuree.insureeSummaries.otherNames",
      this.isWorker ? null : "insuree.insureeSummaries.maritalStatus",
      this.isWorker ? null : "insuree.insureeSummaries.gender",
      this.isWorker ? null : "insuree.insureeSummaries.email",
      this.isWorker ? null : "insuree.insureeSummaries.phone",
      this.isWorker ? null : "insuree.insureeSummaries.dob",
      ...Array.from(Array(this.locationLevels)).map((_, i) => (this.isWorker ? null : `location.locationType.${i}`)),
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

  itemFormatters = (filters) => {
    var formatters = [
      (insuree) => insuree.chfId,
      (insuree) => (this.renderLastNameFirst ? insuree.lastName : insuree.otherNames) || "",
      (insuree) => (!this.renderLastNameFirst ? insuree.lastName : insuree.otherNames) || "",
      this.isWorker
        ? null
        : (insuree) => (
            <PublishedComponent
              pubRef="insuree.InsureeMaritalStatusPicker"
              withLabel={false}
              readOnly={true}
              value={insuree.marital || INSUREE_MARITAL_STATUS[0]}
            />
          ),
      this.isWorker
        ? null
        : (insuree) => (
            <PublishedComponent
              pubRef="insuree.InsureeGenderPicker"
              withLabel={false}
              readOnly={true}
              value={!!insuree.gender ? insuree.gender.code : null}
            />
          ),
      this.isWorker ? null : (insuree) => insuree.email,
      this.isWorker ? null : (insuree) => insuree.phone,
      this.isWorker ? null : (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.dob),
    ];
    if (!this.isWorker) {
      for (var i = 0; i < this.locationLevels; i++) {
        // need a fixed variable to refer to as parentLocation argument
        let j = i + 0;
        formatters.push((insuree) =>
          this.parentLocation(insuree.currentVillage || (!!insuree.family && insuree.family.location), j),
        );
      }
    }
    formatters.push(
      filters?.showHistory?.value
        ? (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.validityFrom)
        : null,
      filters?.showHistory?.value
        ? (insuree) => formatDateFromISO(this.props.modulesManager, this.props.intl, insuree.validityTo)
        : null,
      (insuree) => (
        <Grid container wrap="nowrap" spacing="2">
          {!this.isWorker && (
            <Grid item>
              <IconButton
                size="small"
                onClick={(e) => !insuree.clientMutationId && this.setState({ open: true, chfid: insuree.chfId })}
              >
                <SearchIcon />
              </IconButton>
            </Grid>
          )}
          {!this.isWorker && insuree.family && (
            <Grid item>
              <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
                <IconButton
                  size="small"
                  onClick={(e) =>
                    !insuree.clientMutationId &&
                    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [
                      insuree.family.uuid,
                    ])
                  }
                >
                  <PeopleIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          <Grid item>
            <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openNewTabButton.tooltip")}>
              <IconButton
                size="small"
                onClick={(e) => !insuree.clientMutationId && this.props.onDoubleClick(insuree, true)}
              >
                <TabIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          {this.props.rights.includes(RIGHT_INSUREE_DELETE) && !insuree.validityTo && (
            <Grid item>
              <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.deleteFamily.tooltip")}>
                <IconButton size="small" onClick={(e) => !insuree.clientMutationId && this.confirmDelete(insuree)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      ),
    );
    return formatters.filter(Boolean);
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
      errorWorkersExport,
      downloadWorkers,
    } = this.props;
    const { failedExport } = this.state;

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
          fetch={this.fetch}
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
          exportable={this.isWorker}
          exportFetch={downloadWorkers}
          exportFields={["chf_id", "last_name", "other_names"]}
          exportFieldsColumns={{
            chf_id: formatMessage(intl, "insuree", "Insuree.chfId"),
            last_name: formatMessage(intl, "insuree", "Insuree.lastName"),
            other_names: formatMessage(intl, "insuree", "Insuree.otherNames"),
          }}
          exportFieldLabel={formatMessage(intl, "insuree", "workers.export")}
          chooseExportableColumns
        />
        {failedExport && (
          <Dialog open={failedExport} fullWidth maxWidth="sm">
            <DialogTitle> {errorWorkersExport?.message} </DialogTitle>
            <DialogContent>
              <strong> {`${errorWorkersExport?.code}:`} </strong> {errorWorkersExport?.detail}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.handleExportErrorDialogClose()} color="primary" variant="contained">
                {formatMessage(intl, null, "close")}
              </Button>
            </DialogActions>
          </Dialog>
        )}
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
  workersExport: state.insuree.workersExport,
  errorWorkersExport: state.insuree.errorWorkersExport,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchInsureeSummaries,
      deleteInsuree,
      journalize,
      coreConfirm,
      clearWorkersExport,
      downloadWorkers,
    },
    dispatch,
  );
};

export default withModulesManager(
  withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(InsureeSearcher))),
);
