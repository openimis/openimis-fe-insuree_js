import React, { Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";

import {
  Checkbox,
  Paper,
  IconButton,
  Grid,
  Divider,
  Typography,
  Tooltip,
  Collapse,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  PersonAdd as AddExistingIcon,
  PersonPin as SetHeadIcon,
  Delete as DeleteIcon,
  Clear as RemoveIcon,
  Remove as CloseIcon,
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
  fetchSubFamily,
} from "../actions";
import { RIGHT_INSUREE_DELETE, EMPTY_STRING } from "../constants";
import { insureeLabel, familyLabel } from "../utils/utils";
import ChangeInsureeFamilyDialog from "./ChangeInsureeFamilyDialog";
import EnquiryDialog from "./EnquiryDialog";
import FamilyInsureesSearcher from "./FamilyInsureesSearcher";
import RemoveInsureeFromFamilyDialog from "./RemoveInsureeFromFamilyDialog";
import AddFamilyDialog from "./AddFamilyDialog";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
});

class SubFamiliesSummary extends PagedDataHandler {
  state = {
    addFamily: false,
    chfid: null,
    confirmedAction: null,
    removeInsuree: null,
    changeInsureeFamily: null,
    reset: 0,
    canAddAction: null,
    checkedCanAdd: false,
    filters: {},
    showIFamilySearcher: false,
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-family",
      "subFamiliesSummary.rowsPerPageOptions",
      [5, 10, 20],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-family", "subFamiliesSummary.defaultPageSize", 5);
  }

  handleFamilySearcherToogle = (providedState) => this.setState(() => ({
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

  resetFilters = () => this.setState(() => ({ filters: {} }))

  closeFamilySearcher = () => {
    this.handleFamilySearcherToogle(false);
    this.resetFilters();
  }

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
      "family.route.family",
      [i.uuid, this.props.family.uuid],
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
    "insuree.familySummaries.poverty",
    "insuree.familySummaries.confirmationNo",
    "insuree.familySummaries.validityFrom",
    "insuree.familySummaries.validityTo",
    

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
    this.sorter("cardIssued"),
  ];

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

  deleteInsureeAction = (i) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familyDeleteInsuree.tooltip")}>
      <IconButton onClick={(e) => this.confirmDeleteInsuree(i)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );

  isHead = (f, i) => i.chfId === (!!f.headInsuree && f.headInsuree.chfId);

  formatters = [
    (i) => i.headInsuree.chfId || "",
    (i) => i.headInsuree.otherNames || "",
    (i) =>i.headInsuree.lastName || "",
    (i) => i.headInsuree.email  || "",
    (i) => i.headInsuree.phone || "",
    (i) => i.headInsuree.dob || "",
    (i) => i.poverty || "",
    (i) => i.confimationNo || "",
    (i) => i.validityFrom || "",
    (i) => i.validityTo || "",

    
  ];

  addNewFamily = () =>
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family")
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
      subFamily,
      fetchingSubFamily,
      errorSubFamily,
      readOnly,
      checkingCanAddInsuree,
      errorCanAddInsuree,
      familiesTotalCount
    } = this.props;
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
        //   {
        //     button: (
        //       <div>
        //         <PublishedComponent //div needed for the tooltip style!!
        //           pubRef="insuree.InsureePicker"
        //           IconRender={AddExistingIcon}
        //           forcedFilter={["head: false"]}
        //           onChange={(changeInsureeFamily) => this.setState({ changeInsureeFamily })}
        //           check={() => this.checkCanAddInsuree(() => this.setState({ checkedCanAdd: true }))}
        //           checked={this.state.checkedCanAdd}
        //         />
        //       </div>
        //     ),
        //     tooltip: formatMessage(intl, "insuree", "familyAddExsistingInsuree.tooltip"),
        //   },
          {
            button: (
              <IconButton onClick={(e) => this.setState({ addFamily: true })}>
                <AddIcon />
              </IconButton>
            ),
            tooltip: formatMessage(intl, "insuree", "familyAddNewInsuree.tooltip"),
          },
          {
            button: this.state.showIFamilySearcher ?
              <IconButton onClick={(e) => this.closeInsureeSearcher()}>
                <CloseIcon />
              </IconButton> :
              <IconButton onClick={(e) => this.handleFamilySearcherToogle(true)}>
                <SearchIcon />
              </IconButton>
            ,
            tooltip: this.state.showIFamilySearcher ?
              formatMessage(intl, "insuree", "closeInsureeSearchCriteria.tooltip") :
              formatMessage(intl, "insuree", "showInsureeSearchCriteria.tooltip"),
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
        <AddFamilyDialog
        open={this.state.addFamily}
        classes={classes}
        onClose={() => {
            this.setState({ addFamily: false});
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
              <FormattedMessage module="insuree" id="Family.families" values={{ count: familiesTotalCount }} />
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
          headers={this.headers}
          headerActions={this.headerActions}
          itemFormatters={this.formatters}
          items={(!!family && subFamily) || []}
          fetching={fetchingSubFamily}
          error={errorSubFamily}
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
  fetchingSubFamily: state.insuree.fetchingSubFamily,
  fetchedSubFamily: state.insuree.fetchedSubFamily,
  subFamily: state.insuree.subFamily,
  pageInfo: state.insuree.familyMembersPageInfo,
  familiesTotalCount: state.insuree.subFamilyTotalCount,
  errorSubFamily: state.insuree.errorSubFamily,
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
      fetch: fetchSubFamily,
      selectFamilyMember,
      deleteInsuree,
      removeInsuree,
      setFamilyHead,
      changeFamily,
      checkCanAddInsuree,
      coreAlert,
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(SubFamiliesSummary)))),
);
