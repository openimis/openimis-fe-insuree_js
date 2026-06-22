import { Grid } from "@mui/material";
import { PublishedComponent } from "@openimis/fe-core";
import React from "react";

const EnrolledFamiliesReport = (props) => {
  const { values, setValues } = props;

  return (
    <Grid container direction="column" spacing={1}>
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
          required
          value={values.location}
        />
      </Grid>
      <Grid>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateFrom}
          module="insuree"
          required
          label="EnrolledFamiliesReport.dateFrom"
          onChange={(dateFrom) => setValues({ ...values, dateFrom })}
        />
      </Grid>
      <Grid>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateTo}
          module="insuree"
          required
          label="EnrolledFamiliesReport.dateTo"
          onChange={(dateTo) => setValues({ ...values, dateTo })}
        />
      </Grid>
    </Grid>
  );
};

export default EnrolledFamiliesReport;
