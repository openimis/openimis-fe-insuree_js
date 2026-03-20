import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, FormattedMessage, formatMessage } from "@openimis/fe-core";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@material-ui/core";
import { familyLabel } from "../utils/utils";

const styles = (theme) => ({
  primaryButton: theme.dialog.primaryButton,
  secondaryButton: theme.dialog.secondaryButton,
  searchField: {
    marginBottom: theme.spacing(2),
  },
  list: {
    maxHeight: 260,
    overflow: "auto",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: "rgba(25, 118, 210, 0.08)",
  },
});

class LinkSubFamilyDialog extends Component {
  constructor(props) {
    super(props);
    this.canCancel = props.modulesManager.getConf("fe-insuree", "canCancelPoliciesOnChangeInsureeFamily", true);
    this.canKeep = props.modulesManager.getConf("fe-insuree", "canKeepPoliciesOnChangeInsureeFamily", true);
  }

  render() {
    const {
      classes,
      intl,
      open,
      onCancel,
      onConfirm,
      onSearch,
      candidates,
      selectedFamily,
      onSelectFamily,
      searchValue,
      onSearchValueChange,
    } = this.props;
    return (
      <Dialog open={!!open} onClose={onCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          <FormattedMessage module="insuree" id="LinkSubFamilyDialog.title" />
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <FormattedMessage module="insuree" id="LinkSubFamilyDialog.message" />
          </DialogContentText>
          <TextField
            fullWidth
            className={classes.searchField}
            label={formatMessage(intl, "insuree", "LinkSubFamilyDialog.searchLabel")}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch(searchValue)}
          />
          <Button onClick={() => onSearch(searchValue)} className={classes.secondaryButton}>
            <FormattedMessage module="insuree" id="LinkSubFamilyDialog.searchButton" />
          </Button>
          <List className={classes.list}>
            {(candidates || []).map((family) => (
              <ListItem
                key={family.uuid}
                button
                divider
                selected={selectedFamily?.uuid === family.uuid}
                classes={{ selected: classes.selectedItem }}
                onClick={() => onSelectFamily(family)}
              >
                <ListItemText
                  primary={familyLabel(family)}
                  secondary={family?.headInsuree?.chfId || family?.uuid}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          {!!this.canCancel && (
            <Button
              onClick={(e) => onConfirm(true)}
              className={classes.primaryButton}
              autoFocus
              disabled={!selectedFamily}
            >
              <FormattedMessage module="insuree" id="changeInsureeFamilyDialog.cancelPolicies.button" />
            </Button>
          )}
          {!!this.canKeep && (
            <Button onClick={(e) => onConfirm(false)} className={classes.secondaryButton} disabled={!selectedFamily}>
              <FormattedMessage module="insuree" id="changeInsureeFamilyDialog.keepPolicies.button" />
            </Button>
          )}
          <Button onClick={onCancel} className={classes.secondaryButton}>
            <FormattedMessage module="core" id="cancel" />
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(LinkSubFamilyDialog))));
