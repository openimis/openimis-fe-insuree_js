import React, { Component, Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider, Checkbox, FormGroup, FormControlLabel, Switch } from "@material-ui/core";
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

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});

const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";

class InsureeMasterPanel extends FormPanel {

  state = {
    age: "",
  };

  _updateAge = (dob) => {
    var age;
    var date = new Date(dob);
    var month_diff = Date.now() - date.getTime();
    var age_dt = new Date(month_diff);
    var year = age_dt.getUTCFullYear();
    age = Math.abs(year - 1970);

    if (age < 13) {
      alert(formatMessage(this.props.intl, "insuree", "minorBeneficiary"));
    } else if (age > 50) {
      alert(formatMessage(this.props.intl, "insuree", "menopausalBeneficiary"));
    }

    this.setState({ age: age });
  }

  render() {
    const {
      intl,
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      actions,
    } = this.props;
    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={3} container alignItems="center" className={classes.item}>
                <Typography variant="h5">
                  <FormattedMessage module="insuree" id={title} values={titleParams} />
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container justify="flex-end">
                  {!!edited &&
                    !!edited.family &&
                    !!edited.family.headInsuree &&
                    edited.family.headInsuree.id !== edited.id && (
                      <Grid item xs={3}>
                        <PublishedComponent
                          pubRef="insuree.RelationPicker"
                          withNull={true}
                          nullLabel={formatMessage(this.props.intl, "insuree", `Relation.none`)}
                          readOnly={readOnly}
                          value={!!edited && !!edited.relationship ? edited.relationship.id : ""}
                          onChange={(v) => this.updateAttribute("relationship", { id: v })}
                        />
                      </Grid>
                    )}
                  {!!actions &&
                    actions.map((a, idx) => {
                      return (
                        <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                          {withTooltip(a.button, a.tooltip)}
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.InsureeNumberInput"
                  module="insuree"
                  label="Insuree.chfId"
                  required={true}
                  readOnly={readOnly}
                  value={edited?.chfId}
                  new_insuree={!edited?.id}
                  onChange={(v) => this.updateAttribute("chfId", v)}
                />
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.lastName"
                  required={true}
                  readOnly={readOnly}
                  value={!!edited && !!edited.lastName ? edited.lastName : ""}
                  onChange={(v) => this.updateAttribute("lastName", v)}
                />
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.otherNames"
                  required={true}
                  readOnly={readOnly}
                  value={!!edited && !!edited.otherNames ? edited.otherNames : ""}
                  onChange={(v) => this.updateAttribute("otherNames", v)}
                />
              </Grid>
              <Grid item xs={8}>
                <Grid container>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={!!edited ? edited.dob : null}
                      module="insuree"
                      label="Insuree.dob"
                      readOnly={readOnly}
                      required={true}
                      onChange={(v) => {
                        this.updateAttribute("dob", v);
                        this._updateAge(v);
                      }
                      }
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Age"
                      readOnly={true}
                      value={this.state.age}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeGenderPicker"
                      value={!!edited && !!edited.gender ? edited.gender.code : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={true}
                      required={true}
                      onChange={(v) => this.updateAttribute("gender", { code: v })}
                    />
                  </Grid>
                  {!edited?.relationship?.id && <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeMaritalStatusPicker"
                      value={!!edited && !!edited.marital ? edited.marital : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={true}
                      nullLabel="InsureeMaritalStatus.N"
                      onChange={(v) => this.updateAttribute("marital", v)}
                    />
                  </Grid>}
                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.phone"
                      readOnly={readOnly}
                      value={!!edited && !!edited.phone ? edited.phone : ""}
                      onChange={(v) => this.updateAttribute("phone", v)}
                    />
                  </Grid>
                  {!edited?.relationship?.id && <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.ProfessionPicker"
                      module="insuree"
                      value={!!edited && !!edited.profession ? edited.profession.id : null}
                      readOnly={readOnly}
                      withNull={true}
                      nullLabel={formatMessage(intl, "insuree", "Profession.none")}
                      onChange={(v) => this.updateAttribute("profession", { id: v })}
                    />
                  </Grid>
                  }
                  {!edited?.relationship?.id && <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.IdentificationTypePicker"
                      module="insuree"
                      value={!!edited && !!edited.typeOfId ? edited.typeOfId.code : null}
                      readOnly={readOnly}
                      withNull={false}
                      required={true}
                      nullLabel={formatMessage(intl, "insuree", "IdentificationType.none")}
                      onChange={(v) => this.updateAttribute("typeOfId", { code: v })}
                    />
                  </Grid>}
                  {!edited?.relationship?.id && <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.passport"
                      readOnly={readOnly}
                      required={true}
                      value={!!edited && !!edited.passport ? edited.passport : ""}
                      onChange={(v) => this.updateAttribute("passport", !!v ? v : null)}
                    />
                  </Grid>}
                </Grid>
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.Avatar"
                  photo={!!edited ? edited.photo : null}
                  readOnly={readOnly}
                  withMeta={true}
                  onChange={(v) => this.updateAttribute("photo", !!v ? v : null)}
                />
              </Grid>
              <Grid item xs={2} className={classes.item}>
                <FormControlLabel
                  module="insuree"
                  control={<Switch
                    checked={!!edited ? edited.dead : false}
                    module="insuree"
                    readOnly={readOnly}
                    onChange={(e, c) => this.updateAttribute("dead", c)}
                  />}
                  label={formatMessage(this.props.intl, "insuree", `Insuree.dead`)} />
              </Grid>
              {edited?.dead &&
                <Grid item xs={3} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={!!edited ? edited.dod : null}
                    module="insuree"
                    label="Insuree.dod"
                    readOnly={readOnly}
                    onChange={(v) => this.updateAttribute("dod", v)}
                  />
                </Grid>
              }
              {edited?.dead &&
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    module="insuree"
                    label="Insuree.deathreason"
                    readOnly={readOnly}
                    value={!!edited && !!edited.deathReason ? edited.deathReason : ""}
                    onChange={(v) => this.updateAttribute("deathReason", v)}
                  />
                </Grid>
              }
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
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(InsureeMasterPanel)));
