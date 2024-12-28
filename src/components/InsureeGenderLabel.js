import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, withModulesManager } from "@openimis/fe-core";
import { fetchInsureeGenders } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class InsureeGenderLabel extends Component {
  componentDidMount() {
    if (!this.props.insureeGenders) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchInsureeGenders(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `InsureeGender.null`);

  formatSuggestion = (i) =>
    !!i ? `${formatMessage(this.props.intl, "insuree", `InsureeGender.${i}`)}` : this.nullDisplay;

  onSuggestionSelected = (v) => {
    this.props.onChange(v, this.formatSuggestion(v));
  };

  render() {
    const { value } = this.props;
    return this.formatSuggestion(value);
  }
}
const mapStateToProps = (state) => ({
  insureeGenders: state.insuree.insureeGenders,
  fetching: state.insuree.fetchingInsureeGenders,
  fetched: state.medical.fetchedInsureeGenders,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchInsureeGenders }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(InsureeGenderLabel)));
