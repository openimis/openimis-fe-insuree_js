import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";

const StyledDeleteFamilyDialog = styled('div')(({ theme }) => ({
  '& .primaryButton': theme?.dialog?.primaryButton ?? {},
  '& .secondaryButton': theme?.dialog?.secondaryButton ?? {},
}));

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import { FormattedMessage } from "@openimis/fe-core";

import { familyLabel } from "../utils/utils";

class DeleteFamilyDialog extends Component {
  render() {
    const { family, onCancel, onConfirm } = this.props;
    return (
      <StyledDeleteFamilyDialog>
        <Dialog open={!!family} onClose={onCancel}>
          <DialogTitle>
            <FormattedMessage module="insuree" id="deleteFamilyDialog.title" values={{ label: familyLabel(family) }} />
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <FormattedMessage
                module="insuree"
                id="deleteFamilyDialog.message"
                values={{ label: familyLabel(family) }}
              />
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={(e) => onConfirm(true)} className="primaryButton" autoFocus>
              <FormattedMessage module="insuree" id="deleteFamilyDialog.deleteFamilyAndInsurres.button" />
            </Button>
            <Button onClick={(e) => onConfirm(false)} className="secondaryButton">
              <FormattedMessage module="insuree" id="deleteFamilyDialog.deleteFamilyOnly.button" />
            </Button>
            <Button onClick={onCancel} className="secondaryButton">
              <FormattedMessage module="core" id="cancel" />
            </Button>
          </DialogActions>
        </Dialog>
      </StyledDeleteFamilyDialog>
    );
  }
}

export { StyledDeleteFamilyDialog };
export default injectIntl(DeleteFamilyDialog);
