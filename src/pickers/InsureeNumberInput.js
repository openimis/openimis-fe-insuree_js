import React from "react";
import {
  withModulesManager,
  useModulesManager,
  ValidatedTextInput,
} from "@openimis/fe-core";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import {insureeNumberValidationCheck, insureeNumberValidationClear} from "../actions";


const InsureeNumberInput = (props) => {
  const { value, onChange, className, label = "Insuree.chfId", placeholder, readOnly, required,
          isInsureeNumberValid, isInsureeNumberValidating, insureeNumberValidationError } = props;
  const modulesManager = useModulesManager();
  const numberMaxLength = modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12)

  const shouldValidate = (inputValue) => {
    const { savedInsureeNumber } = props;
    return inputValue !== savedInsureeNumber;
  };

  return (
    <ValidatedTextInput
      itemQueryIdentifier="number"
      codeTakenLabel={"InsureeNumberInput.error"}
      shouldValidate={shouldValidate}
      isValid={isInsureeNumberValid}
      isValidating={isInsureeNumberValidating}
      validationError={insureeNumberValidationError}
      action={insureeNumberValidationCheck}
      clearAction={insureeNumberValidationClear}
      module="insuree"
      className={className}
      readOnly={readOnly}
      required={required}
      label={label}
      placeholder={placeholder}
      value={value}
      inputProps={{ maxLength: numberMaxLength}}
      onChange={onChange}
    />
  );
};

const mapStateToProps = (state) => ({
    isInsureeNumberValid: state.insuree.validationFields?.insureeNumber?.isValid,
    isInsureeNumberValidating: state.insuree.validationFields?.insureeNumber?.isValidating,
    insureeNumberValidationError: state.insuree.validationFields?.insureeNumber?.validationError,
    savedInsureeNumber: state.insuree?.insuree?.chfId,
  });


export default withModulesManager(connect(mapStateToProps)(injectIntl(InsureeNumberInput)));
