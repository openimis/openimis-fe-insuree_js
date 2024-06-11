import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  parseData,
  Helmet,
} from "@openimis/fe-core";
import { RIGHT_FAMILY, RIGHT_FAMILY_EDIT } from "../constants";
import FamilyMasterPanel from "./FamilyMasterPanel";

import { fetchFamily, newFamily, createFamily, fetchFamilyMutation, fetchSubFamily } from "../actions";

import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";

import { insureeLabel, isValidInsuree } from "../utils/utils";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY = "insuree.FamilyOverview.mutations";

class SubFamilyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    subFamily: this._newFamily(),
    newFamily: true,
    confirmedAction: null,
    addpressed: false,
    runningMutation: false,
  };

  _newFamily() {
    let subFamily = {};
    subFamily.parentFamily = this.props.family && this.props.family.id ? this.props.family.id : "";
    subFamily.jsonExt = {};
    subFamily.issubFamily = true;
    return subFamily;
  }

  componentDidMount() {
    if (this.props.subFamily_uuid) {
      this.setState(
        (state, props) => ({ subFamily_uuid: props.subFamily_uuid }),
        (e) => this.props.fetchSubFamily(this.props.modulesManager, this.props.subFamily_uuid),
      );
      if (this.props.family_uuid) {
        this.setState(
          (state, props) => ({ family_uuid: props.family_uuid }),
          (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
        );
      }
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.fetchedSubFamily && !!this.props.fetchedSubFamily) {
      var subFamily = this.props.subFamily;
      if (subFamily) {
        subFamily.ext = !!subFamily.jsonExt ? JSON.parse(subFamily.jsonExt) : {};
        this.setState({ subFamily, subFamily_uuid: subFamily.uuid, lockNew: false, newFamily: false });
      }
    } else if (prevProps.subFamily_uuid && !this.props.subFamily_uuid) {
      this.setState({ subFamily: this._newFamily(), newFamily: true, lockNew: false, subFamily_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        subFamily: { ...state.subFamily, clientMutationId: props.mutation.clientMutationId },
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  _add = () => {
    this.setState(
      (state) => ({
        subFamily: this._newFamily(),
        newFamily: true,
        lockNew: false,
        reset: state.reset + 1,
      }),
      (e) => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  reload = () => {
    const { subFamily } = this.state;
    const { clientMutationId, subFamilyUuid } = this.props.mutation;
    if (clientMutationId && !subFamilyUuid) {
      // creation, we need to fetch the new family uuid from mutations logs and redirect to family overview
      this.props.fetchFamilyMutation(this.props.modulesManager, clientMutationId).then((res) => {
        const mutationLogs = parseData(res.payload.data.mutationLogs);
        if (
          mutationLogs &&
          mutationLogs[0] &&
          mutationLogs[0].families &&
          mutationLogs[0].families[0] &&
          mutationLogs[0].families[0].family
        ) {
          const uuid = parseData(res.payload.data.mutationLogs)[0].families[0].family.uuid;
          if (uuid) {
            historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [uuid]);
          }
        }
      });
    } else {
      this.props.fetchFamily(
        this.props.modulesManager,
        subFamilyUuid,
        !!subFamily.headInsuree ? subFamily.headInsuree.chfId : null,
        subFamily.clientMutationId,
      );
    }
  };

  canSave = () => {
    if (!this.state.subFamily.location) return false;
    // if (!this.state.subFamilie.uuid && !this.props.isChfIdValid) return false;
    if (this.state.subFamily.validityTo) return false;

    return (
      this.state.subFamily.headInsuree && isValidInsuree(this.state.subFamily.headInsuree, this.props.modulesManager)
    );
  };

  _save = (subFamily) => {
    subFamily.parentFamily = this.props.family && this.props.family.id ? this.props.family.id : "";
    this.setState({ lockNew: !subFamily.uuid, runningMutation: true }, (e) => this.props.save(subFamily));
  };

  onEditedChanged = (subFamily) => {
    this.setState({ subFamily, newFamily: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  render() {
    const {
      modulesManager,
      classes,
      state,
      rights,
      subFamily_uuid,
      fetchingSubFamily,
      fetchedSubFamily,
      errorSubFamily,
      insuree,
      overview = false,
      openFamilyButton,
      readOnly = false,
      add,
      save,
      back,
    } = this.props;
    const { subFamily, newFamily } = this.state;
    if (!rights.includes(RIGHT_FAMILY)) return null;
    let runningMutation = this.state.runningMutation == true;
    let actions = [];
    if (subFamily_uuid || !!subFamily.clientMutationId) {
      actions.push({
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation,
      });
    }
    const shouldBeLocked = this.state.runningMutation == true;
    return (
      <div className={shouldBeLocked ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "insuree",
            !!this.props.overview ? "FamilyOverview.title" : "Family.title",
            { label: insureeLabel(this.state.subFamily.headInsuree) },
          )}
        />
        <ProgressOrError progress={fetchingSubFamily} error={errorSubFamily} />
        {((!!fetchedSubFamily && !!subFamily && subFamily.uuid === subFamily_uuid) || !subFamily_uuid) && (
          <Form
            module="insuree"
            title="FamilyOverview.title"
            titleParams={{ label: insureeLabel(this.state.subFamily.headInsuree) }}
            edited_id={subFamily_uuid}
            edited={subFamily}
            reset={this.state.reset}
            back={back}
            add={!!add && !newFamily ? this._add : null}
            readOnly={readOnly || this.state.runningMutation || !!subFamily.validityTo}
            actions={actions}
            overview={overview}
            HeadPanel={FamilyMasterPanel}
            Panels={[HeadInsureeMasterPanel]}
            contributedPanelsKey={
              overview ? INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY : INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY
            }
            subFamily={subFamily}
            insuree={insuree}
            onEditedChanged={this.onEditedChanged}
            canSave={this.canSave}
            save={!!save ? this._save : null}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingSubFamily: state.insuree.fetchingSubFamily,
  errorSubFamily: state.insuree.errorSubFamily,
  fetchedSubFamily: state.insuree.fetchedSubFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  subFamily: state.insuree.subFamily,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchSubFamily, fetchFamilyMutation, fetchFamily, newFamily, createFamily, journalize, coreConfirm },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(SubFamilyForm)))),
  ),
);
