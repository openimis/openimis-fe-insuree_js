import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from 'react-intl';
import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { fetchFamilyTypes } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class FamilyTypePicker extends Component {

    constructor(props) {
        super(props);
        this.selectThreshold = props.modulesManager.getConf("fe-insuree", "FamilyTypePicker.selectThreshold", 10);
    }

    componentDidMount() {
        if (!this.props.familyTypes) {
            // prevent loading multiple times the cache when component is
            // several times on a page
            setTimeout(
                () => {
                    !this.props.fetching && !this.props.fetched && this.props.fetchFamilyTypes(this.props.modulesManager)
                },
                Math.floor(Math.random() * 300)
            );
        }
    }

    nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `FamilyType.null`)

    formatSuggestion = i => !!i ? `${formatMessage(this.props.intl, "insuree", `FamilyType.${i}`)}` : this.nullDisplay

    onSuggestionSelected = v => this.props.onChange(v, this.formatSuggestion(v));

    render() {
        const { intl, familyTypes, withLabel = true, label, withPlaceholder = false, placeholder, value, reset,
            readOnly = false, required = false,
            withNull = false, nullLabel = null
        } = this.props;
        return <AutoSuggestion
            module="medical"
            items={familyTypes}
            label={!!withLabel && (label || formatMessage(intl, "insuree", "FamilyTypePicker.label"))}
            placeholder={!!withPlaceholder ? (placeholder || formatMessage(intl, "insuree", "FamilyTypePicker.placehoder")) : null}
            getSuggestionValue={this.formatSuggestion}
            onSuggestionSelected={this.onSuggestionSelected}
            value={value}
            reset={reset}
            readOnly={readOnly}
            required={required}
            selectThreshold={this.selectThreshold}
            withNull={withNull}
            nullLabel={this.nullDisplay}
        />
    }
}

const mapStateToProps = state => ({
    familyTypes: state.insuree.familyTypes,
    fetching: state.insuree.fetchingFamilyTypes,
    fetched: state.medical.fetchedFamilyTypes,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ fetchFamilyTypes }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(
    withModulesManager(FamilyTypePicker)));
