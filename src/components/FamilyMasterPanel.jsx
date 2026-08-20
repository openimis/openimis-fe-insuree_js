import React, { Fragment } from "react";
import { injectIntl } from "react-intl";

import { Grid, FormControlLabel, Checkbox, Typography, Divider, Tooltip, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";


import {
  historyPush,
  withHistory,
  withModulesManager,
  TextInput,
  formatMessage,
  PublishedComponent,
  FormattedMessage,
  FormPanel,
  Contributions,
  GetIconComponent,
  GRID_RESPONSIVE_SMALL,
  GRID_RESPONSIVE_STANDARD,
} from "@openimis/fe-core";

const GRID_FAMILY_ADDRESS = { xs: 12, sm: 12, md: 8, lg: 5 };
const GRID_FAMILY_POVERTY = { xs: 12, sm: 6, md: 4, lg: 5 };
import { DEFAULT } from "../constants";

const PeopleIcon = GetIconComponent("People");

const FAMILY_MASTER_PANEL_CONTRIBUTION_KEY = "insuree.Family.master";

const StyledFamilyMasterPanel = styled('div')(({ theme }) => ({
  '& .tableTitle': theme?.table?.title ?? {},
  '& .item': theme?.paper?.item ?? {},
  '& .fullHeight': {
    height: "100%",
  },
}));

class FamilyMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.renderLastNameFirst = this.props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  renderLastNameField = (edited) => {
    return (
      <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
        <TextInput
          module="insuree"
          label="Family.headInsuree.lastName"
          readOnly={true}
          value={!edited || !edited.headInsuree ? "" : edited.headInsuree.lastName}
        />
      </Grid>
    );
  };

  renderGivenNameField = (edited) => (
    <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
      <TextInput
        module="insuree"
        label="Family.headInsuree.otherNames"
        readOnly={true}
        value={!edited || !edited.headInsuree ? "" : edited.headInsuree.otherNames}
      />
    </Grid>
  );

  headSummary = () => {
    const { edited } = this.props;
    return (
      <Fragment>
        <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
          <TextInput
            module="insuree"
            label="Family.headInsuree.chfId"
            readOnly={true}
            value={!edited || !edited.headInsuree ? "" : edited.headInsuree.chfId}
          />
        </Grid>
        {this.renderLastNameFirst ? (
          <>
            {this.renderLastNameField(edited)}
            {this.renderGivenNameField(edited)}
          </>
        ) : (
          <>
            {this.renderGivenNameField(edited)}
            {this.renderLastNameField(edited)}
          </>
        )}
        <Grid size={GRID_RESPONSIVE_SMALL} className="item">
          <PublishedComponent
            pubRef="core.DatePicker"
            value={!edited || !edited.headInsuree ? null : edited.headInsuree.dob}
            module="insuree"
            label="Family.headInsuree.dob"
            readOnly={true}
          />
        </Grid>
        <Grid size={GRID_RESPONSIVE_SMALL} className="item">
          <PublishedComponent
            pubRef="insuree.InsureeGenderPicker"
            value={!edited || !edited.headInsuree || !edited.headInsuree.gender ? null : edited.headInsuree.gender.code}
            module="insuree"
            label="Family.headInsuree.gender"
            readOnly={true}
          />
        </Grid>
      </Fragment>
    );
  };

  updateContribution = (contributionKey, contributionValue) => {
    let contributionAttribute = this.getAttribute("contribution");

    if (!contributionAttribute) {
      contributionAttribute = {};
    }
    contributionAttribute[contributionKey] = contributionValue;
    this.updateAttribute("contribution", contributionAttribute);
  };

  parentHeadLabel = () => {
    const { parentFamily } = this.props;
    const parentHead = parentFamily?.headInsuree;
    if (!parentHead) return "";
    return [parentHead.chfId, parentHead.lastName, parentHead.otherNames].filter(Boolean).join(" - ");
  };

  render() {
    const { intl, edited, openFamilyButton = false, readOnly, overview, parent_uuid, parentFamily } = this.props;
    const isSubFamily = !!parent_uuid || !!edited?.parent;
    const sameLocationAsParent = !!edited?.sameLocationAsParent;
    const isLocationReadOnly = readOnly || sameLocationAsParent;
    
    return (
      <StyledFamilyMasterPanel>
        <Fragment>
          <Grid container className="tableTitle">
            <Grid size="grow">
              <Grid container alignItems="center" justifyContent="center" direction="column" className="fullHeight">
                <Grid>
                  <Typography>
                    <FormattedMessage module="insuree" id="insuree.FamilyDetailPanel.title" />
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            {!!openFamilyButton && !!overview && !!edited.uuid && (
              <Grid size="auto">
                <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
                  <IconButton
                    onClick={(e) =>
                      historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [
                        edited.uuid,
                      ])
                    }
                  >
                    <PeopleIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
          <Divider />
          <Grid container className="item">
            {!!isSubFamily && !!parentFamily && (
              <Grid size={12} className="item">
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={sameLocationAsParent}
                      disabled={readOnly}
                      onChange={() => {
                        const nextValue = !sameLocationAsParent;
                        this.updateAttributes({
                          sameLocationAsParent: nextValue,
                          ...(nextValue ? { location: parentFamily?.location ?? null } : {}),
                        });
                      }}
                    />
                  }
                  label={formatMessage(intl, "insuree", "Family.sameLocationAsParent")}
                />
              </Grid>
            )}
            
            <Grid size={12}>
              <PublishedComponent
                pubRef="location.DetailedLocation"
                withNull={true}
                readOnly={isLocationReadOnly}
                required
                value={!edited ? null : (edited.location ?? null)}
                onChange={(v) => this.updateAttribute("location", v)}
              />
            </Grid>
            
            {!!overview && this.headSummary()}
            
            {!!isSubFamily && (
              <Grid size={3} className="item">
                <TextInput
                  module="insuree"
                  label="Family.parent.headInsuree"
                  readOnly={true}
                  value={parentFamily ? this.parentHeadLabel() : ""}
                />
              </Grid>
            )}
            
            <Grid size={3} className="item">
              <PublishedComponent
                pubRef="insuree.FamilyTypePicker"
                isSubFamily={isSubFamily}
                withNull={false}
                readOnly={readOnly}
                value={!!edited && !!edited.familyType ? edited.familyType.code : null}
                onChange={(v) => this.updateAttribute("familyType", { code: v })}
              />
            </Grid>
            
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <PublishedComponent
                pubRef="insuree.ConfirmationTypePicker"
                withNull={false}
                readOnly={readOnly}
                value={edited?.confirmationType ?? null}
                onChange={(v) => this.updateAttribute("confirmationType", v)}
              />
            </Grid>
            
            <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
              <TextInput
                module="insuree"
                label="Family.confirmationNo"
                readOnly={readOnly}
                value={!edited ? "" : edited.confirmationNo || ""}
                onChange={(v) => this.updateAttribute("confirmationNo", v)}
                required={edited?.confirmationType?.isConfirmationNumberRequired ?? false}
              />
            </Grid>
            
            <Grid size={GRID_FAMILY_ADDRESS} className="item">
              <TextInput
                module="insuree"
                label="Family.address"
                multiline
                readOnly={readOnly}
                value={!edited ? "" : edited.address || ""}
                onChange={(v) => this.updateAttribute("address", v)}
              />
            </Grid>
            
            <Grid size={GRID_FAMILY_POVERTY} className="item">
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!edited && !!edited.poverty}
                    disabled={readOnly}
                    onChange={(e) => this.updateAttribute("poverty", !edited.poverty)}
                  />
                }
                label={formatMessage(intl, "insuree", "Family.poverty")}
              />
            </Grid>
            
            <Grid size={12}>
              <Divider />
            </Grid>
          </Grid>
          
          <Contributions
            {...this.props}
            updateAttribute={this.updateContribution}
            formData={this.getAttributes()}
            formContribution={this.getAttribute("contribution")}
            edited={this.props.edited}
            contributionKey={FAMILY_MASTER_PANEL_CONTRIBUTION_KEY}
          />
        </Fragment>
      </StyledFamilyMasterPanel>
    );
  }
}

export { FAMILY_MASTER_PANEL_CONTRIBUTION_KEY };
export default withModulesManager(withHistory(injectIntl(FamilyMasterPanel)));
