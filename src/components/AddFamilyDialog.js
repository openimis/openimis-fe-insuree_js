import React, { useEffect, Fragment, useRef, useState } from "react";
import { injectIntl } from "react-intl";

import { makeStyles } from "@material-ui/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchInsuree } from "../actions";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  formatMessage,
  formatMessageWithValues,
  Contributions,
  Error,
  ProgressOrError,
  withModulesManager,
  withHistory,
} from "@openimis/fe-core";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";
import FamilyForm from "./FamilyForm";
import { createFamily, updateFamily, clearInsuree } from "../actions";
import { RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_FAMILY_EDIT } from "../constants";
import { familyLabel } from "../utils/utils";

import { Dialog, Button, DialogActions, DialogContent } from "@material-ui/core";
import SubFamilyForm from "./SubFamilyForm";

const styles = theme => ({
  primaryButton: theme.dialog.primaryButton,
  secondaryButton: theme.dialog.secondaryButton,
})

const AddFamilyDialog = (props) => {
    const { intl, modulesManager, fetchInsuree, classes, fetching, fetched, edited, error, onClose, open, chfid, match,createFamily, updateFamily , rights} = props;
    const [addpressed , setAddPressed]= useState(false) 
    // const prevMatchUrl = useRef(null);
  
    // useEffect(() => {
    //   if (open && insuree?.id !== chfid) {
    //     fetchInsuree(modulesManager, chfid);
    //   }
  
    //   if (!!match?.url && match.url !== prevMatchUrl.current) {
    //     onClose();
    //   }
  
    //   if (!!match?.url) {
    //     prevMatchUrl.current = match.url;
    //   }
  
    // }, [open, chfid, match?.url]);
    
    const  save = (family) => {
        if (!family.uuid) {
         createFamily(
           modulesManager,
            family,
            formatMessageWithValues(intl, "insuree", "CreateFamily.mutationLabel", {
              label: familyLabel(family),
            }),
          );
        } else {
          updateFamily(
           modulesManager,
            family,
            formatMessageWithValues(intl, "insuree", "UpdateFamily.mutationLabel", {
              label: familyLabel(family),
            }),
          );
        }
      };
    //   componentWillUnmount = () => {
    //     clearInsuree();
    //   };
    const handleAddPressed =()=>{
      setAddPressed(true);
      console.log("pressed ", addpressed)
    } 
    const callBackPressed =()=>{
      setAddPressed(false)
      console.log('pressed 3 ', addpressed)
      onClose();
    }
    if (!rights.includes(RIGHT_FAMILY)) return null;
  
    return (
      <Dialog maxWidth="xl" fullWidth open={open} onClose={onClose}>
        <DialogContent>

            <Fragment>
              <SubFamilyForm modulesManager={modulesManager}
                canShowSubfamily={true}
                addpressed={addpressed}
                callBackPressed={callBackPressed}
                back={(e) => historyPush(modulesManager, history, "insuree.route.families")}
                // add={rights.includes(RIGHT_FAMILY_ADD) ? add : null}
                // save={rights.includes(RIGHT_FAMILY_EDIT) ? save : null}
                readOnly={!rights.includes(RIGHT_FAMILY_EDIT) || !rights.includes(RIGHT_FAMILY_ADD)} />
            </Fragment>
        
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {formatMessage(intl, "insuree", "close")}

          </Button>
          <Button
           autoFocus
           onClick={()=>{
            handleAddPressed()
          }}
          className={classes.primaryButton} 
          >
            {formatMessage(intl, "insuree", "add")}
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
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    
  });
  
  const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchInsuree, createFamily, updateFamily, clearInsuree }, dispatch);
  export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(AddFamilyDialog))))));
  