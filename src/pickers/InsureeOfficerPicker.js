import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { fetchInsureeOfficers } from "../actions";
import { formatMessage, AutoSuggestion, ProgressOrError, withModulesManager, decodeId } from "@openimis/fe-core";
import { DEFAULT } from "../constants";

const styles = (theme) => ({
  label: {
    color: theme.palette.primary.main,
  },
});

class InsureeOfficer extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-insuree", "InsureeOfficer.selectThreshold", 10);
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
    this.isCurrentAdminEnrollmentOfficerActive = props.modulesManager.getConf("fe-insuree", "isCurrentAdminEnrollmentOfficerActive", false);
    this.currentEO = null;
  }

  componentDidMount() {
   if (!this.props.fetchedInsureeOfficers || this.isCurrentAdminEnrollmentOfficerActive) {
      const filters = [];
      if(!!this.props.locationId){
        filters.push(`locationId:"${decodeId(this.props.locationId)}"`)
      }
      // prevent loading multiple times the cache when component is
      // several times on the page

      setTimeout(() => {
        !this.props.fetchingInsureeOfficers && this.props.fetchInsureeOfficers(this.props.modulesManager, filters);
      }, Math.floor(Math.random() * 300));
    }
  }

  isEnrollmentAdminOfficer = (user, insureeOfficers) => {
    for (let i = 0; i < insureeOfficers.length; i++) {
      if (user.username.trim() === insureeOfficers[i].code.trim()) {
        this.currentEO = insureeOfficers[i];
        return true;
      }
    }
    return false;
  } 

    componentDidUpdate(prevProps) {
    // Recharger les données si locationId change
    if (this.props.locationId !== prevProps.locationId) {
      const { locationId } = this.props
      const filters = [];
      if (locationId != undefined && locationId != "" ) {
        filters.push(`locationId:"${decodeId(locationId)}"`)
      }
      this.props.fetchInsureeOfficers(this.props.modulesManager, filters);
      }

    if (this.isCurrentAdminEnrollmentOfficerActive == true &&
      this.props.insureeOfficers !== prevProps.insureeOfficers &&
      this.props.insureeOfficers &&
      this.props.insureeOfficers.length > 0 && this.isEnrollmentAdminOfficer(this.props.user, this.props.insureeOfficers)) {
      this.props.onChange(
        this.currentEO,
        this.formatSuggestion(this.currentEO)
      );
    }
  }

  formatSuggestion = (a) => {
    if (!a) return "";

    const fullName = this.renderLastNameFirst
      ? `${a.lastName} ${a.otherName || ""}`.trim()
      : `${a.otherName || ""} ${a.lastName}`.trim();

    return `${a.code} ${fullName}`.trim();
  };

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      value,
      reset,
      insureeOfficers,
      fetchingInsureeOfficers,
      fetchedInsureeOfficers,
      errorInsureeOfficers,
      withLabel = true,
      label,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
      user,
    } = this.props;
    let v = (insureeOfficers ? insureeOfficers.filter((o) => o.id === value) : []);
    v = v.length ? v[0] : null;
    return (
      <Fragment>
        <ProgressOrError progress={fetchingInsureeOfficers} error={errorInsureeOfficers} />
        {fetchedInsureeOfficers && (
          <AutoSuggestion
            module="insuree"
            items={insureeOfficers}
            label={!!withLabel && (label || formatMessage(intl, "insuree", "InsureeOfficer.label"))}
            getSuggestions={this.insureeOfficers}
            getSuggestionValue={this.formatSuggestion}
            onSuggestionSelected={this.onSuggestionSelected}
            value={this.isCurrentAdminEnrollmentOfficerActive == true && this.isEnrollmentAdminOfficer(user, insureeOfficers) ? this.currentEO : v}
            reset={reset}
            readOnly={this.isCurrentAdminEnrollmentOfficerActive == true && this.isEnrollmentAdminOfficer(user, insureeOfficers) ? true : readOnly}
            required={required}
            selectThreshold={this.selectThreshold}
            withNull={withNull}
            nullLabel={nullLabel || formatMessage(intl, "insuree", "insuree.InsureeOfficer.null")}
          />
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  insureeOfficers: state.insuree.insureeOfficers,
  fetchingInsureeOfficers: state.insuree.fetchingInsureeOfficers,
  fetchedInsureeOfficers: state.insuree.fetchedInsureeOfficers,
  errorInsureeOfficers: state.insuree.errorInsureeOfficers,
  user: state.core.user
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchInsureeOfficers }, dispatch);
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureeOfficer)))),
);
