import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { styled } from "@mui/material/styles";
import { withModulesManager, FormattedMessage } from "@openimis/fe-core";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { familyLabel } from "../utils/utils";

const StyledRemoveSubFamilyDialog = styled("div")(({ theme }) => ({
  "& .primaryButton": theme?.dialog?.primaryButton ?? {},
  "& .secondaryButton": theme?.dialog?.secondaryButton ?? {},
}));

class RemoveSubFamilyDialog extends Component {
  constructor(props) {
    super(props);
    this.canCancel = props.modulesManager.getConf("fe-insuree", "canCancelPoliciesOnChangeInsureeFamily", true);
    this.canKeep = props.modulesManager.getConf("fe-insuree", "canKeepPoliciesOnChangeInsureeFamily", true);
  }

  render() {
    const { family, onCancel, onConfirm } = this.props;
    return (
      <StyledRemoveSubFamilyDialog>
        <Dialog open={!!family} onClose={onCancel}>
          <DialogTitle>
            <FormattedMessage module="insuree" id="RemoveSubFamilyDialog.title" values={{ family: familyLabel(family) }} />
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <FormattedMessage module="insuree" id="RemoveSubFamilyDialog.message" values={{ family: familyLabel(family) }} />
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
      </StyledRemoveSubFamilyDialog>
    );
  }
}

export { StyledRemoveSubFamilyDialog };
export default withModulesManager(injectIntl(RemoveSubFamilyDialog));
