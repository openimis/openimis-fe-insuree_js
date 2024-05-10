import React, { Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";

import { Checkbox, Paper, IconButton, Grid, Divider, Typography, Tooltip, Collapse } from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  PersonAdd as AddExistingIcon,
  PersonPin as SetHeadIcon,
  Delete as DeleteIcon,
  Clear as RemoveIcon,
  Remove as CloseIcon,
  Link as LinkIcon ,
  ArrowRightAlt as ArrowRightIcon
} from "@material-ui/icons";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
  formatDateFromISO,
  historyPush,
  withTooltip,
  FormattedMessage,
  formatSorter,
  sort,
  coreAlert,
  Table,
  PagedDataHandler,
  PublishedComponent,
  ProgressOrError,
} from "@openimis/fe-core";
import {
  fetchFamilyMembers,
  selectFamilyMember,
  deleteInsuree,
  removeInsuree,
  setFamilyHead,
  changeFamily,
  checkCanAddInsuree,
  fetchSubFamilySummary,
  clearSubFamily
} from "../actions";
import { RIGHT_INSUREE_DELETE, EMPTY_STRING } from "../constants";
import { insureeLabel, familyLabel } from "../utils/utils";
import ChangeInsureeFamilyDialog from "./ChangeInsureeFamilyDialog";
import EnquiryDialog from "./EnquiryDialog";
import FamilyInsureesSearcher from "./FamilyInsureesSearcher";
import RemoveInsureeFromFamilyDialog from "./RemoveInsureeFromFamilyDialog";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
});

class SubFamiliesSummary extends PagedDataHandler {
  state = {
    chfid: null,
    confirmedAction: null,
    removeInsuree: null,
    changeInsureeFamily: null,
    reset: 0,
    canAddAction: null,
    checkedCanAdd: false,
    filters: {},
    showIFamilySearcher: false,
    subFamilies: [],
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-family",
      "subFamiliesSummary.rowsPerPageOptions",
      [5, 10, 20],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-family", "subFamiliesSummary.defaultPageSize", 5);
    this.locationLevels = this.props.modulesManager.getConf("fe-location", "location.Location.MaxLevels", 4);
  }

  handleFamilySearcherToogle = (providedState) =>
    this.setState(() => ({
      showIFamilySearcher: providedState,
    }));

  onChangeFilters = (newFilters) => {
    const tempFilters = { ...this.state.filters };
    newFilters.forEach((filter) => {
      if (filter.value === null || filter.value === EMPTY_STRING) {
        delete tempFilters[filter.id];
      } else {
        tempFilters[filter.id] = { value: filter.value, filter: filter.filter };
      }
    });
    this.setState({ filters: tempFilters });
  };

  resetFilters = () => this.setState(() => ({ filters: {} }));

  closeFamilySearcher = () => {
    this.handleFamilySearcherToogle(false);
    this.resetFilters();
  };

  componentDidMount() {
    this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
  }

