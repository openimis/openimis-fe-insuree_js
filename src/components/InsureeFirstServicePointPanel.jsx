import React from "react";

import { Paper, Grid, Typography, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";

import { FormattedMessage, PublishedComponent, FormPanel } from "@openimis/fe-core";

const StyledInsureeFirstServicePointPanel = styled('div')(({ theme }) => ({
  '& .paper': theme.paper.paper,
  '& .title': theme.paper.title,
  '& .item': theme.paper.item,
}));

class InsureeFirstServicePointPanel extends FormPanel {
  render() {
    const { updateAttribute, readOnly, edited } = this.props;
    let isInsureeFirstServicePointRequired = this.props.modulesManager.getConf("fe-insuree", "insureeForm.isInsureeFirstServicePointRequired", false);
    return (
      <StyledInsureeFirstServicePointPanel>
        <Grid container>
          <Grid size={12}>
            <Paper className="paper">
              <Typography className="title">
                <FormattedMessage module="insuree" id="insuree.InsureeFirstServicePointPanel.title" />
              </Typography>
              <Divider />
              <Grid container size={12} className="item">
                {readOnly && !edited.healthFacility ? (
                  <FormattedMessage module="insuree" id="insuree.noFSP" />
                ) : (
                  <PublishedComponent
                    pubRef="location.DetailedHealthFacility"
                    value={edited?.healthFacility ?? null}
                    readOnly={readOnly}
                    required={isInsureeFirstServicePointRequired}
                    onChange={(hf) => updateAttribute("healthFacility", hf)}
                    ignoreLocation={true}
                  />
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </StyledInsureeFirstServicePointPanel>
    );
  }
}

export default InsureeFirstServicePointPanel;
