import { Grid } from "@mui/material";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const InsureeMissingPhotoReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
        <PublishedComponent
          pubRef="insuree.InsureeOfficerPicker"
          value={values.officer}
          module="insuree"
          label={formatMessage("InsureeMissingPhotoReport.officer")}
          onChange={(officer) => setValues({ ...values, officer })}
        />
      </Grid>
      <Grid>
        <PublishedComponent
          pubRef="location.LocationCascader"
          module="location"
          onChange={(location) =>
            setValues({
              ...values,
              location,
            })
          }
          value={values.location}
        />
      </Grid>
    </Grid>
  );
};

export default InsureeMissingPhotoReport;
