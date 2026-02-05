import React, { useState } from "react";

import { Grid, FormControlLabel, Checkbox } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  PublishedComponent,
  TextInput,
  useTranslations,
  useModulesManager
} from "@openimis/fe-core";
import { EMPTY_STRING, MODULE_NAME } from "../constants";

const StyledInsureeAddress = styled('div')(({ theme }) => ({
  '& .item': theme?.paper?.item ?? {},
  '& .locationWrapper': {
    paddingLeft: theme?.spacing ? theme.spacing(1) : 8,
    paddingRight: theme?.spacing ? theme.spacing(1) : 8,
  },
}));

const InsureeAddress = ({
  onChangeLocation,
  onChangeAddress,
  readOnly,
  value,
}) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const [location, setLocation] = useState(true);
  const [address, setAddress] = useState(true);

  return (
    <StyledInsureeAddress>
      <Grid container>
        <Grid size={6} className="item">
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={location}
                disabled={readOnly}
                onChange={(e) => setLocation((prevState) => !prevState)}
              />
            }
            label={formatMessage("Insuree.currentVillage.sameAsFamily")}
          />
          {!location &&
            <div className="locationWrapper">
              <PublishedComponent
                pubRef="location.DetailedLocation"
                withNull={true}
                value={value?.currentVillage ?? null}
                split={true}
                readOnly={readOnly}
                onChange={onChangeLocation}
                filterLabels={false}
              />
            </div>
          }
        </Grid>
        <Grid size={6} className="item">
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={address}
                disabled={readOnly}
                onChange={(e) => setAddress((prevState) => !prevState)}
              />
            }
            label={formatMessage("Insuree.currentAddress.sameAsFamily")}
          />
          {!address &&
            <TextInput
              module="insuree"
              label="Insuree.currentAddress"
              multiline
              rows={4}
              readOnly={readOnly}
              value={value?.currentAddress ?? EMPTY_STRING}
              onChange={onChangeAddress}
            />
          }
        </Grid>
      </Grid>
    </StyledInsureeAddress>
  )
}

export default InsureeAddress;
