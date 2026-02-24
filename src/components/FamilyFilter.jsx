import React, { Component, Fragment } from "react";
import { injectIntl } from "react-intl";
import _debounce from "lodash/debounce";

import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  GRID_RESPONSIVE_STANDARD,
  GRID_RESPONSIVE_SMALL,
  GRID_RESPONSIVE_FULL,
  GRID_RESPONSIVE_HALF,
} from "@openimis/fe-core";

import {
  withModulesManager,
  formatMessage,
  Contributions,
  PublishedComponent,
  ControlledField,
  TextInput,
} from "@openimis/fe-core";
import { DEFAULT } from "../constants";

const StyledFamilyFilter = styled("div")(({ theme }) => ({
  "& .dialogTitle": theme?.dialog?.title ?? {},
  "& .dialogContent": theme?.dialog?.content ?? {},
  "& .form": {
    padding: 0,
  },
  "& .item": {
    padding: theme?.spacing ? theme.spacing(1) : 8,
  },
  "& .paperDivider": theme?.paper?.divider ?? {},
}));

class FamilyFilter extends Component {
  state = {
    additionalFilters: {},
  };

  constructor(props) {
    super(props);
    this.columns = props.modulesManager.getConf("fe-insuree", "columns", {});
    this.filterFamiliesOnMembers = props.modulesManager.getConf("fe-insuree", "filterFamiliesOnMembers", true);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  debouncedOnChangeFilters = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-insuree", "debounceTime", 200),
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _filterTextFieldValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : "";
  };

