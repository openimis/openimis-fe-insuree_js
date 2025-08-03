import React, { Component } from "react";
import { styled } from "@mui/material/styles";
import { FormControl, TextField } from "@mui/material";
import { injectIntl } from "react-intl";
import { familyLabel } from "../utils/utils";
import _ from "lodash";

const StyledFamilyPicker = styled('div')(({ theme }) => ({
  '& .label': {
    color: theme.palette.primary.main,
  },
  '& .item': {
    padding: theme.spacing(1),
  },
}));

class FamilyPicker extends Component {
  render() {
    const { intl, module, withLabel = true, label, value } = this.props;
    return (
      <StyledFamilyPicker>
        <FormControl fullWidth>
          <TextField
            disabled={true}
            label={!!withLabel && !!label && formatMessage(intl, module, label)}
            value={familyLabel(value)}
          />
        </FormControl>
      </StyledFamilyPicker>
    );
  }
}

export default injectIntl(FamilyPicker);
