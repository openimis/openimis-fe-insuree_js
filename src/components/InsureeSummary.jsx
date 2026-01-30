import React, { Fragment } from "react";
import { injectIntl } from "react-intl";

import { Grid, Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { People } from "@mui/icons-material";

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
import { DEFAULT } from "../constants";
import { formatLocationString } from "../utils/utils";
import InsureeProfileLink from "./InsureeProfileLink";

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = "insuree.InsureeSummaryAvatar";
const INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY = "insuree.InsureeSummaryCore";
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = "insuree.InsureeSummaryExt";
const INSUREE_SUMMARY_CONTRIBUTION_KEY = "insuree.InsureeSummary";

const StyledInsureeSummary = styled('div')(({ theme }) => ({
  '& .label': {
    marginLeft: "10px",
  },
}));

function goToFamilyUuid(modulesManager, history, uuid) {
  historyPush(modulesManager, history, "insuree.route.familyOverview", [uuid], true);
}

const InsureeSummary = (props) => {
  const { insuree, intl, modulesManager, className, history } = props;
  const hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  const hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;
  const showInsureeSummaryAddress = modulesManager.getConf(
    "fe-insuree",
    "showInsureeSummaryAddress",
    DEFAULT.SHOW_INSUREE_SUMMARY_ADDRESS
  );
  const showInsureeProfile = modulesManager.getConf(
    "fe-insuree",
    "InsureeSummary.showInsureeProfileLink",
    DEFAULT.SHOW_INSUREE_PROFILE,
  );
  const renderLastNameFirst = modulesManager.getConf(
    "fe-insuree",
    "renderLastNameFirst",
    DEFAULT.RENDER_LAST_NAME_FIRST,
  );

  return (
    <StyledInsureeSummary>
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
              <Typography className="rawValue" variant="h4">
                {insuree.chfId}
              </Typography>
            }
          />
          <Grid container size={12} spacing={5}>
            <Grid>
              <div>
                <Box>
                  <Typography className="rawValue" variant="h6">
                    {insuree && (
                      <Fragment>
                        {renderLastNameFirst ? (
                          <>
                            <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree.lastName} />{" "}
                            <ControlledField
                              module="insuree"
                              id="InsureeSummary.otherNames"
                              field={`${insuree.otherNames}`}
                            />
                          </>
                        ) : (
                          <>
                            <ControlledField
                              module="insuree"
                              id="InsureeSummary.otherNames"
                              field={`${insuree.otherNames}`}
                            />
                            <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree.lastName} />
                          </>
                        )}
                      </Fragment>
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography className="rawValue">
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
                      <Grid size={12}>
                        <Typography className="rawValue">{insuree.gender?.gender}</Typography>
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
                        <Grid size={12}>
                          <Typography className="rawValue">
                            {formatMessageWithValues(intl, "insuree", "InsureeSummary.insureeLocation", {
                              location: insuree?.family
                                ? `${formatLocationString(insuree.family)}`
                                : formatMessage(intl, "insuree", "notFound"),
                            })}
                          </Typography>
                        </Grid>
                      }
                    />
                  </Box>
                )}

                <Contributions contributionKey={INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY} insuree={insuree} />
              </div>
            </Grid>
            {hasExtContributions && (
              <Grid>
                <Contributions contributionKey={INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY} insuree={insuree} />
              </Grid>
            )}
            {!!insuree?.family?.uuid && (
              <Grid>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => goToFamilyUuid(modulesManager, history, insuree.family.uuid)}
                >
                  <People />
                  <span className="label">
                    {formatMessage(intl, "insuree", "insureeSummaries.goToFamilyButton")}
                  </span>
                </Button>
              </Grid>
            )}
            {showInsureeProfile && (
              <Grid>
                <InsureeProfileLink insureeUuid={insuree.uuid} />
              </Grid>
            )}
          </Grid>
        </Box>
        <Grid size={12}>
          <Contributions contributionKey={INSUREE_SUMMARY_CONTRIBUTION_KEY} insuree={insuree} />
        </Grid>
      </Grid>
    </StyledInsureeSummary>
  );
};

export { INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY };
export default withModulesManager(withHistory(injectIntl(InsureeSummary)));
