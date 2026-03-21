import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { styled } from "@mui/material/styles";

import {
  formatMessageWithValues,
  formatMessage,
  withModulesManager,
  withHistory,
  historyPush,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  parseData,
  Helmet,
  GetIconComponent,
} from "@openimis/fe-core";
import { fetchFamily, newFamily, createFamily, fetchFamilyMutation, fetchParentFamily } from "../actions";
import { INSUREE_ACTIVE_STRING, RIGHT_FAMILY, FAMILY_TYPE_POLYGAMY_CODE } from "../constants";
import { insureeLabel, isValidInsuree } from "../utils/utils";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";
import FamilyMasterPanel from "./FamilyMasterPanel";
import FamilyInsureesOverview from "./FamilyInsureesOverview";
import SubFamiliesSummary from "./SubFamiliesSummary";

const ReplayIcon = GetIconComponent("Replay");

const StyledFamilyForm = styled('div')(({ theme }) => ({
  '& .lockedPage': theme?.page?.locked ?? {},
}));

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const FAMILY_POLYGAMOUS_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.PolygamousFamilyOverview.panels";
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
    if (this.props.family_uuid) {
      this.setState(
        (state, props) => ({ family_uuid: props.family_uuid }),
        (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
      );
    }
    if (this.props.parent_uuid) {
      this.props.fetchParentFamily(this.props.modulesManager, this.props.parent_uuid);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const handlers = [
      { 
        condition: () => prevProps.parent_uuid !== this.props.parent_uuid && !!this.props.parent_uuid,
        handler: () => this.props.fetchParentFamily(this.props.modulesManager, this.props.parent_uuid)
      },
      {
        condition: () => prevProps.family_uuid !== this.props.family_uuid && !!this.props.family_uuid,
        handler: () => this.setState(
          { family_uuid: this.props.family_uuid, lockNew: false, newFamily: false },
          () => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid)
        )
      },
      {
        condition: () => !prevProps.fetchedFamily && !!this.props.fetchedFamily,
        handler: () => this.updateFamilyFromProps(prevProps)
      },
      {
        condition: () => prevProps.family_uuid && !this.props.family_uuid,
        handler: () => this.setState({ family: this._newFamily(), newFamily: true, lockNew: false, family_uuid: null })
      },
      {
        condition: () => prevProps.submittingMutation && !this.props.submittingMutation,
        handler: () => {
          this.props.journalize(this.props.mutation);
          this.setState((state, props) => ({
            family: { ...state.family, clientMutationId: props.mutation.clientMutationId }
          }));
        }
      },
      {
        condition: () => prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction,
        handler: () => this.state.confirmedAction()
      }
    ];

    for (const { condition, handler } of handlers) {
      if (condition()) {
        handler();
        return;
      }
    }
  }

  updateFamilyFromProps(prevProps) {
    var family = this.props.family;
    if (family) {
      family.ext = !!family.jsonExt ? JSON.parse(family.jsonExt) : {};
      this.setState({ family, family_uuid: family.uuid, lockNew: false, newFamily: false });
      if (family?.parent?.uuid && family.parent.uuid !== prevProps?.parentFamily?.uuid) {
        this.props.fetchParentFamily(this.props.modulesManager, family.parent.uuid);
      }
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
    if (!this.state.family.uuid && !this.props.isChfIdValid) return false;
    if (this.state.family.validityTo) return false;
    if (this.state.family.confirmationType?.isConfirmationNumberRequired && !this.state.family.confirmationNo)
      return false;
    return this.state.family.headInsuree && isValidInsuree(this.state.family.headInsuree, this.props.modulesManager);
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
      parent_uuid,
      parentFamily,
      totalPoliciesAmount,
      totalContributions,
    } = this.props;
    const { family, newFamily, isSaved } = this.state;
    
    if (!rights.includes(RIGHT_FAMILY)) return null;
    
    let runningMutation = !!family && !!family.clientMutationId;
    let contributedMutations = modulesManager.getContribs(INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY);
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    
    let actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        buttonText: formatMessage(this.props.intl, "insuree", "FamilyReload.buttonText") || "Reload",
        onlyIfDirty: !readOnly && !runningMutation && !isSaved,
      },
    ];
    
    const shouldBeLocked = !!runningMutation || family?.validityTo;
    
    let panels;
    let contributedPanelsKey;
    
  const isPolygamy = family.familyType?.code === FAMILY_TYPE_POLYGAMY_CODE;

  if (!overview) {
    panels = [HeadInsureeMasterPanel];
    contributedPanelsKey = INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY;
  } else if (isPolygamy) {
    panels = [HeadInsureeMasterPanel, SubFamiliesSummary];
    contributedPanelsKey = FAMILY_POLYGAMOUS_OVERVIEW_PANELS_CONTRIBUTION_KEY;
  } else {
    panels = [FamilyInsureesOverview];
    contributedPanelsKey = INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY;
  }
    
    return (
      <StyledFamilyForm>
        <div className={shouldBeLocked ? 'lockedPage' : null}>
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
              back={back}
              add={!!add && !newFamily ? this._add : null}
              readOnly={readOnly || runningMutation || !!family.validityTo}
              actions={actions}
              openFamilyButton={openFamilyButton}
              overview={overview}
              parent_uuid={parent_uuid}
              parentFamily={parentFamily}
              HeadPanel={FamilyMasterPanel}
              Panels={panels}
              contributedPanelsKey={contributedPanelsKey}
              family={family}
              insuree={insuree}
              onEditedChanged={this.onEditedChanged}
              canSave={this.canSave}
              save={!!save ? this._save : null}
              onActionToConfirm={this.onActionToConfirm}
              openDirty={save}
              totalPoliciesAmount={totalPoliciesAmount}
              totalContributions={totalContributions}
            />
          )}
        </div>
      </StyledFamilyForm>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  parentFamily: state.insuree.parentFamily,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
  totalPoliciesAmount: state.policy?.policy 
    ? (parseFloat(state.policy.policy.policyValue) || 0)
    : state.policy?.policies?.reduce(
        (sum, policy) => sum + (parseFloat(policy.policyValue) || 0), 
        0
      ) || 0,
  totalContributions: state.contribution?.policiesPremiums?.reduce(
    (sum, contribution) => sum + (parseFloat(contribution.amount) || 0), 
    0
  ) || 0,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, fetchParentFamily, journalize, coreConfirm },
    dispatch,
  );
};

export { StyledFamilyForm };
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(FamilyForm)),
  ),
);