  familyChanged = (prevProps) =>
    (!prevProps.family && !!this.props.family) ||
    (!!prevProps.family &&
      !!this.props.family &&
      (prevProps.family.uuid == null || prevProps.family.uuid !== this.props.family.uuid));

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.familyChanged(prevProps)) {
      this.query();
    } else if (!prevProps.checkedCanAddInsuree && !!this.props.checkedCanAddInsuree) {
      if (_.isEmpty(this.props.canAddInsureeWarnings)) {
        this.setState({ checkedCanAdd: true }, (e) => this.state.canAddAction());
      } else {
        let messages = this.props.canAddInsureeWarnings;
        messages.push(formatMessage(this.props.intl, "insuree", "addInsuree.alert.message"));
        this.props.coreAlert(formatMessage(this.props.intl, "insuree", "addInsuree.alert.title"), messages);
      }
    } else if (!!prevProps.alert && !this.props.alert) {
      this.setState({ checkedCanAdd: true }, (e) => this.state.canAddAction());
    }
    if (this.state.filters !== prevState.filters) {
      this.query();
    }
  }
  componentWillUnmount = () => {
    this.props.clearSubFamily();
  };

  queryPrms = () => {
    let prms = [];
    if (!!this.state.orderBy) {
      prms.push(`orderBy: "${this.state.orderBy}"`);
    }
    if (!!this.props.family && !!this.props.family.uuid) {
      prms.push(`parent_Uuid:"${this.props.family.uuid}"`);
      for (const [key, value] of Object.entries(this.state.filters)) {
        prms.push(value["filter"]);
      }
      return prms;
    }
    return null;
  };

  onDoubleClick = (i, newTab = false) => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "insuree.route.subFamilyOverview",
      [i.uuid ,this.props.family.uuid, i.headInsuree.uuid],
      newTab,
    );
  };

  onChangeSelection = (i) => {
    this.props.selectFamilyMember(i[0] || null);
  };

  headers = [
    "insuree.familySummaries.insuranceNo",
    "insuree.familySummaries.lastName",
    "insuree.familySummaries.otherNames",
    "insuree.familySummaries.email",
    "insuree.familySummaries.phone",
    "insuree.familySummaries.dob",
    // ...Array.from(Array(this.locationLevels)).map((_, i) => `location.locationType.${i}`),
    // "insuree.familySummaries.poverty",
    "insuree.familySummaries.confirmationNo",
    // "insuree.familySummaries.validityFrom",
    // "insuree.familySummaries.validityTo",

  ];

  sorter = (attr, asc = true) => [
    () =>
      this.setState(
        (state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }),
        (e) => this.query(),
      ),
    () => formatSorter(this.state.orderBy, attr, asc),
  ];

  headerActions = [
    this.sorter("chfId"),
    this.sorter("lastName"),
    this.sorter("otherNames"),
    this.sorter("gender"),
    this.sorter("dob"),
    this.sorter("confirmationNo"),
  ];
  parentLocation = (location, level) => {
    if (!location) return "";
    let loc = location;
    for (var i = 1; i < this.locationLevels - level; i++) {
      if (!loc.parent) return "";
      loc = loc.parent;
    }
    return !!loc ? loc.name : "";
  };

  //   adornedChfId = (i) => (
  //     <Fragment>
  //       <IconButton
  //         size="small"
  //         onClick={(e) => !i.clientMutationId && this.setState({ enquiryOpen: true, chfid: i.chfId })}
  //       >
  //         <SearchIcon />
  //       </IconButton>
  //       {i.chfId}
  //     </Fragment>
  //   );

  confirmSetHeadInsuree = (i) => {
    let confirmedAction = () => {
      this.props.setFamilyHead(
        this.props.modulesManager,
        this.props.family.uuid,
        i.uuid,
        formatMessageWithValues(this.props.intl, "insuree", "SetFamilyHead.mutationLabel", { label: insureeLabel(i) }),
      );
    };
    this.props.onActionToConfirm(
      formatMessageWithValues(this.props.intl, "insuree", "setHeadInsureeDialog.title", { label: insureeLabel(i) }),
      formatMessageWithValues(this.props.intl, "insuree", "setHeadInsureeDialog.message", {
        current: insureeLabel(i),
        new: insureeLabel(this.props.family.headInsuree),
      }),
      confirmedAction,
    );
  };

  setHeadInsureeAction = (i) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familySetHeadInsuree.tooltip")}>
      <IconButton onClick={(e) => this.confirmSetHeadInsuree(i)}>
        <SetHeadIcon />
      </IconButton>
    </Tooltip>
  );

  removeInsuree = (cancelPolicies) => {
    let insuree = this.state.removeInsuree;
    this.setState({ removeInsuree: null }, (e) => {
      this.props.removeInsuree(
        this.props.modulesManager,
        this.props.family.uuid,
        insuree,
        cancelPolicies,
        formatMessageWithValues(
          this.props.intl,
          "insuree",
          `RemoveInsuree.${cancelPolicies ? "cancelPolicies" : "keepPolicies"}.mutationLabel`,
          {
            label: insureeLabel(insuree),
            family: familyLabel(this.props.family),
          },
        ),
      );
    });
  };

  removeInsureeAction = (removeInsuree) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familyRemoveInsuree.tooltip")}>
      <IconButton onClick={(e) => this.setState({ removeInsuree })}>
        <RemoveIcon />
      </IconButton>
    </Tooltip>
  );

  confirmDeleteInsuree = (i) => {
    let confirmedAction = () => {
      this.props.deleteInsuree(
        this.props.modulesManager,
        this.props.family.uuid,
        i,
        formatMessageWithValues(this.props.intl, "insuree", "DeleteInsuree.mutationLabel", { label: insureeLabel(i) }),
      );
    };
    this.props.onActionToConfirm(
      formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.title", { label: insureeLabel(i) }),
      formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.message", {
        label: insureeLabel(i),
      }),
      confirmedAction,
    );
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.subfamily", [this.props.family?.uuid,]);
  };

  deleteInsureeAction = (i) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familyDeleteInsuree.tooltip")}>
      <IconButton onClick={(e) => this.confirmDeleteInsuree(i)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );

  isHead = (f, i) => i.chfId === (!!f.headInsuree && f.headInsuree.chfId);
  rowLocked = (i) => !!i.clientMutationId;

  changeInsureeFamily = (cancelPolicies) => {
    let insuree = this.state.changeInsureeFamily;
    this.setState({ changeInsureeFamily: null }, (e) => {
      this.props.changeFamily(
        this.props.modulesManager,
        this.props.family.uuid,
        insuree,
        cancelPolicies,
        formatMessageWithValues(this.props.intl, "insuree", "insureeChangeFamily.mutationLabel", {
          family: familyLabel(this.props.family),
          insuree: insureeLabel(insuree),
        }),
      );
    });
  };

  checkCanAddInsuree = (action) => {
    this.setState(
      {
        canAddAction: action,
        checkedCanAdd: false,
      },
      (e) => this.props.checkCanAddInsuree(this.props.family),
    );
  };

  render() {
    const {
      intl,
      classes,
      pageInfo,
      family,
      subFamilies,
      fetchingSubFamilies,
      fetchedSubFamilies,
      errorSubFamilies,
      readOnly,
      checkingCanAddInsuree,
      errorCanAddInsuree,
      familiesTotalCount,
      clearSubFamily
    } = this.props;
    var formatters = [
      (family) => (!!family.headInsuree ? family.headInsuree.chfId : ""),
      (family) => (!!family.headInsuree ? family.headInsuree.lastName : ""),
      (family) => (!!family.headInsuree ? family.headInsuree.otherNames : ""),
      (family) => (!!family.headInsuree ? family.headInsuree.email : ""),
      (family) => (!!family.headInsuree ? family.headInsuree.phone : ""),
      (family) =>
        !!family.headInsuree
          ? formatDateFromISO(this.props.modulesManager, this.props.intl, family.headInsuree.dob)
          : "",
    ];
    for (var i = 0; i < this.locationLevels; i++) {
      // need a fixed variable to refer to as parentLocation argument
      let j = i + 0;
      formatters.push((family) => this.parentLocation(family.location, j));
    }
    formatters.push(
      (family) => <Checkbox color="primary" checked={family.poverty} readOnly />,
      (family) => family.confirmationNo,
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityFrom),
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityTo),
      (family) => <LinkIcon color="primary"  readOnly />,
      (family) => <ArrowRightIcon color="primary"  readOnly />
     
    );
    var headers = [
      "insuree.familySummaries.insuranceNo",
      "insuree.familySummaries.lastName",
      "insuree.familySummaries.otherNames",
      "insuree.familySummaries.email",
      "insuree.familySummaries.phone",
      "insuree.familySummaries.dob",
    ];
    for (var i = 0; i < this.locationLevels; i++) {
      headers.push(`location.locationType.${i}`);
    }
    headers.push(
      "insuree.familySummaries.poverty",
      "insuree.familySummaries.confirmationNo",
      "insuree.familySummaries.validityFrom",
      "insuree.familySummaries.validityTo",
      "insuree.familySummaries.includeHeadOfFamily",
      "insuree.familySummaries.RemoveSubFamily",
      "insuree.familySummaries.openNewTab",
    );
    
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
            {
              button: (
                <IconButton onClick={(e) =>{this.onAdd()}}>
                  <AddIcon />
                </IconButton>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddNewSubFamily.tooltip"),
            },
            {
              button: this.state.showIFamilySearcher ? (
                <IconButton onClick={(e) => this.closeInsureeSearcher()}>
                  <CloseIcon />
                </IconButton>
              ) : (
                <IconButton onClick={(e) => this.handleFamilySearcherToogle(true)}>
                  <SearchIcon />
                </IconButton>
              ),
              tooltip: this.state.showIFamilySearcher
                ? formatMessage(intl, "insuree", "closeInsureeSearchCriteria.tooltip")
                : formatMessage(intl, "insuree", "showInsureeSearchCriteria.tooltip"),
            },
          ];
    if (!!checkingCanAddInsuree || !!errorCanAddInsuree) {
      actions.push({
        button: (
          <div>
            <ProgressOrError progress={checkingCanAddInsuree} error={errorCanAddInsuree} />
          </div>
        ),
        tooltip: formatMessage(intl, "insuree", "familyCheckCanAdd"),
      });
    }
    return (
      <Paper className={classes.paper}>
         <EnquiryDialog
          open={this.state.enquiryOpen}
          chfid={this.state.chfid}
          onClose={() => {
            this.setState({ enquiryOpen: false, chfid: null });
          }}
        />
        <ChangeInsureeFamilyDialog
          family={family}
          insuree={this.state.changeInsureeFamily}
          onConfirm={this.changeInsureeFamily}
          onCancel={(e) => this.setState({ changeInsureeFamily: null })}
        />
        <RemoveInsureeFromFamilyDialog
          family={family}
          insuree={this.state.removeInsuree}
          onConfirm={this.removeInsuree}
          onCancel={(e) => this.setState({ removeInsuree: null })}
        />
        <Collapse in={this.state.showIFamilySearcher}>
          <FamilyInsureesSearcher
            filters={this.state.filters}
            onChangeFilters={this.onChangeFilters}
            resetFilters={this.resetFilters}
          />
        </Collapse>
        <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
          <Grid item xs={8}>
            <Typography className={classes.tableTitle}>
              <FormattedMessage
                module="insuree"
                id="Family.families"
                values={{
                  count:
                    this.props.subFamilies && this.props.subFamilies.length > 0
                      ? this.props.subFamilies.length
                      : familiesTotalCount,
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Grid container justify="flex-end">
              {actions.map((a, idx) => {
                return (
                  <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                    {withTooltip(a.button, a.tooltip)}
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
        </Grid>
        <Table
          module="insuree"
          headers={headers}
          headerActions={this.headerActions}
          itemFormatters={formatters}
          items={subFamilies ? subFamilies : []}
          fetching={fetchingSubFamilies}
          error={errorSubFamilies}
          onDoubleClick={this.onDoubleClick}
          withSelection={"single"}
          onChangeSelection={this.onChangeSelection}
          withPagination={true}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          page={this.currentPage()}
          pageSize={this.currentPageSize()}
          count={pageInfo.totalCount}
          onChangePage={this.onChangePage}
          onChangeRowsPerPage={this.onChangeRowsPerPage}
          rowLocked={this.rowLocked}
        />
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  alert: !!state.core ? state.core.alert : null,
  family: state.insuree.family,
  fetchingSubFamilies: state.insuree.fetchingSubFamilies,
  fetchedSubFamilies: state.insuree.fetchedSubFamilies,
  subFamilies: state.insuree.subFamilies,
  pageInfo: state.insuree.familyMembersPageInfo,
  familiesTotalCount: state.insuree.subFamiliesTotalCount,
  errorSubFamilies: state.insuree.errorSubFamilies,
  checkingCanAddInsuree: state.insuree.checkingCanAddInsuree,
  checkedCanAddInsuree: state.insuree.checkedCanAddInsuree,
  canAddInsureeWarnings: state.insuree.canAddInsureeWarnings,
  errorCanAddInsuree: state.insuree.errorCanAddInsuree,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetch: fetchSubFamilySummary,
      selectFamilyMember,
      deleteInsuree,
      removeInsuree,
      setFamilyHead,
      changeFamily,
      clearSubFamily,
      checkCanAddInsuree,
      coreAlert,
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(SubFamiliesSummary)))),
);
