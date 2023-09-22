import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Typography, Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  useParams,
  useTranslations,
  useModulesManager,
  ProgressOrError,
  Contributions,
  ControlledField,
} from "@openimis/fe-core";
import { fetchInsureeFull } from "../actions";
import { DEFAULT, MODULE_NAME } from "../constants";
import { formatLocationString } from "../utils/utils";
import FamilyMembersTable from "../components/FamilyMembersTable";

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  title: theme.paper.title,
  item: theme.paper.item,
}));

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = "insuree.InsureeSummaryAvatar";
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = "insuree.InsureeSummaryExt";

const ProfilePage = () => {
  const { insuree_uuid } = useParams();
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations(MODULE_NAME, modulesManager);

  const { fetchingInsuree, insuree, errorInsuree } = useSelector((store) => store.insuree);

  const hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  const hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;

  const showInsureeSummaryAddress = modulesManager.getConf(
    "fe-insuree",
    "showInsureeSummaryAddress",
    DEFAULT.SHOW_INSUREE_SUMMARY_ADDRESS,
  );

  console.log(insuree);

  useEffect(() => {
    if (insuree_uuid) dispatch(fetchInsureeFull(modulesManager, insuree_uuid));
  }, [insuree_uuid, dispatch, modulesManager]);

  if (fetchingInsuree || errorInsuree) {
    return <ProgressOrError progress={fetchingInsuree} error={errorInsuree} />;
  }

  return (
    <Box className={classes.page}>
      <Paper className={classes.paper}>
        <Typography className={classes.title} variant="h6">
          {formatMessage("link.profile")}
        </Typography>
        <Grid item xs={12} container className={classes.item} display="flex">
          {hasAvatarContribution && (
            <Box mr={3}>
              <Contributions
                readOnly
                photo={insuree?.photo}
                contributionKey={INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY}
              />
            </Box>
          )}
          <Box mr={10}>
            <ControlledField
              module="insuree"
              id="InsureeSummary.chfId"
              field={<Typography variant="h4">{insuree?.chfId}</Typography>}
            />
            <Box>
              <Typography variant="h6">
                {insuree && (
                  <Fragment>
                    <ControlledField
                      module="insuree"
                      id="InsureeSummary.otherNames"
                      field={`${insuree?.otherNames} `}
                    />
                    <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree?.lastName} />
                  </Fragment>
                )}
              </Typography>
            </Box>
            <Box>
              <Typography>
                <Fragment>
                  <ControlledField
                    module="insuree"
                    id="InsureeSummary.dob"
                    field={formatDateFromISO(modulesManager, null, insuree?.dob)}
                  />
                  <ControlledField
                    module="insuree"
                    id="InsureeSummary.age"
                    field={` (${insuree?.age} ${formatMessage("ageUnit")})`}
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
                    <Typography> {insuree?.gender?.gender} </Typography>
                  </Grid>
                }
              />
            </Box>
            {showInsureeSummaryAddress && (
              <Box>
                <ControlledField
                  module="insuree"
                  id="InsureeSummary.insureeLocation"
                  field={
                    <Grid item xs={12}>
                      <Typography>
                        {formatMessageWithValues("InsureeSummary.insureeLocation", {
                          location: `${formatLocationString(insuree?.family?.location)}`,
                        })}
                      </Typography>
                    </Grid>
                  }
                />
              </Box>
            )}
          </Box>
          {hasExtContributions && (
            <Box>
              <Contributions contributionKey={INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY} insuree={insuree} />
            </Box>
          )}
          <Box>
            <FamilyMembersTable />
          </Box>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
