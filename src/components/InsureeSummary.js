import React, { Fragment } from "react";
import { injectIntl } from "react-intl";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Box, Typography, Button } from "@material-ui/core";
import {
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
  formatDateFromISO,
  Contributions,
  ControlledField,
  historyPush,
  withHistory,
} from "@openimis/fe-core";

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = "insuree.InsureeSummaryAvatar";
const INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY = "insuree.InsureeSummaryCore";
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = "insuree.InsureeSummaryExt";
const INSUREE_SUMMARY_CONTRIBUTION_KEY = "insuree.InsureeSummary";

const useStyles = makeStyles(() => ({
  label: {
    textAlign: "right",
  },
}));

function goToFamilyUuid(mm, history, uuid) {
  historyPush(mm, history, "insuree.route.familyOverview", [uuid], true);
}

const formatLocationString = (location) => {
  return [location?.parent?.parent?.name,
    location?.parent?.name,
    location?.name].filter(Boolean).join(', ')
}

const InsureeSummary = (props) => {
  const { insuree, intl, modulesManager, className, history } = props;
  const classes = useStyles();
  const hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  const hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;
  const showInsureeSummaryAddress = props.modulesManager.getConf(
    "fe-insuree",
    "showInsureeSummaryAddress",
    false
  );

  return (
    <Grid container className={className}>
      {hasAvatarContribution && (
        <Box mr={3}>
          <Contributions readOnly photo={insuree.photo} contributionKey={INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY} />
        </Box>
      )}
      <Box flexGrow={1}>
        <ControlledField
          module="insuree"
          id="InsureeSummary.chfId"
          field={
            <Typography className={classes.rawValue} variant="h4">
              {insuree.chfId}
            </Typography>
          }
        />
        <Grid item container xs={12} spacing={5}>
          <Grid item>
            <div>
              <Box>
                <Typography className={classes.rawValue} variant="h6">
                  {insuree && (
                    <Fragment>
                      <ControlledField
                        module="insuree"
                        id="InsureeSummary.otherNames"
                        field={`${insuree.otherNames} `}
                      />
                      <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree.lastName} />
                    </Fragment>
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography className={classes.rawValue}>
                  <Fragment>
                    <ControlledField
                      module="insuree"
                      id="InsureeSummary.dob"
                      field={formatDateFromISO(modulesManager, intl, insuree.dob)}
                    />
                    <ControlledField
                      module="insuree"
                      id="InsureeSummary.age"
                      field={` (${insuree.age} ${formatMessage(intl, "insuree", "ageUnit")})`}
                    />
                  </Fragment>
                </Typography>
              </Box>
              <Box>
                <ControlledField
                  module="insuree"
                  id="InsureeSummary.gender"
                  field={
                    <Grid item xs={12}>
                      <Typography className={classes.rawValue}>{insuree.gender?.gender}</Typography>
                    </Grid>
                  }
                />
              </Box>
              {showInsureeSummaryAddress && <Box>
                <ControlledField
                  module="insuree"
                  id="InsureeSummary.insureeLocation"
                  field={
                    <Grid item xs={12}>
                      <Typography className={classes.rawValue}>{
                        formatMessageWithValues(intl, "insuree", "InsureeSummary.insureeLocation", 
                        {
                          location: `${formatLocationString(insuree?.family?.location)}`,
                        })
                        }
                      </Typography>
                    </Grid>
                  }
                />
              </Box>}

              <Contributions contributionKey={INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY} insuree={insuree} />
            </div>
          </Grid>
          {hasExtContributions && (
            <Grid item>
              <Contributions contributionKey={INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY} insuree={insuree} />
            </Grid>
          )}
          {!!insuree?.family?.uuid && (
            <Grid item>
              <Button 
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={() => goToFamilyUuid(modulesManager, history, insuree.family.uuid)}
              >
                {formatMessage(intl, "insuree", "insureeSummaries.goToFamilyButton")}
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
      <Grid item xs={12}>
        <Contributions contributionKey={INSUREE_SUMMARY_CONTRIBUTION_KEY} insuree={insuree} />
      </Grid>
    </Grid>
  );
};

export default withModulesManager(withHistory(injectIntl(InsureeSummary)));
