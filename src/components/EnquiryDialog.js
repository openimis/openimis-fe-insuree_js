import React, { useEffect, Fragment, useRef } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { Dialog, Button, DialogActions, DialogContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  formatMessage,
  formatMessageWithValues,
  Contributions,
  Error,
  ProgressOrError,
  withModulesManager,
  withHistory,
} from "@openimis/fe-core";
import { fetchInsuree } from "../actions";
import InsureeSummary from "./InsureeSummary";

const useStyles = makeStyles(() => ({
  summary: {
    marginBottom: 32,
  },
}));

const EnquiryDialog = ({
  intl,
  modulesManager,
  fetchInsuree,
  fetching,
  fetched,
  insuree,
  error,
  onClose,
  open,
  chfid,
  match,
}) => {
  const classes = useStyles();
  const prevMatchUrl = useRef(null);

  useEffect(() => {
    if (open && insuree?.id !== chfid) {
      fetchInsuree(modulesManager, chfid);
    }

    if (!!match?.url && match.url !== prevMatchUrl.current) {
      onClose();
    }

    if (!!match?.url) {
      prevMatchUrl.current = match.url;
    }
  }, [open, chfid, match?.url]);

  return (
    <Dialog maxWidth="xl" fullWidth open={open} onClose={onClose}>
      <DialogContent>
        <ProgressOrError progress={fetching} error={error} />
        {!!fetched && !insuree && (
          <Error
            error={{
              code: formatMessage(intl, "insuree", "notFound"),
              detail: formatMessageWithValues(intl, "insuree", "chfIdNotFound", { chfid }),
            }}
          />
        )}
        {!fetching && insuree && (
          <Fragment>
            <InsureeSummary modulesManager={modulesManager} insuree={insuree} className={classes.summary} />
            <Contributions
              contributionKey="insuree.EnquiryDialog"
              insuree={insuree}
              disableSelection
              hideAddPolicyButton
            />
          </Fragment>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {formatMessage(intl, "insuree", "close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapStateToProps = (state) => ({
  fetching: state.insuree.fetchingInsuree,
  fetched: state.insuree.fetchedInsuree,
  insuree: state.insuree.insuree,
  error: state.insuree.errorInsuree,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchInsuree }, dispatch);
export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(EnquiryDialog))));
