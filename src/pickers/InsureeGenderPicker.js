import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from 'react-intl';
import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { fetchInsureeGenders } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class InsureeGenderPicker extends Component {

    constructor(props) {
        super(props);
        this.selectThreshold = props.modulesManager.getConf("fe-insuree", "InsureeGenderPicker.selectThreshold", 10);
    }

    componentDidMount() {
        if (!this.props.insureeGenders) {
            // prevent loading multiple times the cache when component is
            // several times on a page
            setTimeout(
                () => {
                    !this.props.fetching && !this.props.fetched && this.props.fetchInsureeGenders(this.props.modulesManager)
                },
                Math.floor(Math.random() * 300)
            );
        }
    }

    nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `InsureeGender.null`)

    formatSuggestion = i => !!i ? `${formatMessage(this.props.intl, "insuree", `InsureeGender.${i}`)}` : this.nullDisplay

    onSuggestionSelected = v => this.props.onChange(v, this.formatSuggestion(v));

    render() {
        const { intl, insureeGenders, withLabel = true, label, withPlaceholder = false, placeholder, value, reset,
            readOnly = false, required = false,
            withNull = false, nullLabel = null
        } = this.props;
        return <AutoSuggestion
            module="medical"
            items={insureeGenders}
            label={!!withLabel && (label || formatMessage(intl, "insuree", "InsureeGenderPicker.label"))}
            placeholder={!!withPlaceholder ? (placeholder || formatMessage(intl, "insuree", "InsureeGenderPicker.placehoder")) : null}
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
    insureeGenders: state.insuree.insureeGenders,
    fetching: state.insuree.fetchingInsureeGenders,
    fetched: state.medical.fetchedInsureeGenders,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ fetchInsureeGenders }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(
    withModulesManager(InsureeGenderPicker)));
