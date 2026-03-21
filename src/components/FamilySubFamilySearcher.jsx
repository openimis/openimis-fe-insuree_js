import React, { Fragment } from "react";
import _debounce from "lodash/debounce";

import { Typography, Grid, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { YoutubeSearchedFor as ResetFilterIcon } from "@mui/icons-material";

import { useTranslations, useModulesManager, ControlledField, TextInput, withTooltip, PublishedComponent } from "@openimis/fe-core";
import { EMPTY_STRING } from "../constants";

const StyledFamilySubFamilySearcher = styled("div")(({ theme }) => ({
  "& .item": theme?.paper?.item ?? {},
  "& .tableTitle": theme?.table?.title ?? {},
  "& .paperHeader": theme?.paper?.header ?? {},
  "& .paperHeaderAction": theme?.paper?.action ?? {},
}));

const FamilySubFamilySearcher = ({ filters, onChangeFilters, resetFilters }) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  const debouncedOnChangeFilter = _debounce(onChangeFilters, modulesManager.getConf("fe-insuree", "debounceTime", 200));
  const filterValue = (key) => filters?.[key]?.value ?? null;
  const filterTextFieldValue = (key) => filters?.[key]?.value ?? EMPTY_STRING;

  const actions = [
    {
      button: (
        <IconButton onClick={resetFilters}>
          <ResetFilterIcon />
        </IconButton>
      ),
      tooltip: formatMessage("resetFilters.tooltip"),
    },
  ];

  return (
    <StyledFamilySubFamilySearcher>
      <Fragment>
        <Grid container alignItems="center" direction="row" className="paperHeader">
          <Grid size={8}>
            <Typography className="tableTitle">{formatMessage("Insuree.searchCriteria")}</Typography>
          </Grid>
          <Grid size={4}>
            <Grid container justifyContent="flex-end">
              {actions.map((a) => (
                <Grid key={`searcher-action-${a.tooltip}`} className="paperHeaderAction">
                  {withTooltip(a.button, a.tooltip)}
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
        <Grid container className="item">
          <ControlledField
            module="insuree"
            id="FamilyInsureesSearch.chfId"
            field={
              <Grid size={3} className="item">
                <TextInput
                  module="insuree"
                  label="familySummaries.insuranceNo"
                  name="chfId"
                  value={filterTextFieldValue("chfId")}
                  onChange={(chfId) =>
                    debouncedOnChangeFilter([{ id: "chfId", value: chfId, filter: `members_ChfId_Istartswith: "${chfId}"` }])
                  }
                />
              </Grid>
            }
          />
          <ControlledField
            module="insuree"
            id="FamilyInsureesSearch.lastName"
            field={
              <Grid size={3} className="item">
                <TextInput
                  module="insuree"
                  label="familySummaries.lastName"
                  name="lastName"
                  value={filterTextFieldValue("lastName")}
                  onChange={(name) =>
                    debouncedOnChangeFilter([{ id: "lastName", value: name, filter: `members_LastName_Icontains: "${name}"` }])
                  }
                />
              </Grid>
            }
          />
          <ControlledField
            module="insuree"
            id="FamilyInsureesSearch.givenName"
            field={
              <Grid size={3} className="item">
                <TextInput
                  module="insuree"
                  label="familySummaries.otherNames"
                  name="givenName"
                  value={filterTextFieldValue("givenName")}
                  onChange={(name) =>
                    debouncedOnChangeFilter([
                      { id: "givenName", value: name, filter: `members_OtherNames_Icontains: "${name}"` },
                    ])
                  }
                />
              </Grid>
            }
          />
          <ControlledField
            module="insuree"
            id="FamilyInsureesSearch.gender"
            field={
              <Grid size={3} className="item">
                <PublishedComponent
                  pubRef="insuree.InsureeGenderPicker"
                  withNull={true}
                  value={filterValue("gender")}
                  onChange={(v) =>
                    onChangeFilters([{ id: "gender", value: v, filter: v ? `members_Gender_Code: "${v}"` : null }])
                  }
                />
              </Grid>
            }
          />
        </Grid>
      </Fragment>
    </StyledFamilySubFamilySearcher>
  );
};

export default FamilySubFamilySearcher;
