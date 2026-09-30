import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

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
  hasPermsAnywhere,
  selectUserRights,
} from "@openimis/fe-core";
import { RIGHT_FAMILY, INSUREE_ACTIVE_STRING, RIGHT_FAMILY_EDIT } from "../constants";
import FamilyMasterPanel from "./FamilyMasterPanel";

import { fetchFamily, newFamily, createFamily, fetchFamilyMutation, fetchUserHealthFacilityFullPath } from "../actions";
import FamilyInsureesOverview from "./FamilyInsureesOverview";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";

import { insureeLabel, isValidInsuree, isChfIdOnlyNumbers } from "../utils/utils";
import { rightsOnFamily } from "../utils/rights";
import FamilyVihMasterPanel from "./FamilyVihMasterPanel";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY = "insuree.FamilyOverview.mutations";

class FamilyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    family: this._newFamily(),
    newFamily: true,
    confirmedAction: null,
    isSaved: false,
  };

  _newFamily() {
    let family = {
      jsonExt: {},
      headInsuree: {
        status: INSUREE_ACTIVE_STRING,
      },
    };
    return family;
  }

  componentDidMount() {
    if (this.props.admin.health_facility_id && !this.props.userHealthFacilityFullPath) {
      this.props.fetchUserHealthFacilityFullPath(this.props.modulesManager, this.props.admin.health_facility_id);
    }
    if (this.props.family_uuid) {
      this.setState(
        (state, props) => ({ family_uuid: props.family_uuid }),
        (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
      );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.fetchedFamily && !!this.props.fetchedFamily) {
      var family = this.props.family;
      if (family) {
        family.ext = !!family.jsonExt ? JSON.parse(family.jsonExt) : {};
        this.setState({ family, family_uuid: family.uuid, lockNew: false, newFamily: false });
      }
    } else if (prevProps.family_uuid && !this.props.family_uuid) {
      this.setState({ family: this._newFamily(), newFamily: true, lockNew: false, family_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        family: { ...state.family, clientMutationId: props.mutation.clientMutationId },
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  _add = () => {
    this.setState(
      (state) => ({
        family: this._newFamily(),
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

  reload = async () => {
    const { isSaved } = this.state;
    const { modulesManager, history, mutation, fetchFamilyMutation, family_uuid: familyUuid, fetchFamily } = this.props;

    if (familyUuid) {
      try {
        await fetchFamily(modulesManager, familyUuid);
      } catch (error) {
        console.error(`[RELOAD_FAMILY]: Fetching family details failed. ${error}`);
      }
      return;
    }

    if (isSaved) {
      try {
        const { clientMutationId } = mutation;
        const response = await fetchFamilyMutation(modulesManager, clientMutationId);
        const createdFamilyUuid = parseData(response.payload.data.mutationLogs)[0].families[0].family.uuid;

        await fetchFamily(modulesManager, createdFamilyUuid);
        historyPush(modulesManager, history, "insuree.route.familyOverview", [createdFamilyUuid]);
      } catch (error) {
        console.error(`[RELOAD_FAMILY]: Fetching family details failed. ${error}`);
      }
      return;
    }

    this.setState({
      lockNew: false,
      reset: 0,
      family: this._newFamily(),
      newFamily: true,
      confirmedAction: null,
      isSaved: false,
    });
  };

  canSave = () => {
    if (!this.state.family.location) return false;
    if (!this.state.family.headInsuree) return false;
    if (!this.state.family.headInsuree.chfId) return false;
    if (!this.state.family.headInsuree.dob) return false;
    if (
      !!this.state.family.headInsuree.photo &&
      (!this.state.family.headInsuree.photo.date || !this.state.family.headInsuree.photo.officerId)
    )
      return false;
    if (!this.state.family.headInsuree.gender || !this.state.family.headInsuree.gender?.code) return false;
    if (!!this.state.family.headInsuree.chfId && isChfIdOnlyNumbers(this.state.family.headInsuree.chfId)) return false;
    return true;
  };

  _save = (family) => {
    this.setState({ lockNew: !family.uuid, isSaved: true }, (e) => this.props.save(family));
  };

  onEditedChanged = (family) => {
    this.setState({ family, newFamily: false });
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
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      insuree,
      overview = false,
      openFamilyButton,
      readOnly = false,
      add,
      save,
      back,
    } = this.props;
    const { family, newFamily, isSaved } = this.state;
    // navigation level gate: what may be done on this family is the page's to say
    if (!hasPermsAnywhere(RIGHT_FAMILY, { rights })) return null;
    let runningMutation = !!family && !!family.clientMutationId;
    let contributedMutations = modulesManager.getContribs(INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY);
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    let actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation && !isSaved,
      },
    ];
    const shouldBeLocked = !!runningMutation || family?.validityTo;
    return (
      <div className={shouldBeLocked ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "insuree",
            !!this.props.overview ? "FamilyOverview.title" : "Family.title",
            { label: insureeLabel(this.state.family.headInsuree) },
          )}
        />
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
          <Form
            module="insuree"
            title="FamilyOverview.title"
            titleParams={{ label: insureeLabel(this.state.family.headInsuree) }}
            edited_id={family_uuid}
            edited={family}
            reset={this.state.reset}
            // the global bag, plus the UBA one where an ENROLMENT link covers the family's
            // village: what the panels contributed to the form check their actions against
            rights={rightsOnFamily(family, { rights })}
            back={back}
            add={!!add && !newFamily ? this._add : null}
            readOnly={readOnly || runningMutation || !!family.validityTo}
            actions={actions}
            openFamilyButton={openFamilyButton}
            overview={overview}
            HeadPanel={overview ? family.headInsuree.email == "newhivuser_XM7dw70J0M3N@gmail.com" ? FamilyVihMasterPanel : FamilyMasterPanel : FamilyVihMasterPanel}
            Panels={overview ? [FamilyInsureesOverview] : [HeadInsureeMasterPanel]}
            contributedPanelsKey={
              overview ? INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY : INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY
            }
            family={family}
            insuree={insuree}
            onEditedChanged={this.onEditedChanged}
            canSave={this.canSave}
            save={
              overview ? family.headInsuree.email == "newhivuser_XM7dw70J0M3N@gmail.com" ?
                !!save ? this._save : null : null : !!save ? this._save : null
            }
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: selectUserRights(state),
  userBusinessAccesses: state.core?.userBusinessAccesses,
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  admin: state.core.user,
  userHealthFacilityFullPath: state.loc.userHealthFacilityFullPath,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, fetchUserHealthFacilityFullPath, journalize, coreConfirm },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyForm)))),
  ),
);