  _onChangeCheckbox = (key, value) => {
    let filters = [
      {
        id: key,
        value: value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
  };

  renderLastNameField = (anchor) => (
    <ControlledField
      module="insuree"
      id={`FamilyFilter.${anchor}.lastName`}
      field={
        <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
          <TextInput
            module="insuree"
            label={`Family.${anchor}.lastName`}
            name={`${anchor}_lastName`}
            value={this._filterTextFieldValue(`${anchor}.lastName`)}
            onChange={(v) =>
              this.debouncedOnChangeFilters([
                {
                  id: `${anchor}.lastName`,
                  value: v,
                  filter: !!v ? `${anchor}_LastName_Icontains: "${v}"` : null,
                },
              ])
            }
          />
        </Grid>
      }
    />
  );

  renderGivenNameField = (anchor) => (
    <ControlledField
      module="insuree"
      id={`FamilyFilter.${anchor}.givenName`}
      field={
        <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
          <TextInput
            module="insuree"
            label={`Family.${anchor}.otherNames`}
            name={`${anchor}_givenName`}
            value={this._filterTextFieldValue(`${anchor}.givenName`)}
            onChange={(v) =>
              this.debouncedOnChangeFilters([
                {
                  id: `${anchor}.givenName`,
                  value: v,
                  filter: !!v ? `${anchor}_OtherNames_Icontains: "${v}"` : null,
                },
              ])
            }
          />
        </Grid>
      }
    />
  );

  personFilter = (anchor) => {
    const { onChangeFilters } = this.props;
    return (
      <Fragment>
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.chfId`}
          field={
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <TextInput
                module="insuree"
                label={`Family.${anchor}.chfId`}
                name={`${anchor}_chfId`}
                value={this._filterTextFieldValue(`${anchor}.chfId`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.chfId`,
                      value: v,
                      filter: !!v ? `${anchor}_ChfId_Istartswith: "${v}"` : null,
                    },
                  ])
                }
                inputProps={{ "data-cy": "head-insuree-chf-id-filter" }}
              />
            </Grid>
          }
        />
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField(anchor)}
            {this.renderGivenNameField(anchor)}
          </>
        ) : (
          <>
            {this.renderGivenNameField(anchor)}
            {this.renderLastNameField(anchor)}
          </>
        )}
        <ControlledField
          module="insuree"
          id={`InsureeFilter.${anchor}.gender`}
          field={
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="insuree.InsureeGenderPicker"
                withNull={true}
                label={`Family.${anchor}.gender`}
                value={this._filterValue(`${anchor}.gender`)}
                reset={this.props.reset}
                onChange={(v) =>
                  onChangeFilters([
                    {
                      id: `${anchor}.gender`,
                      value: v,
                      filter: !!v ? `${anchor}_Gender_Code: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.phone`}
          field={
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <TextInput
                module="insuree"
                label={`Family.${anchor}.phone`}
                name={`${anchor}_phone`}
                value={this._filterTextFieldValue(`${anchor}.phone`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.phone`,
                      value: v,
                      filter: !!v ? `${anchor}_Phone_Icontains: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {!this.columns?.email === "H" && (
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.email`}
          field={
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <TextInput
                module="insuree"
                label={`Family.${anchor}.email`}
                name={`${anchor}_email`}
                value={this._filterTextFieldValue(`${anchor}.email`)}
                onChange={(v) =>
                  this.debouncedOnChangeFilters([
                    {
                      id: `${anchor}.email`,
                      value: v,
                      filter: !!v ? `${anchor}_Email_Icontains: "${v}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        )}
        <ControlledField
          module="insuree"
          id={`FamilyFilter.${anchor}.dob`}
          field={
            <Grid size={GRID_RESPONSIVE_STANDARD}>
              <Grid container>
                <Grid size={GRID_RESPONSIVE_HALF} className="item">
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue(`${anchor}.dobFrom`)}
                    module="insuree"
                    label={`Family.${anchor}.dobFrom`}
                    reset={this.props.reset}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: `${anchor}.dobFrom`,
                          value: d,
                          filter: !!d ? `${anchor}_Dob_Gte: "${d}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
                <Grid size={GRID_RESPONSIVE_HALF} className="item">
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue(`${anchor}.dobTo`)}
                    module="insuree"
                    label={`Family.${anchor}.dobTo`}
                    reset={this.props.reset}
                    onChange={(d) =>
                      onChangeFilters([
                        {
                          id: `${anchor}.dobTo`,
                          value: d,
                          filter: !!d ? `${anchor}_Dob_Lte: "${d}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          }
        />
      </Fragment>
    );
  };

  onChangeAdditionalFilters = (module, fltrs) => {
    const { onChangeFilters } = this.props;

    let filters = { ...this.state.additionalFilters };
    if (!("additionalFilters" in filters)) {
      filters.additionalFilters = {};
    }

    fltrs.forEach((filter) => {
      if (filter.value === null && module in filters.additionalFilters) {
        delete filters.additionalFilters[module][filter.id];
      } else {
        if (!(module in filters.additionalFilters)) {
          filters.additionalFilters[module] = {};
        }
        filters.additionalFilters[module][filter.id] = filter;
      }
    });
    let filterContent = !!JSON.stringify(filters.additionalFilters) ? JSON.stringify(filters.additionalFilters) : "{}";
    filterContent = filterContent.replaceAll('"', '\\"');

    onChangeFilters([
      {
        id: "additionalFilter",
        value: filters.additionalFilters,
        filter: `additionalFilter: "${filterContent}"`,
      },
    ]);
  };

  familyHeadFilter = () => this.personFilter("headInsuree");
  familyMemberFilter = () => this.personFilter("members");

  render() {
    const { intl, filters, onChangeFilters, filterPaneContributionsKey } = this.props;
    return (
      <StyledFamilyFilter>
        <Grid container className="form">
          <ControlledField
            module="insuree"
            id="FamilyFilter.location"
            field={
              <Grid size={GRID_RESPONSIVE_FULL}>
                <PublishedComponent
                  pubRef="location.DetailedLocationFilter"
                  withNull={true}
                  filters={filters}
                  onChangeFilters={onChangeFilters}
                  anchor="parentLocation"
                  reset={this.props.reset}
                  split
                />
              </Grid>
            }
          />
          {this.familyHeadFilter()}
          {this.filterFamiliesOnMembers && this.familyMemberFilter()}
          <ControlledField
            module="insuree"
            id="FamilyFilter.poverty"
            field={
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="insuree.FamilyPovertyStatusPicker"
                  value={this._filterValue("poverty")}
                  reset={this.props.reset}
                  onChange={(v) =>
                    onChangeFilters([
                      {
                        id: "poverty",
                        value: v,
                        filter: v === null ? null : `nullAsFalsePoverty: ${v}`,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
          {this.columns?.confirmationNo !== "H" && (
        <ControlledField
            module="insuree"
            id="FamilyFilter.confirmationNo"
            field={
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <TextInput
                  module="insuree"
                  label="Family.confirmationNo"
                  name="confirmationNo"
                  value={this._filterTextFieldValue("confirmationNo")}
                  onChange={(v) =>
                    this.debouncedOnChangeFilters([
                      {
                        id: "confirmationNo",
                        value: v,
                        filter: `confirmationNo_Istartswith: "${v}"`,
                      },
                    ])
                  }
                  inputProps={{ "data-cy": "family-confirmation-no" }}
                />
              </Grid>
            }
          />
          )}
        <ControlledField
            module="insuree"
            id="PolicyFilter.officer"
            field={
              <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
                <PublishedComponent
                  pubRef="policy.PolicyOfficerPicker"
                  withNull={true}
                  value={this._filterValue("officer")}
                  reset={this.props.reset}
                  onChange={(v) =>
                    onChangeFilters([
                      {
                        id: "officer",
                        value: v,
                        filter: v === null ? null : `officer: "${v.uuid}"`,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
          {!!filterPaneContributionsKey && (
            <Contributions
              filters={filters}
              onChangeFilters={this.onChangeAdditionalFilters}
              contributionKey={filterPaneContributionsKey}
            />
          )}
          <ControlledField
            module="insuree"
            id="FamilyFilter.showHistory"
            field={
              <Grid size={GRID_RESPONSIVE_SMALL} className="item">
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={!!this._filterValue("showHistory")}
                      onChange={(event) => this._onChangeCheckbox("showHistory", event.target.checked)}
                    />
                  }
                  label={formatMessage(intl, "insuree", "FamilyFilter.showHistory")}
                />
              </Grid>
            }
          />
        </Grid>
      </StyledFamilyFilter>
    );
  }
}

export { StyledFamilyFilter };
export default withModulesManager(injectIntl(FamilyFilter));
