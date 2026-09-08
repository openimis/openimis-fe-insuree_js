import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";

import { Checkbox, Button, IconButton, Grid, Divider, Typography, Collapse, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
  formatDateFromISO,
  historyPush,
  withTooltip,
  FormattedMessage,
  formatSorter,
  GetIconComponent,
  sort,
  coreAlert,
  Table,
  PagedDataHandler,
  ProgressOrError,
} from "@openimis/fe-core";
import {
  fetchSubFamilySummaries,
  fetchFamilySummaries,
  unLinkFamily,
  clearSubFamily,
  linkFamily,
} from "../actions";
import { EMPTY_STRING } from "../constants";
import { familyLabel } from "../utils/utils";
import RemoveSubFamilyDialog from "./RemoveSubFamilyDialog";
import FamilySubFamilySearcher from "./FamilySubFamilySearcher";
import LinkSubFamilyDialog from "./LinkSubFamilyDialog";

const SearchIcon = GetIconComponent("Search");
const AddIcon = GetIconComponent("Add");
const CloseIcon = GetIconComponent("Remove");
const ArrowRightIcon = GetIconComponent("ArrowRightAlt");

const StyledSubFamiliesSummary = styled("div")(({ theme }) => ({
  "& .paper": theme?.paper?.paper ?? {},
  "& .paperHeader": theme?.paper?.header ?? {},
  "& .paperHeaderAction": theme?.paper?.action ?? {},
  "& .tableTitle": theme?.table?.title ?? {},
  "& .lockedPage": theme?.page?.locked ?? {},
}));

class SubFamiliesSummary extends PagedDataHandler {
  state = {
    canAddAction: null,
    checkedCanAdd: false,
    filters: {},
    showIFamilySearcher: false,
    shouldBeLocked: false,
    removeSubFamily: null,
    linkSubFamily: false,
    selectedCandidateFamily: null,
    candidateSearchValue: "",
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf("fe-family", "subFamiliesSummary.rowsPerPageOptions", [5, 10, 20]);
    this.defaultPageSize = props.modulesManager.getConf("fe-family", "subFamiliesSummary.defaultPageSize", 5);
    this.locationLevels = this.props.modulesManager.getConf("fe-location", "location.Location.MaxLevels", 4);
  }

  componentDidMount() {
    this.setState({ orderBy: null }, () => this.onChangeRowsPerPage(this.defaultPageSize));
  }

  familyChanged = (prevProps) =>
    (!prevProps.family && !!this.props.family) ||
    (!!prevProps.family && !!this.props.family && (prevProps.family.uuid == null || prevProps.family.uuid !== this.props.family.uuid));

  componentDidUpdate(prevProps, prevState) {
    if (this.familyChanged(prevProps)) {
      this.query();
    } else if (!prevProps.checkedCanAddSubFamily && !!this.props.checkedCanAddSubFamily) {
      if (_.isEmpty(this.props.canAddSubFamilyWarnings)) {
        this.setState({ checkedCanAdd: true }, () => this.state.canAddAction?.());
      } else {
        let messages = [...this.props.canAddSubFamilyWarnings];
        messages.push(formatMessage(this.props.intl, "insuree", "addSubFamily.alert.message"));
        this.props.coreAlert(formatMessage(this.props.intl, "insuree", "addSubFamily.alert.title"), messages);
      }
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.setState({ shouldBeLocked: false, linkSubFamily: false, selectedCandidateFamily: null }, () => this.query());
    }
    if (this.state.filters !== prevState.filters) {
      this.query();
    }
  }

  componentWillUnmount = () => this.props.clearSubFamily();

  queryPrms = () => {
    let prms = [];
    if (this.state.orderBy) prms.push(`orderBy: "${this.state.orderBy}"`);
    if (this.props?.family?.uuid) {
      prms.push(`parent_Uuid:"${this.props.family.uuid}"`);
      for (const [value] of Object.entries(this.state.filters)) prms.push(value["filter"]);
      return prms;
    }
    return null;
  };

