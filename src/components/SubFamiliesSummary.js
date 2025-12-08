import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { Checkbox, Paper, Button, IconButton, Grid, Divider, Typography, Tooltip, Collapse } from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as CloseIcon,
  Link as LinkIcon,
  ArrowRightAlt as ArrowRightIcon,
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
  ProgressOrError,
} from "@openimis/fe-core";
import {
  selectFamilyMember,
  deleteInsuree,
  removeInsuree,
  setFamilyHead,
  changeFamily,
  checkCanAddSubFamily,
  fetchSubFamilySummaries,
  unLinkFamily,
  clearSubFamily,
} from "../actions";
import { EMPTY_STRING } from "../constants";
import { familyLabel, insureeLabel } from "../utils/utils";
import RemoveSubFamilyDialog from "./RemoveSubFamilyDialog";
import EnquiryDialog from "./EnquiryDialog";
import FamilySubFamilySearcher from "./FamilySubFamilySearcher";
import RemoveInsureeFromFamilyDialog from "./RemoveInsureeFromFamilyDialog";
import ChangeInsureeFamilyDialog from "./ChangeInsureeFamilyDialog";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
  lockedPage: theme.page.locked,
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
    shouldBeLocked: false,
    linkedFamily: null,
    removeSubFamily: null,
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
    if (this.state.orderBy) {
      prms.push(`orderBy: "${this.state.orderBy}"`);
    }
    if (this.props?.family?.uuid) {
      prms.push(`parent_Uuid:"${this.props.family.uuid}"`);
      for (const [value] of Object.entries(this.state.filters)) {
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
      [i.uuid, this.props.family.uuid, i.headInsuree.uuid],
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
    "insuree.familySummaries.confirmationNo",
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
    for (let i = 1; i < this.locationLevels - level; i++) {
      if (!loc.parent) return "";
      loc = loc.parent;
    }
    return loc ? loc.name : "";
  };

  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.subfamily", [this.props.family?.uuid]);
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
    let family = this.state.linkedFamily;
    this.setState({ changeInsureeFamily: null, shouldBeLocked:true }, (e) => {
      this.props.changeFamily(
        this.props.modulesManager,
        this.state.linkedFamily.uuid,
        insuree,
        cancelPolicies,
        formatMessageWithValues(this.props.intl, "insuree", "insureeChangeFamily.mutationLabel", {
          family: familyLabel(family),
          insuree: insureeLabel(insuree),
        }),
      );
    });
  };

  removeSubFamily = (cancelPolicies) => {
    let subFamily = this.state.removeSubFamily;
    this.setState({ removeSubFamily: null, shouldBeLocked: true }, (e) => {
      this.props.unLinkFamily(
        subFamily.uuid,
        formatMessageWithValues(this.props.intl, "insuree", "unlinkFamily.mutationLabel", {
          label: familyLabel(subFamily),
        }),
        cancelPolicies,
      );
    });
  };

  checkCanAddSubFamily = (action) => {
    this.setState(
      {
        canAddAction: action,
        checkedCanAdd: false,
      },
      (e) => this.props.checkCanAddSubFamily(this.props.family),
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
      errorSubFamilies,
      readOnly,
      checkingCanAddSubFamily,
      errorCanAddSubFamily,
      familiesTotalCount,
    } = this.props;
    const { shouldBeLocked } = this.state;
    const formatters = [
      (family) => (family.headInsuree ? family.headInsuree.chfId : ""),
      (family) => (family.headInsuree ? family.headInsuree.lastName : ""),
      (family) => (family.headInsuree ? family.headInsuree.otherNames : ""),
      (family) => (family.headInsuree ? family.headInsuree.email : ""),
      (family) => (family.headInsuree ? family.headInsuree.phone : ""),
      (family) =>
        family.headInsuree
          ? formatDateFromISO(this.props.modulesManager, this.props.intl, family.headInsuree.dob)
          : "",
    ];
    for (let i = 0; i < this.locationLevels; i++) {
      // need a fixed variable to refer to as parentLocation argument
      let j = i + 0;
      formatters.push((family) => this.parentLocation(family.location, j));
    }
    formatters.push(
      (family) => <Checkbox color="primary" checked={family.poverty} readOnly />,
      (family) => family.confirmationNo,
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityFrom),
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityTo),
      (family) => (
        <IconButton
          onClick={(e) =>
            this.setState({
              changeInsureeFamily: this.props.family.headInsuree,
              linkedFamily: family,
            })
          }
          disabled={this.state.shouldBeLocked}
        >
          {" "}
          <LinkIcon color="primary" readOnly />
        </IconButton>
      ),
      (family) => (
        <IconButton
          onClick={(e) =>
            this.setState({
              removeSubFamily: family,
            })
          }
          disabled={this.state.shouldBeLocked}
        >
          <ArrowRightIcon color="primary" readOnly />
        </IconButton>
      ),
    );
    const headers = [
      "insuree.familySummaries.insuranceNo",
      "insuree.familySummaries.lastName",
      "insuree.familySummaries.otherNames",
      "insuree.familySummaries.email",
      "insuree.familySummaries.phone",
      "insuree.familySummaries.dob",
    ];
    for (let i = 0; i < this.locationLevels; i++) {
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
      !!readOnly || !!checkingCanAddSubFamily || !!errorCanAddSubFamily
        ? []
        : [
            {
              button: (
                <Button
                  startIcon={<AddIcon />}
                  onClick={(e) => {
                    this.onAdd();
                  }}
                >
                  {formatMessage(intl, "insuree", "familyAddNewSubFamily.buttonText")}
                </Button>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddNewSubFamily.tooltip"),
            },
            {
              button: this.state.showIFamilySearcher ? (
                <IconButton onClick={(e) => this.closeFamilySearcher()}>
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
    if (!!checkingCanAddSubFamily || !!errorCanAddSubFamily) {
      actions.push({
        button: (
          <div>
            <ProgressOrError progress={checkingCanAddSubFamily} error={errorCanAddSubFamily} />
          </div>
        ),
        tooltip: formatMessage(intl, "insuree", "familyCheckCanAdd"),
      });
    }
    return (
      <Paper className={shouldBeLocked ? classes.lockedPage : classes.paper}>
        <EnquiryDialog
          open={this.state.enquiryOpen}
          chfid={this.state.chfid}
          onClose={() => {
            this.setState({ enquiryOpen: false, chfid: null });
          }}
        />
        <ChangeInsureeFamilyDialog
          family={this.state.linkedFamily}
          insuree={this.state.changeInsureeFamily}
          onConfirm={this.changeInsureeFamily}
          onCancel={(e) => this.setState({ changeInsureeFamily: null })}
        />

        <RemoveSubFamilyDialog
          family={this.state.removeSubFamily}
          onConfirm={this.removeSubFamily}
          onCancel={(e) => this.setState({ removeSubFamily: null })}
        />
        <RemoveInsureeFromFamilyDialog
          family={family}
          insuree={this.state.removeInsuree}
          onConfirm={this.removeInsuree}
          onCancel={(e) => this.setState({ removeInsuree: null })}
        />
        <Collapse in={this.state.showIFamilySearcher}>
          <FamilySubFamilySearcher
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
              {actions.map((a) => {
                return (
                  <Grid item key={`form-action-${a.tooltip}`} className={classes.paperHeaderAction}>
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
          items={ subFamilies || []}
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
  alert: state.core ? state.core.alert : null,
  family: state.insuree.family,
  fetchingSubFamilies: state.insuree.fetchingSubFamilies,
  fetchedSubFamilies: state.insuree.fetchedSubFamilies,
  subFamilies: state.insuree.subFamilies,
  pageInfo: state.insuree.familyMembersPageInfo,
  familiesTotalCount: state.insuree.subFamiliesTotalCount,
  errorSubFamilies: state.insuree.errorSubFamilies,
  checkingCanAddSubFamily: state.insuree.checkingCanAddSubFamily,
  checkedCanAddSubFamily: state.insuree.checkedCanAddSubFamily,
  canAddSubFamilyWarnings: state.insuree.canAddSubFamilyWarnings,
  errorCanAddSubFamily: state.insuree.errorCanAddSubFamily,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetch : fetchSubFamilySummaries,
      selectFamilyMember,
      deleteInsuree,
      removeInsuree,
      setFamilyHead,
      changeFamily,
      checkCanAddSubFamily,
      clearSubFamily,
      unLinkFamily,
      coreAlert,
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(SubFamiliesSummary)))),
);