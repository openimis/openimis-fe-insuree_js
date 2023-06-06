import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import _debounce from "lodash/debounce";

import { Grid } from "@material-ui/core";

import { useModulesManager, TextInput, ProgressOrError, useTranslations } from "@openimis/fe-core";
import { fetchInsureeNameByChfId } from "../actions";

const InsureeNameByChfIdPicker = ({ readOnly = false, required = false, onChange }) => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);
  const chfIdMaxLength = modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12);
  const debounceTime = modulesManager.getConf("fe-insuree", "debounceTime", 800);
  const notFoundMessage = formatMessage("notFound");
  const { fetchingInsureeName, errorInsureeName, insureeName } = useSelector((store) => store.insuree);
  const [search, setSearch] = useState();

  const formatInsureeName = (name) => {
    if (!search) return null;

    return !!name ? name : notFoundMessage;
  };

  const fetch = (chfId) => {
    setSearch(chfId);
    dispatch(fetchInsureeNameByChfId(modulesManager, chfId));
  };

  const debouncedFetch = _debounce(fetch, debounceTime);

  useEffect(() => {
    const formattedName = formatInsureeName(insureeName);
    if (insureeName) {
      onChange(formattedName);
    }
  }, [insureeName]);

  return (
    <Grid container>
      <Grid item xs={4}>
        <TextInput
          readOnly={readOnly}
          autoFocus={true}
          module="insuree"
          label="Insuree.chfId"
          value={search}
          onChange={(v) => debouncedFetch(v)}
          inputProps={{
            "maxLength": chfIdMaxLength,
          }}
          required={required}
        />
      </Grid>
      <Grid item xs={8}>
        <ProgressOrError progress={fetchingInsureeName} error={errorInsureeName} />
        {!fetchingInsureeName && (
          <TextInput readOnly={true} module="insuree" label="Insuree.names" value={formatInsureeName(insureeName)} />
        )}
      </Grid>
    </Grid>
  );
};

export default InsureeNameByChfIdPicker;
