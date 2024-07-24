import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

import { Paper, Grid, Typography, Divider } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  NumberInput,
  withModulesManager,
  createFieldsBasedOnJSON,
  renderInputComponent,
  WarningBox,
  formatMessage,
  formatMessageWithValues,
} from "@openimis/fe-core";
import { DEFAULT, MODULE_NAME } from "../../constants";
import { fetchWorkerVoucherCount } from "../../actions";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});

class WorkerMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.state = { workerVoucherCount: 0 };
    this.isWorker = props.modulesManager.getConf("fe-core", "isWorker", DEFAULT.IS_WORKER);
    this.workerVoucherCountLimit = props.modulesManager.getConf(
      "fe-insuree",
      "workerVoucherCountLimit",
      DEFAULT.WORKER_VOUCHER_COUNT_LIMIT,
    );
  }

  componentDidMount() {
    const { fetchWorkerVoucherCount, edited_id: editedId } = this.props;

    if (this.isWorker && editedId) {
      // TODO: OM-227 - Adjust the algorithm here
      fetchWorkerVoucherCount(editedId).then((response) => {
        const workerVoucherCount = response?.payload?.data?.professions?.length ?? 0;
        this.setState((prevState) => ({ ...prevState, workerVoucherCount }));
      });
    }
  }

  render() {
    const {
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      edited_id: editedId,
      intl,
    } = this.props;
    const { workerVoucherCount } = this.state;
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
            {/* TODO: OM-227 - Adjust the condition here */}
            {workerVoucherCount <= this.workerVoucherCountLimit && (
              <>
                <Grid container className={classes.item}>
                  <WarningBox
                    title={formatMessage(intl, MODULE_NAME, "insuree.warning.limit")}
                    description={formatMessageWithValues(intl, MODULE_NAME, "insuree.warning.limitReached", {
                      limit: this.workerVoucherCountLimit,
                    })}
                    xs={12}
                  />
                </Grid>
                <Divider />
              </>
            )}
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
              <Grid item xs={4} className={classes.item}>
                <NumberInput module="insuree" label="Insuree.assignedVouchers" readOnly value={workerVoucherCount} />
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

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchWorkerVoucherCount,
    },
    dispatch,
  );

export default withModulesManager(connect(null, mapDispatchToProps)(withTheme(withStyles(styles)(WorkerMasterPanel))));
