import React from "react";

import { Paper, Grid, Typography, Divider } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  withModulesManager,
  createFieldsBasedOnJSON,
  renderInputComponent,
} from "@openimis/fe-core";
import { MODULE_NAME } from "../../constants";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});

class WorkerMasterPanel extends FormPanel {
  render() {
    const {
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      editedId,
    } = this.props;

    const createdFields = createFieldsBasedOnJSON(edited?.jsonExt, "additional_fields");

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
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent pubRef="insuree.Avatar" photo={edited?.photo ?? null} readOnly withMeta={false} />
              </Grid>
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.InsureeNumberInput"
                  module="insuree"
                  label="Insuree.nationalId"
                  required={true}
                  readOnly={readOnly}
                  value={edited?.chfId ?? ""}
                  editedId={editedId}
                  onChange={(v) => this.updateAttribute("chfId", v)}
                />
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.lastName"
                  required={true}
                  readOnly={readOnly}
                  value={edited?.lastName ?? ""}
                  onChange={(v) => this.updateAttribute("lastName", v)}
                />
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.otherNames"
                  required={true}
                  readOnly={readOnly}
                  value={edited?.otherNames ?? ""}
                  onChange={(v) => this.updateAttribute("otherNames", v)}
                />
              </Grid>
              {createdFields.map((field, index) => (
                <Grid item xs={4} className={classes.item} key={index}>
                  {renderInputComponent(MODULE_NAME, field, true)}
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(WorkerMasterPanel)));
