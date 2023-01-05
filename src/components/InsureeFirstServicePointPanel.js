import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider } from "@material-ui/core";
import { FormattedMessage, PublishedComponent, FormPanel } from "@openimis/fe-core";

const styles = (theme) => ({
  paper: theme.paper.paper,
  title: theme.paper.title,
  item: theme.paper.item,
});

class InsureeFirstServicePointPanel extends FormPanel {
  render() {
    const { classes, updateAttribute, readOnly, edited } = this.props;
    const allRegions = true;
    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography className={classes.title}>
              <FormattedMessage module="insuree" id="insuree.InsureeFirstServicePointPanel.title" />
            </Typography>
            <Divider />
            <Grid container item xs={12} className={classes.item}>
              {readOnly && !edited.healthFacility ? (
                <FormattedMessage module="insuree" id="insuree.noFSP" />
              ) : (
                <PublishedComponent
                  pubRef="location.DetailedHealthFacility"
                  value={edited?.healthFacility ?? null}
                  readOnly={readOnly}
                  onChange={(hf) => updateAttribute("healthFacility", hf)}
                  allRegions={allRegions}
                />
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withTheme(withStyles(styles)(InsureeFirstServicePointPanel));
