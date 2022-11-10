import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { TextInput, useDebounceCb, useModulesManager, useTranslations, useGraphqlQuery } from "@openimis/fe-core";
import { InputAdornment, CircularProgress, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import CheckOutlinedIcon from "@material-ui/icons/CheckOutlined";
import ErrorOutlineOutlinedIcon from "@material-ui/icons/ErrorOutlineOutlined";

const useStyles = makeStyles((theme) => ({
  validIcon: {
    color: "green",
  },
  invalidIcon: {
    color: theme.palette.error.main,
  },
}));

const operation = `
  query ($number: String!, $newInsuree: Boolean) {
    isValid: insureeNumberValidity(insureeNumber: $number, newInsuree: $newInsuree)
  }
`;

const InsureeNumberInput = (props) => {
  const { value, new_insuree, onChange, className, label = "Insuree.chfId", placeholder, readOnly, required } = props;
  const [internalValue, setInternalValue] = useState(value);
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);
  const classes = useStyles();
  const {
    isLoading,
    data,
    error: graphqlError,
  } = useGraphqlQuery(operation, { number: internalValue, newInsuree: new_insuree }, { skip: !internalValue });

  const handleValueChange = useDebounceCb((val) => {
    if (val) {
      setInternalValue(val);
    } else {
      onChange(val);
    }
  }, modulesManager.getConf("fe-insuree", "debounceTime", 400));

  const isValid = !isLoading && data?.isValid;
  const isInvalid = !isLoading && data && !data.isValid;

  useEffect(() => {
    if (isValid && internalValue !== value) {
      onChange(internalValue);
    }
  }, [isValid]);

  return (
    <TextInput
      module="insuree"
      className={className}
      disabled={readOnly}
      required={required}
      label={label}
      placeholder={placeholder}
      error={graphqlError || isInvalid ? formatMessage("InsureeNumberInput.error") : null}
      value={value}
      new_insuree={new_insuree}
      inputProps={{ maxLength: modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12) }}
      endAdornment={
        <InputAdornment position="end" className={clsx(isValid && classes.validIcon, isInvalid && classes.invalidIcon)}>
          <>
            {isLoading && (
              <Box mr={1}>
                <CircularProgress size={20} />
              </Box>
            )}
            {isValid && <CheckOutlinedIcon size={20} />}
            {isInvalid && <ErrorOutlineOutlinedIcon size={20} />}
          </>
        </InputAdornment>
      }
      onChange={handleValueChange}
    />
  );
};

export default InsureeNumberInput;
