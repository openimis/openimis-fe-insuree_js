import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { withModulesManager } from "@openimis/fe-core";

const StyledChangeInsureeFamilyDialog = styled('div')(({ theme }) => ({
  '& .primaryButton': theme.dialog.primaryButton,
  '& .secondaryButton': theme.dialog.secondaryButton,
}));

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import { FormattedMessage } from "@openimis/fe-core";

import { familyLabel, insureeLabel } from "../utils/utils";

class ChangeInsureeFamilyDialog extends Component {
  constructor(props) {
    super(props);
    this.canCancel = props.modulesManager.getConf("fe-insuree", "canCancelPoliciesOnChangeInsureeFamily", true);
    this.canKeep = props.modulesManager.getConf("fe-insuree", "canKeepPoliciesOnChangeInsureeFamily", true);
  }

  render() {
    const { family, insuree, onCancel, onConfirm } = this.props;
    return (
      <StyledChangeInsureeFamilyDialog>
        <Dialog open={!!insuree} onClose={onCancel}>
          <DialogTitle>
            <FormattedMessage
              module="insuree"
              id="changeInsureeFamilyDialog.title"
              values={{ insuree: insureeLabel(insuree), family: familyLabel(family) }}
            />
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <FormattedMessage
                module="insuree"
                id="changeInsureeFamilyDialog.message"
                values={{ insuree: insureeLabel(insuree), family: familyLabel(family) }}
              />
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            {!!this.canCancel && (
              <Button onClick={(e) => onConfirm(true)} className="primaryButton" autoFocus>
                <FormattedMessage module="insuree" id="changeInsureeFamilyDialog.cancelPolicies.button" />
              </Button>
            )}
            {!!this.canKeep && (
              <Button onClick={(e) => onConfirm(false)} className="secondaryButton">
                <FormattedMessage module="insuree" id="changeInsureeFamilyDialog.keepPolicies.button" />
              </Button>
            )}
            <Button onClick={onCancel} className="secondaryButton">
              <FormattedMessage module="core" id="cancel" />
            </Button>
          </DialogActions>
        </Dialog>
      </StyledChangeInsureeFamilyDialog>
    );
  }
}

export { StyledChangeInsureeFamilyDialog };
export default withModulesManager(injectIntl(ChangeInsureeFamilyDialog));
