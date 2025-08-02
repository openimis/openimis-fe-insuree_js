import React, { useEffect, Fragment, useRef } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { Dialog, Button, DialogActions, DialogContent } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  formatMessage,
  formatMessageWithValues,
  Contributions,
  Error,
  ProgressOrError,
  withModulesManager,
  withHistory,
} from "@openimis/fe-core";
import { fetchInsureeEnquiry, clearInsureeEnquiry } from "../actions";
import InsureeSummary from "./InsureeSummary";

const StyledEnquiryDialog = styled('div')(({ theme }) => ({
  '& .summary': {
    marginBottom: 32,
  },
}));

const EnquiryDialog = ({
  intl,
  modulesManager,
  fetchInsureeEnquiry,
  clearInsureeEnquiry,
  fetching,
  fetched,
  insuree,
  error,
  onClose,
  open,
  chfid,
  match,
}) => {
  const prevMatchUrl = useRef(null);

  const handleClose = () => {
    clearInsureeEnquiry();
    onClose();
  };

  useEffect(() => {
    if (open && insuree?.id !== chfid) {
      fetchInsureeEnquiry(modulesManager, chfid);
    }

    if (!!match?.url && match.url !== prevMatchUrl.current) {
      clearInsureeEnquiry();
      onClose();
    }

    if (!!match?.url) {
      prevMatchUrl.current = match.url;
    }
  }, [open, chfid, match?.url]);

  return (
    <StyledEnquiryDialog>
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
              <InsureeSummary modulesManager={modulesManager} insuree={insuree} className="summary" />
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
          <Button onClick={handleClose} color="primary">
            {formatMessage(intl, "insuree", "close")}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledEnquiryDialog>
  );
};

const mapStateToProps = (state) => ({
  fetching: state.insuree?.fetchingInsureeEnquiry,
  fetched: state.insuree?.fetchedInsureeEnquiry,
  insuree: state.insuree?.insureeEnquiry,
  error: state.insuree?.errorInsureeEnquiry,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchInsureeEnquiry, clearInsureeEnquiry }, dispatch);
export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(EnquiryDialog))));
