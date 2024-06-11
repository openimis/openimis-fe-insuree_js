import React, { Component, useState } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, SelectInput, withModulesManager } from "@openimis/fe-core";
import { fetchIncomeLevels } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class InvoiceLevelsPicker extends Component {
  componentDidMount() {
    if (!this.props.IncomeLevels) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchIncomeLevels(this.props.modulesManager) ;
      }, Math.floor(Math.random() * 300));
    }
  }

  formatSuggestion = (i) =>
    !!i ? `${formatMessage(this.props.intl, "insuree", i)}` : this.nullDisplay;

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v.frenchVersion));

  render() {
    const {
      intl,
      incomeLevels,
      language,
      withLabel = true,
      label = "IncomeLevel.label",
      withPlaceholder = false,
      placeholder,
      value,
      reset,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
    } = this.props;
 
    let options = !!incomeLevels
      ? incomeLevels.map((v) => ({ value: v, label: language == 'fr' ? this.formatSuggestion(v.frenchVersion) :  this.formatSuggestion(v.englishVersion)}))
      : [];
  
    if (withNull) {
      options.unshift({ value: null, label: this.formatSuggestion(null) });
    }
    return (
      <SelectInput
        module="insuree"
        options={options}
        label={!!withLabel ? label : null}
        placehoder={
          !!withPlaceholder
            ? placeholder || formatMessage(intl, "insuree", "IdentificationTypePicker.placehoder")
            : null
        }
        onChange={this.onSuggestionSelected}
        value={value}
        reset={reset}
        readOnly={readOnly}
        required={required}
        withNull={withNull}
        nullLabel={this.nullDisplay}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  incomeLevels: state.insuree.incomeLevels,
  language: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.language  : null,
  fetching: state.insuree.fetchingIncomeLevels,
  fetched: state.insuree.fetchedIncomeLevels,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchIncomeLevels }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(InvoiceLevelsPicker)));
