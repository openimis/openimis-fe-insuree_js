import React from "react";
import { styled } from "@mui/material/styles";
import { Paper, Grid, Typography, Divider, Checkbox, FormControlLabel } from "@mui/material";
import {
  formatMessage,
  withTooltip,
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  Contributions,
  withModulesManager,
} from "@openimis/fe-core";

const StyledInsureeMasterPanel = styled('div')(({ theme }) => ({
  '& .paper': theme?.paper?.paper ?? {},
  '& .tableTitle': theme?.table?.title ?? {},
  '& .item': theme?.paper?.item ?? {},
  '& .fullHeight': {
    height: "100%",
  },
}));

import { DEFAULT, INSUREE_ACTIVE_STRING } from "../constants";

const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";

class InsureeMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.isInsureeStatusRequired = props.modulesManager.getConf(
      "fe-insuree",
      "insureeForm.isInsureeStatusRequired",
      false,
    );
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
  }

  renderLastNameField = (edited, readOnly) => {
    return (
      <Grid size={4} className="item">
        <TextInput
          module="insuree"
          label="Insuree.lastName"
          required={true}
          readOnly={readOnly}
          value={!!edited && !!edited.lastName ? edited.lastName : ""}
          onChange={(v) => this.updateAttribute("lastName", v)}
          inputProps={{ "data-cy": "insuree-last-name" }}
        />
      </Grid>
    );
  };

  renderGivenNameField = (edited, readOnly) => (
    <Grid size={4} className="item">
      <TextInput
        module="insuree"
        label="Insuree.otherNames"
        required={true}
        readOnly={readOnly}
        value={!!edited && !!edited.otherNames ? edited.otherNames : ""}
        onChange={(v) => this.updateAttribute("otherNames", v)}
        inputProps={{ "data-cy": "insuree-other-names" }}
      />
    </Grid>
  );

  render() {
    const {
      intl,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      actions,
      editedId,
    } = this.props;

    return (
      <StyledInsureeMasterPanel>
        <Grid container>
          <Grid size={12}>
            <Paper className="paper">
              <Grid container className="tableTitle">
                <Grid size={3} container alignItems="center" className="item">
                  <Typography variant="h5">
                    <FormattedMessage module="insuree" id={title} values={titleParams} />
                  </Typography>
                </Grid>
                <Grid size={9}>
                  <Grid container justify="flex-end">
                    {!!edited &&
                      !!edited.family &&
                      !!edited.family.headInsuree &&
                      edited.family.headInsuree.id !== edited.id && (
                        <Grid size={3}>
                          <PublishedComponent
                            pubRef="insuree.RelationPicker"
                            withNull={true}
                            nullLabel={formatMessage(this.props.intl, "insuree", `Relation.none`)}
                            readOnly={readOnly}
                            value={!!edited && !!edited.relationship ? edited.relationship.id : ""}
                            onChange={(v) => this.updateAttribute("relationship", { id: v })}
                            inputProps={{ "data-cy": "insuree-relationship" }}
                          />
                        </Grid>
                      )}
                    {!!actions &&
                      actions.map((a, idx) => {
                        return (
                          <Grid key={`form-action-${idx}`} className="paperHeaderAction">
                            {withTooltip(a.button, a.tooltip)}
                          </Grid>
                        );
                      })}
                  </Grid>
                </Grid>
              </Grid>
              <Divider />
              <Grid container className="item">
                <Grid size={4} className="item">
                  <PublishedComponent
                    pubRef="insuree.InsureeNumberInput"
                    module="insuree"
                    label="Insuree.chfId"
                    required={true}
                    readOnly={readOnly}
                    value={edited?.chfId || ""}
                    editedId={editedId}
                    onChange={(v) => this.updateAttribute("chfId", v)}
                    inputProps={{ "data-cy": "insuree-chf-id" }}
                  />
                </Grid>
                {this.renderLastNameFirst ? (
                  <>
                    {this.renderLastNameField(edited, readOnly)}
                    {this.renderGivenNameField(edited, readOnly)}
                  </>
                ) : (
                  <>
                    {this.renderGivenNameField(edited, readOnly)}
                    {this.renderLastNameField(edited, readOnly)}
                  </>
                )}
                <Grid size={8}>
                  <Grid container>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="core.DatePicker"
                        value={!!edited ? edited.dob : null}
                        module="insuree"
                        label="Insuree.dob"
                        readOnly={readOnly}
                        required={true}
                        maxDate={new Date()}
                        onChange={(v) => this.updateAttribute("dob", v)}
                        data-cy="insuree-dob"
                      />
                    </Grid>
                    <Grid size={4} className="item">
                      <PublishedComponent
                        pubRef="insuree.InsureeGenderPicker"
                        value={!!edited && !!edited.gender ? edited.gender.code : ""}
                        module="insuree"
                        readOnly={readOnly}
                        withNull={false}
                        required={true}
                        onChange={(v) => this.updateAttribute("gender", { code: v })}
                        inputProps={{ "data-cy": "insuree-gender" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="insuree.InsureeMaritalStatusPicker"
                        value={!!edited && !!edited.marital ? edited.marital : ""}
                        module="insuree"
                        readOnly={readOnly}
                        withNull={false}
                        onChange={(v) => this.updateAttribute("marital", v)}
                        inputProps={{ "data-cy": "insuree-marital-status" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <FormControlLabel
                        control={
                          <Checkbox
                            color="primary"
                            checked={!!edited && !!edited.cardIssued}
                            disabled={readOnly}
                            onChange={(v) => this.updateAttribute("cardIssued", !edited || !edited.cardIssued)}
                            inputProps={{ "data-cy": "insuree-card-issued" }}
                          />
                        }
                        label={formatMessage(intl, "insuree", "Insuree.cardIssued")}
                      />
                    </Grid>
                    <Grid size={12}>
                      <PublishedComponent
                        pubRef="insuree.InsureeAddress"
                        value={edited}
                        module="insuree"
                        readOnly={readOnly}
                        onChangeLocation={(v) => this.updateAttribute("currentVillage", v)}
                        onChangeAddress={(v) => this.updateAttribute("currentAddress", v)}
                        inputProps={{ "data-cy": "insuree-address" }}
                      />
                    </Grid>
                    <Grid size={6} className="item">
                      <TextInput
                        module="insuree"
                        label="Insuree.phone"
                        readOnly={readOnly}
                        value={!!edited && !!edited.phone ? edited.phone : ""}
                        onChange={(v) => this.updateAttribute("phone", v)}
                        inputProps={{ "data-cy": "insuree-phone" }}
                      />
                    </Grid>
                    <Grid size={6} className="item">
                      <TextInput
                        module="insuree"
                        label="Insuree.email"
                        readOnly={readOnly}
                        value={!!edited && !!edited.email ? edited.email : ""}
                        onChange={(v) => this.updateAttribute("email", v)}
                        inputProps={{ "data-cy": "insuree-email" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="insuree.ProfessionPicker"
                        module="insuree"
                        value={!!edited && !!edited.profession ? edited.profession.id : null}
                        readOnly={readOnly}
                        withNull={false}
                        onChange={(v) => this.updateAttribute("profession", { id: v })}
                        inputProps={{ "data-cy": "insuree-profession" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="insuree.EducationPicker"
                        module="insuree"
                        value={!!edited && !!edited.education ? edited.education.id : ""}
                        readOnly={readOnly}
                        withNull={false}
                        onChange={(v) => this.updateAttribute("education", { id: v })}
                        inputProps={{ "data-cy": "insuree-education" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="insuree.IdentificationTypePicker"
                        module="insuree"
                        value={!!edited && !!edited.typeOfId ? edited.typeOfId.code : null}
                        readOnly={readOnly}
                        withNull={false}
                        onChange={(v) => this.updateAttribute("typeOfId", { code: v })}
                        inputProps={{ "data-cy": "insuree-type-of-id" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <TextInput
                        module="insuree"
                        label="Insuree.passport"
                        readOnly={readOnly}
                        value={!!edited && !!edited.passport ? edited.passport : ""}
                        onChange={(v) => this.updateAttribute("passport", !!v ? v : null)}
                        inputProps={{ "data-cy": "insuree-passport" }}
                      />
                    </Grid>
                    <Grid size={3} className="item">
                      <PublishedComponent
                        pubRef="insuree.InsureeStatusPicker"
                        label="Insuree.status"
                        value={edited?.status}
                        withNull={false}
                        module="insuree"
                        readOnly={!edited?.uuid || readOnly}
                        onChange={(v) => this.updateAttributes({ "status": v, "statusReason": null })}
                        required={this.isInsureeStatusRequired}
                        inputProps={{ "data-cy": "insuree-status" }}
                      />
                    </Grid>
                    {!!edited?.status && edited?.status !== INSUREE_ACTIVE_STRING && (
                      <Grid size={3} className="item">
                        <PublishedComponent
                          pubRef="core.DatePicker"
                          label="Insuree.statusDate"
                          value={edited?.statusDate}
                          module="insuree"
                          readOnly={readOnly}
                          required={true}
                          onChange={(v) => this.updateAttribute("statusDate", v)}
                          inputProps={{ "data-cy": "insuree-status-date" }}
                        />
                      </Grid>
                    )}
                    {!!edited?.status && edited?.status !== INSUREE_ACTIVE_STRING && (
                      <Grid size={3} className="item">
                        <PublishedComponent
                          pubRef="insuree.InsureeStatusReasonPicker"
                          label="Insuree.statusReason"
                          value={edited?.statusReason}
                          module="insuree"
                          readOnly={readOnly}
                          withNull={false}
                          statusType={edited.status}
                          required={true}
                          onChange={(v) => this.updateAttribute("statusReason", v)}
                          inputProps={{ "data-cy": "insuree-status-reason" }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
                <Grid size={4} className="item">
                  <PublishedComponent
                    pubRef="insuree.Avatar"
                    photo={!!edited ? edited.photo : null}
                    readOnly={readOnly}
                    withMeta={true}
                    onChange={(v) => this.updateAttribute("photo", !!v ? v : null)}
                    inputProps={{ "data-cy": "insuree-photo" }}
                  />
                </Grid>
                <Contributions
                  {...this.props}
                  updateAttribute={this.updateAttribute}
                  contributionKey={INSUREE_INSUREE_CONTRIBUTION_KEY}
                />
              </Grid>
            </Paper>
            <Contributions
              {...this.props}
              updateAttribute={this.updateAttribute}
              contributionKey={INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY}
            />
          </Grid>
        </Grid>
      </StyledInsureeMasterPanel>
    );
  }
}

export { StyledInsureeMasterPanel };
export default withModulesManager(InsureeMasterPanel);