  onDoubleClick = (i, newTab = false) =>
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [i.uuid], newTab);

  sorter = (attr, asc = true) => [
    () => this.setState((state) => ({ orderBy: sort(state.orderBy, attr, asc) }), () => this.query()),
    () => formatSorter(this.state.orderBy, attr, asc),
  ];

  headerActions = [this.sorter("chfId"), this.sorter("lastName"), this.sorter("otherNames"), this.sorter("gender"), this.sorter("dob"), this.sorter("confirmationNo")];

  parentLocation = (location, level) => {
    if (!location) return "";
    let loc = location;
    for (let i = 1; i < this.locationLevels - level; i++) {
      if (!loc.parent) return "";
      loc = loc.parent;
    }
    return loc ? loc.name : "";
  };

  onAdd = () => historyPush(this.props.modulesManager, this.props.history, "insuree.route.subfamily", [this.props.family?.uuid]);

  removeSubFamily = (cancelPolicies) => {
    let subFamily = this.state.removeSubFamily;
    this.setState({ removeSubFamily: null, shouldBeLocked: true }, () => {
      this.props.unLinkFamily(
        subFamily.uuid,
        formatMessageWithValues(this.props.intl, "insuree", "unlinkFamily.mutationLabel", {
          parent: familyLabel(this.props.family),
          family: familyLabel(subFamily),
        }),
        cancelPolicies,
      );
    });
  };

  openLinkSubFamilyDialog = () => {
    this.setState({ linkSubFamily: true, selectedCandidateFamily: null, candidateSearchValue: "" }, () =>
      this.searchCandidateFamilies(""),
    );
  };

  searchCandidateFamilies = (value) => {
    const filters = ["showHistory: false"];
    if (value) filters.push(`headInsuree_ChfId_Istartswith: "${value}"`);
    this.props.fetchFamilySummaries(this.props.modulesManager, filters);
  };

  onConfirmLinkSubFamily = (cancelPolicies) => {
    const parentFamily = this.props.family;
    const subFamily = this.state.selectedCandidateFamily;
    if (!parentFamily?.uuid || !subFamily?.uuid) return;
    this.setState({ shouldBeLocked: true }, () => {
      this.props.linkFamily(
        parentFamily.uuid,
        subFamily.uuid,
        formatMessageWithValues(this.props.intl, "insuree", "linkSubFamily.mutationLabel", {
          parent: familyLabel(parentFamily),
          family: familyLabel(subFamily),
        }),
        cancelPolicies,
      );
    });
  };

  candidateFamilies = () => {
    const parentUuid = this.props.family?.uuid;
    const linkedUuids = new Set((this.props.subFamilies || []).map((f) => f.uuid));
    return (this.props.families || []).filter((f) => !!f?.uuid && f.uuid !== parentUuid && !linkedUuids.has(f.uuid));
  };

  onChangeFilters = (newFilters) => {
    const tempFilters = { ...this.state.filters };
    newFilters.forEach((filter) => {
      if (filter.value === null || filter.value === EMPTY_STRING) delete tempFilters[filter.id];
      else tempFilters[filter.id] = { value: filter.value, filter: filter.filter };
    });
    this.setState({ filters: tempFilters });
  };
  resetFilters = () => this.setState(() => ({ filters: {} }));
  closeFamilySearcher = () => {
    this.setState({ showIFamilySearcher: false });
    this.resetFilters();
  };

  render() {
    const { intl, pageInfo, subFamilies, fetchingSubFamilies, errorSubFamilies, readOnly, checkingCanAddSubFamily, errorCanAddSubFamily, familiesTotalCount } = this.props;
    
    const formatters = [
      (family) => (family.headInsuree ? family.headInsuree.chfId : ""),
      (family) => (family.headInsuree ? family.headInsuree.lastName : ""),
      (family) => (family.headInsuree ? family.headInsuree.otherNames : ""),
      (family) => (family.headInsuree ? family.headInsuree.email : ""),
      (family) => (family.headInsuree ? family.headInsuree.phone : ""),
      (family) => (family.headInsuree ? formatDateFromISO(this.props.modulesManager, this.props.intl, family.headInsuree.dob) : ""),
    ];
    
    for (let i = 0; i < this.locationLevels; i++) {
      let j = i + 0;
      formatters.push((family) => this.parentLocation(family.location, j));
    }
    
    formatters.push(
      (family) => <Checkbox checked={family.poverty} color="primary" />,
      (family) => family.confirmationNo,
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityFrom),
      (family) => formatDateFromISO(this.props.modulesManager, this.props.intl, family.validityTo),
      (family) => (
        <IconButton onClick={(e) => this.setState({ removeSubFamily: family })} disabled={this.state.shouldBeLocked}>
          <ArrowRightIcon color="primary" />
        </IconButton>
      ),
    );

    const headers = ["insuree.familySummaries.insuranceNo", "insuree.familySummaries.lastName", "insuree.familySummaries.otherNames", "insuree.familySummaries.email", "insuree.familySummaries.phone", "insuree.familySummaries.dob"];
    for (let i = 0; i < this.locationLevels; i++) headers.push(`location.locationType.${i}`);
    headers.push("insuree.familySummaries.poverty", "insuree.familySummaries.confirmationNo", "insuree.familySummaries.validityFrom", "insuree.familySummaries.validityTo", "insuree.familySummaries.RemoveSubFamily");

    let actions =
      !!readOnly || !!checkingCanAddSubFamily || !!errorCanAddSubFamily
        ? []
        : [
            {
              button: (
                <Button startIcon={<AddIcon />} onClick={(e) => this.onAdd()}>
                  {formatMessage(intl, "insuree", "familyAddNewSubFamily.buttonText")}
                </Button>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddNewSubFamily.tooltip"),
            },
            {
              button: (
                <Button startIcon={<AddIcon />} onClick={(e) => this.openLinkSubFamilyDialog()}>
                  {formatMessage(intl, "insuree", "familyAddExistingSubFamily.buttonText")}
                </Button>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddExistingSubFamily.tooltip"),
            },
            {
              button: this.state.showIFamilySearcher ? (
                <IconButton onClick={(e) => this.closeFamilySearcher()}>
                  <CloseIcon />
                </IconButton>
              ) : (
                <IconButton onClick={(e) => this.setState({ showIFamilySearcher: true })}>
                  <SearchIcon />
                </IconButton>
              ),
              tooltip: this.state.showIFamilySearcher ? formatMessage(intl, "insuree", "closeInsureeSearchCriteria.tooltip") : formatMessage(intl, "insuree", "showInsureeSearchCriteria.tooltip"),
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
      <StyledSubFamiliesSummary>
        <Paper className={this.state.shouldBeLocked ? "lockedPage" : "paper"}>
          <LinkSubFamilyDialog
            open={this.state.linkSubFamily}
            candidates={this.candidateFamilies()}
            selectedFamily={this.state.selectedCandidateFamily}
            onSelectFamily={(candidateFamily) => this.setState({ selectedCandidateFamily: candidateFamily })}
            searchValue={this.state.candidateSearchValue}
            onSearchValueChange={(value) => this.setState({ candidateSearchValue: value })}
            onSearch={this.searchCandidateFamilies}
            onConfirm={this.onConfirmLinkSubFamily}
            onCancel={() => this.setState({ linkSubFamily: false, selectedCandidateFamily: null, candidateSearchValue: "" })}
          />
          <RemoveSubFamilyDialog family={this.state.removeSubFamily} onConfirm={this.removeSubFamily} onCancel={(e) => this.setState({ removeSubFamily: null })} />
          <Collapse in={this.state.showIFamilySearcher}>
            <FamilySubFamilySearcher filters={this.state.filters} onChangeFilters={this.onChangeFilters} resetFilters={this.resetFilters} />
          </Collapse>
          <Grid container alignItems="center" direction="row" className="paperHeader">
            <Grid size={8}>
              <Typography className="tableTitle">
                <FormattedMessage module="insuree" id="Family.families" values={{ count: this.props.subFamilies && this.props.subFamilies.length > 0 ? this.props.subFamilies.length : familiesTotalCount }} />
              </Typography>
            </Grid>
            <Grid size={4}>
              <Grid container justifyContent="flex-end">
                {actions.map((a) => (
                  <Grid key={`form-action-${a.tooltip}`} className="paperHeaderAction">
                    {withTooltip(a.button, a.tooltip)}
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid size={12}>
              <Divider />
            </Grid>
          </Grid>
          <Table
            module="insuree"
            headers={headers}
            headerActions={this.headerActions}
            itemFormatters={formatters}
            items={subFamilies || []}
            fetching={fetchingSubFamilies}
            error={errorSubFamilies}
            onDoubleClick={this.onDoubleClick}
            withSelection="single"
            withPagination={true}
            rowsPerPageOptions={this.rowsPerPageOptions}
            defaultPageSize={this.defaultPageSize}
            page={this.currentPage()}
            pageSize={this.currentPageSize()}
            count={pageInfo?.totalCount || 0}
            onChangePage={this.onChangePage}
            onChangeRowsPerPage={this.onChangeRowsPerPage}
          />
        </Paper>
      </StyledSubFamiliesSummary>
    );
  }
}

const mapStateToProps = (state) => ({
  family: state.insuree.family,
  fetchingSubFamilies: state.insuree.fetchingSubFamilies,
  fetchedSubFamilies: state.insuree.fetchedSubFamilies,
  subFamilies: state.insuree.subFamilies,
  pageInfo: state.insuree.subFamiliesPageInfo,
  familiesTotalCount: state.insuree.subFamiliesTotalCount,
  errorSubFamilies: state.insuree.errorSubFamilies,
  checkingCanAddSubFamily: state.insuree.checkingCanAddSubFamily,
  checkedCanAddSubFamily: state.insuree.checkedCanAddSubFamily,
  canAddSubFamilyWarnings: state.insuree.canAddSubFamilyWarnings,
  errorCanAddSubFamily: state.insuree.errorCanAddSubFamily,
  families: state.insuree.families,
  submittingMutation: state.insuree.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetch: fetchSubFamilySummaries,
      fetchFamilySummaries,
      linkFamily,
      clearSubFamily,
      unLinkFamily,
      coreAlert,
    },
    dispatch,
  );

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(SubFamiliesSummary)));
