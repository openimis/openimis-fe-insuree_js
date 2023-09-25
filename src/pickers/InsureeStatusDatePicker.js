import React, { useState } from "react";
import {
  ConstantBasedPicker,
  useModulesManager,
  useTranslations,
  Autocomplete,
  useGraphqlQuery,
  PublishedComponent,
} from "@openimis/fe-core";
import { Grid } from "@material-ui/core";
import _debounce from "lodash/debounce";

import { INSUREE_STATUS } from "../constants";

const InsureeStatusDatePicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    value,
    filterOptions,
    filterSelectedOptions,
    multiple,
    extraFragment,
    edited,
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  return (
    <PublishedComponent
      pubRef="core.DatePicker"
      value={edited?.insureeStatusDate ?? ""}
      module="insuree"
      label="Insuree.statusDate"
      readOnly={readOnly}
      onChange={(p) => updateAttribute("insureeStatusDate", p)}
    />
  )
};

export default InsureeStatusDatePicker;
